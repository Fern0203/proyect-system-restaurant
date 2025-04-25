<?php
header('Content-Type: application/json');
require_once 'conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Verificar si es una consulta de cliente en uso (ventas)
        if (isset($_GET['en_uso'])) {
            $id = sanitizeInput($conn, $_GET['en_uso']);

            // Verificar si el cliente tiene ventas asociadas
            $sql = "SELECT COUNT(*) as en_uso FROM ventas WHERE id_cliente = ?";
            $result = executeQuery($conn, $sql, [$id]);

            if ($result['success']) {
                echo json_encode(['en_uso' => $result['data'][0]['en_uso'] > 0]);
            } else {
                echo json_encode(['error' => $result['error']]);
            }
        }
        // Obtener ventas de un cliente específico
        elseif (isset($_GET['cliente'])) {
            $id = sanitizeInput($conn, $_GET['cliente']);

            $sql = "SELECT id_venta, fecha, total, estado FROM ventas WHERE id_cliente = ? ORDER BY fecha DESC";
            $result = executeQuery($conn, $sql, [$id]);

            if ($result['success']) {
                echo json_encode($result['data']);
            } else {
                echo json_encode(['error' => $result['error']]);
            }
        }
        // Obtener todos los clientes o uno específico si hay ID
        else {
            $sql = "SELECT * FROM clientes";
            $params = [];

            if (isset($_GET['id'])) {
                $sql .= " WHERE id_cliente = ?";
                $params[] = sanitizeInput($conn, $_GET['id']);
            }

            $sql .= " ORDER BY nombre";

            $result = executeQuery($conn, $sql, $params);

            if ($result['success']) {
                echo json_encode($result['data']);
            } else {
                echo json_encode(['error' => $result['error']]);
            }
        }
        break;

    case 'POST':
        // Crear nuevo cliente
        $data = json_decode(file_get_contents('php://input'), true);
        $data = sanitizeInput($conn, $data);

        $sql = "INSERT INTO clientes (nombre, telefono, email, direccion)
                VALUES (?, ?, ?, ?)";

        $result = executeQuery($conn, $sql, [
            $data['nombre'],
            $data['telefono'],
            $data['email'],
            $data['direccion']
        ]);

        if ($result['success']) {
            $id = $conn->insert_id;
            echo json_encode(['success' => true, 'id_cliente' => $id]);
        } else {
            echo json_encode(['error' => $result['error']]);
        }
        break;

    case 'PUT':
        // Actualizar cliente existente
        $data = json_decode(file_get_contents('php://input'), true);
        $data = sanitizeInput($conn, $data);

        $sql = "UPDATE clientes
                SET nombre = ?, telefono = ?, email = ?, direccion = ?
                WHERE id_cliente = ?";

        $result = executeQuery($conn, $sql, [
            $data['nombre'],
            $data['telefono'],
            $data['email'],
            $data['direccion'],
            $data['id_cliente']
        ]);

        if ($result['success']) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => $result['error']]);
        }
        break;

    case 'DELETE':
        // Eliminar cliente
        $id = isset($_GET['id']) ? sanitizeInput($conn, $_GET['id']) : null;

        if (!$id) {
            echo json_encode(['error' => 'ID de cliente no proporcionado']);
            break;
        }

        $sql = "DELETE FROM clientes WHERE id_cliente = ?";
        $result = executeQuery($conn, $sql, [$id]);

        if ($result['success']) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => $result['error']]);
        }
        break;

    default:
        echo json_encode(['error' => 'Método no soportado']);
        break;
}

$conn->close();
?>