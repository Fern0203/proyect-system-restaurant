<?php
header('Content-Type: application/json');
// Datos de ejemplo
echo json_encode([
    ['id_categoria' => 1, 'nombre' => 'Entradas'],
    ['id_categoria' => 2, 'nombre' => 'Platos fuertes'],
    ['id_categoria' => 3, 'nombre' => 'Postres']
]);
?>