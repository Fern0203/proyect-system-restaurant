<?php
header('Content-Type: application/json');
require_once 'conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Verificar si es una consulta de ingrediente en uso
        if (isset($_GET['en_uso'])) {
            $id = sanitizeInput($conn, $_GET['en_uso']);

            // Verificar si el ingrediente está en algún platillo
            $sql = "SELECT COUNT(*) as en_uso FROM platillo_ingredientes WHERE id_ingrediente = ?";
            $result = executeQuery($conn, $sql, [$id]);

            if ($result['success']) {
                echo json_encode(['en_uso' => $result['data'][0]['en_uso'] > 0]);
            } else {
                echo json_encode(['error' => $result['error']]);
            }
        } else {
            // Obtener todos los ingredientes o uno específico si hay ID
            $sql = "SELECT * FROM ingredientes";
            $params = [];

            if (isset($_GET['id'])) {
                $sql .= " WHERE id_ingrediente = ?";
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
        // Crear nuevo ingrediente
        $data = json_decode(file_get_contents('php://input'), true);
        $data = sanitizeInput($conn, $data);

        $sql = "INSERT INTO ingredientes (nombre, unidad_medida, stock, stock_minimo, precio_compra)
                VALUES (?, ?, ?, ?, ?)";

        $result = executeQuery($conn, $sql, [
            $data['nombre'],
            $data['unidad_medida'],
            $data['stock'],
            $data['stock_minimo'],
            $data['precio_compra']
        ]);

        if ($result['success']) {
            $id = $conn->insert_id;
            echo json_encode(['success' => true, 'id_ingrediente' => $id]);
        } else {
            echo json_encode(['error' => $result['error']]);
        }
        break;

    case 'PUT':
        // Actualizar ingrediente existente
        $data = json_decode(file_get_contents('php://input'), true);
        $data = sanitizeInput($conn, $data);

        $sql = "UPDATE ingredientes
                SET nombre = ?, unidad_medida = ?, stock = ?, stock_minimo = ?, precio_compra = ?
                WHERE id_ingrediente = ?";

        $result = executeQuery($conn, $sql, [
            $data['nombre'],
            $data['unidad_medida'],
            $data['stock'],
            $data['stock_minimo'],
            $data['precio_compra'],
            $data['id_ingrediente']
        ]);

        if ($result['success']) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['error' => $result['error']]);
        }
        break;

    case 'DELETE':
        // Eliminar ingrediente
        $id = isset($_GET['id']) ? sanitizeInput($conn, $_GET['id']) : null;

        if (!$id) {
            echo json_encode(['error' => 'ID de ingrediente no proporcionado']);
            break;
        }

        $sql = "DELETE FROM ingredientes WHERE id_ingrediente = ?";
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