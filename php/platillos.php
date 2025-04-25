<?php
header('Content-Type: application/json');
require_once 'conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Verificar si se solicitan ingredientes de un platillo
        if (isset($_GET['ingredientes'])) {
            $id = sanitizeInput($conn, $_GET['id']);

            // Obtener ingredientes del platillo
            $sql = "SELECT pi.id_ingrediente, pi.cantidad, i.nombre, i.unidad_medida
                    FROM platillo_ingredientes pi
                    JOIN ingredientes i ON pi.id_ingrediente = i.id_ingrediente
                    WHERE pi.id_platillo = ?";
            $result = executeQuery($conn, $sql, [$id]);

            if ($result['success']) {
                echo json_encode(['ingredientes' => $result['data']]);
            } else {
                echo json_encode(['error' => $result['error']]);
            }
        } else {
            // Obtener todos los platillos o uno específico si hay ID
            $sql = "SELECT p.*, c.nombre as categoria_nombre
                    FROM platillos p
                    LEFT JOIN categorias c ON p.id_categoria = c.id_categoria";
            $params = [];

            if (isset($_GET['id'])) {
                $sql .= " WHERE p.id_platillo = ?";
                $params[] = sanitizeInput($conn, $_GET['id']);
            } elseif (isset($_GET['activos'])) {
                $sql .= " WHERE p.activo = TRUE";
            }

            $sql .= " ORDER BY p.nombre";

            $result = executeQuery($conn, $sql, $params);

            if ($result['success']) {
                echo json_encode($result['data']);
            } else {
                echo json_encode(['error' => $result['error']]);
            }
        }
        break;

    case 'POST':
        // Crear nuevo platillo
        $data = json_decode(file_get_contents('php://input'), true);
        $data = sanitizeInput($conn, $data);

        // Iniciar transacción
        $conn->begin_transaction();

        try {
            // Insertar platillo
            $sqlPlatillo = "INSERT INTO platillos (nombre, id_categoria, descripcion, precio, costo, activo)
                           VALUES (?, ?, ?, ?, ?, ?)";
            $resultPlatillo = executeQuery($conn, $sqlPlatillo, [
                $data['nombre'],
                $data['id_categoria'],
                $data['descripcion'],
                $data['precio'],
                $data['costo'],
                $data['activo']
            ]);

            if (!$resultPlatillo['success']) {
                throw new Exception($resultPlatillo['error']);
            }

            $idPlatillo = $conn->insert_id;

            // Insertar ingredientes del platillo
            foreach ($data['ingredientes'] as $ingrediente) {
                $sqlIngrediente = "INSERT INTO platillo_ingredientes (id_platillo, id_ingrediente, cantidad)
                                  VALUES (?, ?, ?)";
                $resultIngrediente = executeQuery($conn, $sqlIngrediente, [
                    $idPlatillo,
                    $ingrediente['id_ingrediente'],
                    $ingrediente['cantidad']
                ]);

                if (!$resultIngrediente['success']) {
                    throw new Exception($resultIngrediente['error']);
                }
            }

            // Confirmar transacción
            $conn->commit();

            echo json_encode(['success' => true, 'id_platillo' => $idPlatillo]);
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conn->rollback();
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Actualizar platillo existente
        $data = json_decode(file_get_contents('php://input'), true);
        $data = sanitizeInput($conn, $data);

        // Iniciar transacción
        $conn->begin_transaction();

        try {
            // Actualizar platillo
            $sqlPlatillo = "UPDATE platillos
                           SET nombre = ?, id_categoria = ?, descripcion = ?,
                               precio = ?, costo = ?, activo = ?
                           WHERE id_platillo = ?";
            $resultPlatillo = executeQuery($conn, $sqlPlatillo, [
                $data['nombre'],
                $data['id_categoria'],
                $data['descripcion'],
                $data['precio'],
                $data['costo'],
                $data['activo'],
                $data['id_platillo']
            ]);

            if (!$resultPlatillo['success']) {
                throw new Exception($resultPlatillo['error']);
            }

            // Eliminar ingredientes antiguos
            $sqlDeleteIngredientes = "DELETE FROM platillo_ingredientes WHERE id_platillo = ?";
            $resultDelete = executeQuery($conn, $sqlDeleteIngredientes, [$data['id_platillo']]);

            if (!$resultDelete['success']) {
                throw new Exception($resultDelete['error']);
            }

            // Insertar nuevos ingredientes
            foreach ($data['ingredientes'] as $ingrediente) {
                $sqlIngrediente = "INSERT INTO platillo_ingredientes (id_platillo, id_ingrediente, cantidad)
                                  VALUES (?, ?, ?)";
                $resultIngrediente = executeQuery($conn, $sqlIngrediente, [
                    $data['id_platillo'],
                    $ingrediente['id_ingrediente'],
                    $ingrediente['cantidad']
                ]);

                if (!$resultIngrediente['success']) {
                    throw new Exception($resultIngrediente['error']);
                }
            }

            // Confirmar transacción
            $conn->commit();

            echo json_encode(['success' => true]);
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conn->rollback();
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'DELETE':
        // Eliminar platillo
        $id = isset($_GET['id']) ? sanitizeInput($conn, $_GET['id']) : null;

        if (!$id) {
            echo json_encode(['error' => 'ID de platillo no proporcionado']);
            break;
        }

        $sql = "DELETE FROM platillos WHERE id_platillo = ?";
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