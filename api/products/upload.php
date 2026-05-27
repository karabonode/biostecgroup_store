<?php
/**
 * Upload Product Image (Admin Only)
 * POST /api/products/upload.php
 */

require_once '../config/database.php';
require_once '../config/auth.php';

function detectUploadedImageMimeType(string $tmpPath, string $originalName): ?string {
    if (function_exists('finfo_open')) {
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo !== false) {
            $mimeType = finfo_file($finfo, $tmpPath);
            finfo_close($finfo);
            if (is_string($mimeType) && $mimeType !== '') {
                return $mimeType;
            }
        }
    }

    if (function_exists('exif_imagetype')) {
        $imageType = @exif_imagetype($tmpPath);
        if ($imageType !== false) {
            $map = [
                IMAGETYPE_JPEG => 'image/jpeg',
                IMAGETYPE_PNG => 'image/png',
                IMAGETYPE_GIF => 'image/gif',
                IMAGETYPE_WEBP => 'image/webp',
            ];
            if (isset($map[$imageType])) {
                return $map[$imageType];
            }
        }
    }

    $ext = strtolower(pathinfo($originalName, PATHINFO_EXTENSION));
    $fallbackMap = [
        'jpg' => 'image/jpeg',
        'jpeg' => 'image/jpeg',
        'png' => 'image/png',
        'gif' => 'image/gif',
        'webp' => 'image/webp',
    ];

    return $fallbackMap[$ext] ?? null;
}

$currentUser = requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Check if file was uploaded
if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
    $error = $_FILES['image']['error'] ?? 'No file uploaded';
    jsonResponse(['error' => 'Upload failed: ' . $error], 400);
}

$file = $_FILES['image'];

// Validate file type
$allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$mimeType = detectUploadedImageMimeType($file['tmp_name'], $file['name']);

if (!in_array($mimeType, $allowedTypes)) {
    jsonResponse(['error' => 'Invalid file type. Only JPEG, PNG, GIF, and WebP allowed'], 400);
}

// Validate file size (max 5MB)
$maxSize = 5 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    jsonResponse(['error' => 'File too large. Max size is 5MB'], 400);
}

// Create upload directory
$uploadDir = __DIR__ . '/../uploads/products/';
if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0755, true) && !is_dir($uploadDir)) {
        jsonResponse(['error' => 'Upload directory could not be created. Check folder permissions.'], 500);
    }
}

if (!is_writable($uploadDir)) {
    jsonResponse(['error' => 'Upload directory is not writable. Check server permissions for api/uploads/products.'], 500);
}

// Generate unique filename
$extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if ($extension === '') {
    $extByMime = [
        'image/jpeg' => 'jpg',
        'image/png' => 'png',
        'image/gif' => 'gif',
        'image/webp' => 'webp',
    ];
    $extension = $extByMime[$mimeType] ?? 'jpg';
}
$filename = time() . '_' . uniqid() . '.' . $extension;
$filepath = $uploadDir . $filename;

// Move uploaded file
if (!move_uploaded_file($file['tmp_name'], $filepath)) {
    jsonResponse(['error' => 'Failed to save file. Check PHP upload_tmp_dir and folder write permissions.'], 500);
}

// Build URL — serve from /uploads/ at the webroot so Nginx's static-file
// location finds it via the dist/uploads symlink without path conflicts.
$forwardedProto = strtolower(trim((string)($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '')));
$isHttps = (isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on') || $forwardedProto === 'https';
$protocol = $isHttps ? 'https' : 'http';
$host = $_SERVER['HTTP_X_FORWARDED_HOST'] ?? $_SERVER['HTTP_HOST'];
$url = $protocol . '://' . $host . '/uploads/products/' . $filename;

jsonResponse([
    'success' => true,
    'message' => 'Image uploaded successfully',
    'url' => $url,
    'filename' => $filename
]);
