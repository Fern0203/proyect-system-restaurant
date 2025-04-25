<?php
header('Content-Type: application/json');
require_once 'conexion.php';

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Obtener parámetros de filtro
        $tipo = isset($_GET['tipo']) ? sanitizeInput($conn, $_GET['tipo']) : null;
        $fechaInicio = isset($_GET['fecha_inicio']) ? sanitizeInput($conn, $_GET['fecha_inicio']) : null;
        $fechaFin = isset($_GET['fecha_fin']) ? sanitizeInput($conn, $_GET['fecha_fin']) : null;

        if ($tipo === 'ingreso') {
            // Obtener ingresos filtrados
            $sql = "SELECT * FROM ingresos WHERE 1=1";
            $params = [];

            if ($fechaInicio) {
                $sql .= " AND DATE(fecha) >= ?";
                $params[] = $fechaInicio;
            }

            if ($fechaFin) {
                $sql .= " AND DATE(fecha) <= ?";
                $params[] = $fechaFin;
            }

            $sql .= " ORDER BY fecha DESC";

            $result = executeQuery($conn, $sql, $params);

            if ($result['success']) {
                echo json_encode($result['data']);
            } else {
                echo json_encode(['error' => $result['error']]);
            }
        }
        elseif ($tipo === 'gasto') {
            // Obtener gastos filtrados
            $sql = "SELECT g.*, i.nombre as ingrediente_nombre
                    FROM gastos g
                    LEFT JOIN ingredientes i ON g.id_ingrediente = i.id_ingrediente
                    WHERE 1=1";
            $params = [];

            if ($fechaInicio) {
                $sql .= " AND DATE(g.fecha) >= ?";
                $params[] = $fechaInicio;
            }

            if ($fechaFin) {
                $sql .= " AND DATE(g.fecha) <= ?";
                $params[] = $fechaFin;
            }

            $sql .= " ORDER BY g.fecha DESC";

            $result = executeQuery($conn, $sql, $params);

            if ($result['success']) {
                echo json_encode($result['data']);
            } else {
                echo json_encode(['error' => $result['error']]);
            }
        }
        elseif ($tipo === 'todos') {
            // Obtener ambos tipos de transacciones
            $ingresosSql = "SELECT * FROM ingresos WHERE 1=1";
            $gastosSql = "SELECT * FROM gastos WHERE 1=1";
            $params = [];

            if ($fechaInicio) {
                $ingresosSql .= " AND DATE(fecha) >= ?";
                $gastosSql .= " AND DATE(fecha) >= ?";
                $params[] = $fechaInicio;
            }

            if ($fechaFin) {
                $ingresosSql .= " AND DATE(fecha) <= ?";
                $gastosSql .= " AND DATE(fecha) <= ?";
                $params[] = $fechaFin;
            }

            $ingresosSql .= " ORDER BY fecha DESC";
            $gastosSql .= " ORDER BY fecha DESC";

            // Ejecutar ambas consultas
            $ingresos = executeQuery($conn, $ingresosSql, $params);
            $gastos = executeQuery($conn, $gastosSql, $params);

            if ($ingresos['success'] && $gastos['success']) {
                echo json_encode([
                    'ingresos' => $ingresos['data'],
                    'gastos' => $gastos['data']
                ]);
            } else {
                echo json_encode(['error' => $ingresos['error'] ?? $gastos['error']]);
            }
        }
        else {
            echo json_encode(['error' => 'Tipo de transacción no especificado']);
        }
        break;

    case 'POST':
        // Registrar nueva transacción (ingreso o gasto)
        $data = json_decode(file_get_contents('php://input'), true);
        $data = sanitizeInput($conn, $data);

        if (!isset($data['tipo'])) {
            echo json_encode(['error' => 'Tipo de transacción no especificado']);
            break;
        }

        if ($data['tipo'] === 'ingreso') {
            // Registrar ingreso
            $sql = "INSERT INTO ingresos (concepto, monto, descripcion)
                    VALUES (?, ?, ?)";
            $params = [
                $data['concepto'],
                $data['monto'],
                $data['descripcion']
            ];
        }
        elseif ($data['tipo'] === 'gasto') {
            // Registrar gasto
            $sql = "INSERT INTO gastos (concepto, monto, descripcion, id_ingrediente)
                    VALUES (?, ?, ?, ?)";
            $params = [
                $data['concepto'],
                $data['monto'],
                $data['descripcion'],
                $data['id_ingrediente'] ?? null
            ];
        }
        else {
            echo json_encode(['error' => 'Tipo de transacción no válido']);
            break;
        }

        $result = executeQuery($conn, $sql, $params);

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