<?php
/**
 * KARABO AI Chat Endpoint
 * POST /api/ai/chat.php
 * Body: { "message": "...", "history": [{"role":"user"|"model","text":"..."}] }
 * Returns: { "success": true, "reply": "...", "products": [...] }
 *
 * Restricted to public website information only.
 * Reads products (read-only) from DB; no auth data, orders, or admin info exposed.
 */

require_once '../config/database.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Basic rate limiting per IP (10 requests per minute)
$ip       = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rateKey  = sys_get_temp_dir() . '/karabo_rl_' . md5($ip) . '.json';
$now      = time();
$window   = 60;
$maxReqs  = 10;

if (file_exists($rateKey)) {
    $rl = json_decode(file_get_contents($rateKey), true) ?? ['count' => 0, 'start' => $now];
    if ($now - $rl['start'] < $window) {
        if ($rl['count'] >= $maxReqs) {
            jsonResponse(['error' => 'Too many requests. Please wait a moment.'], 429);
        }
        $rl['count']++;
    } else {
        $rl = ['count' => 1, 'start' => $now];
    }
} else {
    $rl = ['count' => 1, 'start' => $now];
}
file_put_contents($rateKey, json_encode($rl));

$body    = json_decode(file_get_contents('php://input'), true) ?? [];
$userMsg = trim($body['message'] ?? '');
$history = is_array($body['history'] ?? null) ? $body['history'] : [];

if ($userMsg === '') {
    jsonResponse(['error' => 'Message is required'], 400);
}
if (mb_strlen($userMsg) > 800) {
    jsonResponse(['error' => 'Message too long (max 800 characters)'], 400);
}

// Build Gemini direct endpoint URL
$geminiKey   = getenv('GEMINI_API_KEY') ?: '';
$geminiModel = getenv('GEMINI_MODEL')   ?: 'gemini-2.5-flash';

if ($geminiKey === '') {
    error_log('Karabo: GEMINI_API_KEY not set in .env');
    jsonResponse(['success' => false, 'error' => 'KARABO is not configured yet. Please contact info@biostecgroup.co.za.'], 503);
}

$aiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/'
       . urlencode($geminiModel)
       . ':generateContent?key='
       . urlencode($geminiKey);

// Fetch active products (public data only — no cost price, no admin notes)
try {
    $db      = getDB();
    $stmt    = $db->query(
        "SELECT id, name, slug, price, compare_at_price, grade, specs,
                featured_image, stock_quantity, short_description, brand, model
         FROM products
         WHERE is_active = 1
         ORDER BY is_featured DESC, stock_quantity DESC
         LIMIT 50"
    );
    $rows    = $stmt->fetchAll(PDO::FETCH_ASSOC);
    $catalog = [];
    foreach ($rows as $r) {
        $specs = json_decode($r['specs'] ?? '{}', true) ?? [];
        $catalog[] = [
            'id'          => (int)$r['id'],
            'name'        => $r['name'],
            'price_rand'  => 'R' . number_format((int)$r['price'], 0, '.', ','),
            'grade'       => $r['grade'],
            'in_stock'    => (int)$r['stock_quantity'] > 0,
            'cpu'         => $specs['cpu']     ?? null,
            'ram'         => $specs['ram']     ?? null,
            'storage'     => $specs['storage'] ?? null,
            'brand'       => $r['brand']       ?? null,
            'model'       => $r['model']       ?? null,
        ];
    }
} catch (Exception $e) {
    error_log('Karabo DB error: ' . $e->getMessage());
    $catalog = [];
}

$catalogJson = json_encode($catalog, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

$systemPrompt = <<<PROMPT
You are KARABO, a friendly and knowledgeable AI assistant for Biostec Group — a South African company that sells certified renewed business laptops based in Johannesburg.

## Company Information
- **Name**: Biostec Group
- **Phone**: +27 61 263 6912
- **Email**: info@biostecgroup.co.za
- **Location**: Johannesburg, South Africa (collection point — exact address shared after order)
- **Hours**: Monday–Friday 08:00–17:00 · Saturday 09:00–13:00 · Sunday Closed
- **Delivery**: Free nationwide delivery via The Courier Guy
- **Pickup**: Free Johannesburg collection
- **Warranty**: 3-month warranty on every device
- **Inspection**: Every laptop passes a 40-point quality inspection
- **Payment**: Secure checkout powered by Yoco (card payments)

## Product Grades
- **Grade A**: Like new — minimal or no visible signs of use
- **Grade B**: Good condition — light cosmetic wear only
- **Grade C**: Fair condition — fully functional, visible cosmetic wear

## Your Capabilities
You can help with:
1. Product recommendations based on user needs (coding, office work, school, etc.)
2. Explaining specs, grades, and pricing
3. Delivery, warranty, and return information
4. Contact details and business hours
5. General questions about the store

## Important Rules
- ONLY discuss information a customer can see on the Biostec website
- Never reveal backend systems, admin data, cost prices, or order details
- Never invent specs or prices — only use what is in the inventory below
- If unsure, direct the customer to contact support
- Keep responses concise, friendly, and helpful
- Always recommend in-stock products when possible

## Product Recommendations Format
When you recommend specific products, you MUST include a special tag at the very end of your response (after all your text) in exactly this format on its own line:
[RECOMMEND:1,2,3]
Replace the numbers with the actual product IDs from the inventory. Only include this tag when recommending specific products — not for general questions.

## Current Inventory
$catalogJson
PROMPT;

// Build Gemini-format contents array from history
$contents = [];
foreach ($history as $h) {
    $role = ($h['role'] === 'model' || $h['role'] === 'assistant') ? 'model' : 'user';
    $contents[] = [
        'role'  => $role,
        'parts' => [['text' => (string)($h['text'] ?? '')]],
    ];
}
$contents[] = [
    'role'  => 'user',
    'parts' => [['text' => $userMsg]],
];

$aiPayload = [
    'system_instruction' => ['parts' => [['text' => $systemPrompt]]],
    'contents'           => $contents,
    'generationConfig'   => [
        'maxOutputTokens' => 600,
        'temperature'     => 0.7,
        'topP'            => 0.9,
    ],
];

$ch = curl_init($aiUrl);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($aiPayload),
    CURLOPT_HTTPHEADER     => ['Content-Type: application/json'],
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_SSL_VERIFYPEER => true,
    CURLOPT_SSL_VERIFYHOST => 2,
]);

$raw     = curl_exec($ch);
$code    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlErr = curl_error($ch);
curl_close($ch);

if ($curlErr || !$raw) {
    error_log('Karabo AI curl error: ' . $curlErr);
    jsonResponse([
        'success' => false,
        'error'   => 'KARABO is temporarily unavailable. Please try again shortly or contact us directly at info@biostecgroup.co.za.',
    ], 503);
}

// Parse AI response — handle Gemini format
$decoded = json_decode($raw, true);
$replyText = '';

if (isset($decoded['candidates'][0]['content']['parts'][0]['text'])) {
    // Gemini format
    $replyText = $decoded['candidates'][0]['content']['parts'][0]['text'];
} elseif (isset($decoded['choices'][0]['message']['content'])) {
    // OpenAI format
    $replyText = $decoded['choices'][0]['message']['content'];
} elseif (isset($decoded['content'])) {
    $replyText = is_string($decoded['content']) ? $decoded['content'] : ($decoded['content']['parts'][0]['text'] ?? '');
} elseif (isset($decoded['response'])) {
    $replyText = $decoded['response'];
} elseif (isset($decoded['text'])) {
    $replyText = $decoded['text'];
} elseif (is_string($decoded)) {
    $replyText = $decoded;
} else {
    error_log('Karabo AI unexpected response (HTTP ' . $code . '): ' . substr($raw, 0, 300));
    jsonResponse([
        'success' => false,
        'error'   => 'KARABO received an unexpected response. Please try again.',
    ], 502);
}

// Extract [RECOMMEND:...] tag and strip it from the visible reply
$recommendedIds = [];
if (preg_match('/\[RECOMMEND:([\d,\s]+)\]/i', $replyText, $m)) {
    $replyText = trim(str_replace($m[0], '', $replyText));
    foreach (explode(',', $m[1]) as $idStr) {
        $id = (int)trim($idStr);
        if ($id > 0) $recommendedIds[] = $id;
    }
    $recommendedIds = array_unique(array_slice($recommendedIds, 0, 4)); // max 4
}

// Fetch product cards for recommendations
$productCards = [];
if (!empty($recommendedIds)) {
    try {
        $placeholders = implode(',', array_fill(0, count($recommendedIds), '?'));
        $stmt = $db->prepare(
            "SELECT id, name, slug, price, grade, featured_image, stock_quantity, specs
             FROM products
             WHERE id IN ($placeholders) AND is_active = 1"
        );
        $stmt->execute(array_values($recommendedIds));
        foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $p) {
            $specs = json_decode($p['specs'] ?? '{}', true) ?? [];
            $productCards[] = [
                'id'       => (int)$p['id'],
                'name'     => $p['name'],
                'slug'     => $p['slug'],
                'price'    => (int)$p['price'],
                'grade'    => $p['grade'],
                'imageUrl' => $p['featured_image'] ?: '/logo.png',
                'inStock'  => (int)$p['stock_quantity'] > 0,
                'cpu'      => $specs['cpu']     ?? null,
                'ram'      => $specs['ram']     ?? null,
                'storage'  => $specs['storage'] ?? null,
            ];
        }
        // Keep original recommendation order
        usort($productCards, function ($a, $b) use ($recommendedIds) {
            return array_search($a['id'], $recommendedIds) - array_search($b['id'], $recommendedIds);
        });
    } catch (Exception $e) {
        error_log('Karabo product fetch error: ' . $e->getMessage());
    }
}

jsonResponse([
    'success'  => true,
    'reply'    => trim($replyText),
    'products' => $productCards,
]);
