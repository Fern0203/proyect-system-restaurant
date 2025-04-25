<?php
$servername = "localhost";
$username = "root";
$password = "";
$database = "sistema_restaurante";

// Crear conexión
$conn = new mysqli($servername, $username, $password, $database);

// Verificar conexión
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

// Configurar charset
$conn->set_charset("utf8");

// Función para ejecutar consultas y retornar resultados en JSON
function executeQuery($conn, $sql, $params = []) {
    $stmt = $conn->prepare($sql);

    if ($stmt === false) {
        return ['success' => false, 'error' => $conn->error];
    }

    if (!empty($params)) {
        $types = '';
        $values = [];

        foreach ($params as $param) {
            if (is_int($param)) {
                $types .= 'i';
            } elseif (is_float($param)) {
                $types .= 'd';
            } else {
                $types .= 's';
            }
            $values[] = $param;
        }

        $stmt->bind_param($types, ...$values);
    }

    $stmt->execute();

    if ($stmt->errno) {
        return ['success' => false, 'error' => $stmt->error];
    }

    $result = $stmt->get_result();

    if ($result === false) {
        // Para INSERT, UPDATE, DELETE
        return ['success' => true, 'affected_rows' => $stmt->affected_rows];
    } else {
        // Para SELECT
        $data = [];
        while ($row = $result->fetch_assoc()) {
            $data[] = $row;
        }
        return ['success' => true, 'data' => $data];
    }
}

// Función para sanitizar datos de entrada
/*function sanitizeInput($conn, $data) {
    if (is_array($data)) {
        foreach ($data as $key => $value) {
            $data[$key] = $conn->real_escape_string(trim($value));
        }
        return $data;
    }
    return $conn->real_escape_string(trim($data));
}*/

function sanitizeInput($conn, $input) {
    if (is_array($input)) {
        // Si es un array, sanitiza cada elemento recursivamente
        return array_map(function($item) use ($conn) {
            return sanitizeInput($conn, $item);
        }, $input);
    } else {
        // Si es string, aplica trim y escape
        return $conn->real_escape_string(trim($input));
    }
}
?>