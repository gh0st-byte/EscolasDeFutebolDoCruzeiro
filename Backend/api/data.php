<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

require_once '../config.php';

$file = $_GET['file'] ?? '';

if (!$file || !isAllowedFile($file)) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo não permitido']);
    exit;
}

$filepath = getJsonPath($file);

if (!file_exists($filepath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Arquivo não encontrado']);
    exit;
}

$data = file_get_contents($filepath);
echo $data;
?>