<?php
header('Content-Type: application/json');
require_once 'conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtener ventas
        if (isset($_GET['id'])) {
            // Obtener una venta específica
            $id = sanitizeInput($conn, $_GET['id']);
            $sql = "SELECT v.*, c.nombre as cliente_nombre
                    FROM ventas v
                    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
                    WHERE v.id_venta = ?";
            $result = executeQuery($conn, $sql, [$id]);

            if ($result['success'] && !empty($result['data'])) {
                // Obtener detalles de la venta
                $sqlDetalle = "SELECT dv.*, p.nombre as platillo_nombre
                              FROM detalle_venta dv
                              JOIN platillos p ON dv.id_platillo = p.id_platillo
                              WHERE dv.id_venta = ?";
                $detalle = executeQuery($conn, $sqlDetalle, [$id]);

                if ($detalle['success']) {
                    $result['data'][0]['detalle'] = $detalle['data'];
                }

                echo json_encode($result['data'][0]);
            } else {
                echo json_encode(['error' => 'Venta no encontrada']);
            }
        } else {
            // Obtener todas las ventas con filtros
            $filtroFecha = isset($_GET['fecha']) ? sanitizeInput($conn, $_GET['fecha']) : null;

            $sql = "SELECT v.id_venta, v.fecha, c.nombre as cliente, v.total, v.estado
                    FROM ventas v
                    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente";

            $params = [];

            if ($filtroFecha) {
                $sql .= " WHERE DATE(v.fecha) = ?";
                $params[] = $filtroFecha;
            }

            $sql .= " ORDER BY v.fecha DESC";

            $result = executeQuery($conn, $sql, $params);

            if ($result['success']) {
                echo json_encode($result['data']);
            } else {
                echo json_encode(['error' => $result['error']]);
            }
        }
        break;

    case 'POST':
        // Crear una nueva venta
        $data = json_decode(file_get_contents('php://input'), true);
        $data = sanitizeInput($conn, $data);

        // Iniciar transacción
        $conn->begin_transaction();

        try {
            // Insertar venta
            $sqlVenta = "INSERT INTO ventas (id_cliente, total) VALUES (?, ?)";
            $resultVenta = executeQuery($conn, $sqlVenta, [
                $data['id_cliente'] ?? null,
                $data['total']
            ]);

            if (!$resultVenta['success']) {
                throw new Exception($resultVenta['error']);
            }

            $idVenta = $conn->insert_id;

            // Insertar detalles de venta y actualizar inventario
            foreach ($data['detalle'] as $item) {
                // Insertar detalle
                $sqlDetalle = "INSERT INTO detalle_venta (id_venta, id_platillo, cantidad, precio_unitario, subtotal)
                              VALUES (?, ?, ?, ?, ?)";
                $resultDetalle = executeQuery($conn, $sqlDetalle, [
                    $idVenta,
                    $item['id_platillo'],
                    $item['cantidad'],
                    $item['precio_unitario'],
                    $item['subtotal']
                ]);

                if (!$resultDetalle['success']) {
                    throw new Exception($resultDetalle['error']);
                }

                // Actualizar inventario (restar ingredientes)
                $sqlIngredientes = "SELECT id_ingrediente, cantidad
                                   FROM platillo_ingredientes
                                   WHERE id_platillo = ?";
                $ingredientes = executeQuery($conn, $sqlIngredientes, [$item['id_platillo']]);

                if (!$ingredientes['success']) {
                    throw new Exception($ingredientes['error']);
                }

                foreach ($ingredientes['data'] as $ing) {
                    $sqlUpdateInventario = "UPDATE ingredientes
                                           SET stock = stock - ?
                                           WHERE id_ingrediente = ?";
                    $resultUpdate = executeQuery($conn, $sqlUpdateInventario, [
                        $ing['cantidad'] * $item['cantidad'],
                        $ing['id_ingrediente']
                    ]);

                    if (!$resultUpdate['success']) {
                        throw new Exception($resultUpdate['error']);
                    }
                }
            }

            // Registrar ingreso
            $sqlIngreso = "INSERT INTO ingresos (concepto, monto, descripcion)
                           VALUES (?, ?, ?)";
            $resultIngreso = executeQuery($conn, $sqlIngreso, [
                "Venta #$idVenta",
                $data['total'],
                "Venta de productos"
            ]);

            if (!$resultIngreso['success']) {
                throw new Exception($resultIngreso['error']);
            }

            // Confirmar transacción
            $conn->commit();

            echo json_encode(['success' => true, 'id_venta' => $idVenta]);
        } catch (Exception $e) {
            // Revertir transacción en caso de error
            $conn->rollback();
            echo json_encode(['error' => $e->getMessage()]);
        }
        break;

    case 'PUT':
        // Actualizar estado de venta (ej. cancelar)
        $data = json_decode(file_get_contents('php://input'), true);
        $data = sanitizeInput($conn, $data);

        $sql = "UPDATE ventas SET estado = ? WHERE id_venta = ?";
        $result = executeQuery($conn, $sql, [$data['estado'], $data['id_venta']]);

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