<?php
/**
 * Update Repair Ticket (Admin Only)
 * PUT /api/repairs/update.php?id=TICKET_ID
 */

require_once '../config/database.php';
require_once '../config/auth.php';

$currentUser = requireAdmin();

if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    jsonResponse(['error' => 'Method not allowed'], 405);
}

$ticketId = isset($_GET['id']) ? (int)$_GET['id'] : 0;
if (!$ticketId) {
    jsonResponse(['error' => 'Ticket ID required'], 400);
}

$data = json_decode(file_get_contents('php://input'), true);

try {
    $db = getDB();
    
    // Check if ticket exists
    $stmt = $db->prepare("SELECT * FROM repair_tickets WHERE id = ?");
    $stmt->execute([$ticketId]);
    $ticket = $stmt->fetch();
    
    if (!$ticket) {
        jsonResponse(['error' => 'Ticket not found'], 404);
    }
    
    // Build update data
    $updates = [];
    $params = [];
    
    // Status update
    if (isset($data['status']) && in_array($data['status'], ['pending', 'diagnosing', 'waiting_parts', 'repairing', 'ready', 'completed', 'cancelled'])) {
        $updates[] = "status = ?";
        $params[] = $data['status'];
        
        // Set timestamps based on status
        if ($data['status'] === 'diagnosing' && empty($ticket['diagnosed_at'])) {
            $updates[] = "diagnosed_at = NOW()";
        }
        if ($data['status'] === 'repairing' && empty($ticket['started_at'])) {
            $updates[] = "started_at = NOW()";
        }
        if ($data['status'] === 'completed' && empty($ticket['completed_at'])) {
            $updates[] = "completed_at = NOW()";
        }
    }
    
    // Priority update
    if (isset($data['priority']) && in_array($data['priority'], ['low', 'medium', 'high', 'urgent'])) {
        $updates[] = "priority = ?";
        $params[] = $data['priority'];
    }
    
    // Assigned technician
    if (isset($data['assigned_technician_id'])) {
        $updates[] = "assigned_technician_id = ?";
        $params[] = (int)$data['assigned_technician_id'];
    }
    
    // Estimated cost
    if (isset($data['estimated_cost'])) {
        $updates[] = "estimated_cost = ?";
        $params[] = (int)$data['estimated_cost'];
    }
    
    // Final cost
    if (isset($data['final_cost'])) {
        $updates[] = "final_cost = ?";
        $params[] = (int)$data['final_cost'];
    }
    
    // Technician notes
    if (isset($data['technician_notes'])) {
        $updates[] = "technician_notes = ?";
        $params[] = sanitize($data['technician_notes']);
    }
    
    // Internal notes
    if (isset($data['internal_notes'])) {
        $updates[] = "internal_notes = ?";
        $params[] = sanitize($data['internal_notes']);
    }
    
    if (empty($updates)) {
        jsonResponse(['error' => 'No data to update'], 400);
    }
    
    $params[] = $ticketId;
    $updateStr = implode(', ', $updates);
    
    $stmt = $db->prepare("UPDATE repair_tickets SET $updateStr WHERE id = ?");
    $stmt->execute($params);
    
    // Log activity
    logActivity($currentUser['id'], 'repair_updated', 'repair_tickets', $ticketId, $ticket, $data);
    
    jsonResponse([
        'success' => true,
        'message' => 'Repair ticket updated successfully'
    ]);
    
} catch (PDOException $e) {
    error_log("Update repair ticket error: " . $e->getMessage());
    jsonResponse(['error' => 'Failed to update repair ticket'], 500);
}
