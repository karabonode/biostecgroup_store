<?php
/**
 * Create Repair Ticket
 * POST /api/repairs/create.php
 */

require_once '../config/database.php';
require_once '../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

// Get current user (optional - allow guest submissions too)
$user = getCurrentUser();

$data = json_decode(file_get_contents('php://input'), true);

$deviceModel = isset($data['deviceModel']) ? sanitize($data['deviceModel']) : '';
$issueDescription = isset($data['issueDescription']) ? sanitize($data['issueDescription']) : '';
$customerName = isset($data['customerName']) ? sanitize($data['customerName']) : ($user ? ($user['first_name'] . ' ' . $user['last_name']) : 'Guest');
$customerEmail = isset($data['customerEmail']) ? sanitize($data['customerEmail']) : ($user ? $user['email'] : '');
$customerPhone = isset($data['customerPhone']) ? sanitize($data['customerPhone']) : '';

if (empty($deviceModel) || empty($issueDescription)) {
    jsonResponse(['error' => 'Device model and issue description are required'], 400);
}

try {
    $db = getDB();
    
    $ticketNumber = generateNumber('REP');
    
    $stmt = $db->prepare("
        INSERT INTO repair_tickets 
        (ticket_number, user_id, customer_name, customer_email, customer_phone, device_model, issue_description, status, priority)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', 'medium')
    ");
    $stmt->execute([
        $ticketNumber,
        $user ? $user['id'] : null,
        $customerName,
        $customerEmail,
        $customerPhone,
        $deviceModel,
        $issueDescription
    ]);
    
    $ticketId = $db->lastInsertId();
    
    jsonResponse([
        'success' => true,
        'message' => 'Repair ticket submitted successfully',
        'ticket_id' => $ticketId,
        'ticket_number' => $ticketNumber
    ], 201);
    
} catch (PDOException $e) {
    error_log("Repair ticket error: " . $e->getMessage());
    jsonResponse(['error' => 'Failed to submit repair ticket'], 500);
}
