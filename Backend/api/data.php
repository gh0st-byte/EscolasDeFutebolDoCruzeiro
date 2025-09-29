<?php
header('Content-Type: application/json');

// CORS configurado para desenvolvimento
$allowedOrigins = [
    'http://localhost:8000',
    'http://127.0.0.1:8000',
    'http://localhost:3000',
    'http://127.0.0.1:3000'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowedOrigins)) {
    header('Access-Control-Allow-Origin: ' . $origin);
} else {
    // Para requisições diretas sem Origin header
    header('Access-Control-Allow-Origin: *');
}

header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

$file = $_GET['file'] ?? '';

$allowed_files = [
    'schools.json', 
    'addressSchools.json', 
    'failed_addresses.json', 
    'news.json', 
    'news_draft.json', 
    '.user.json',
    'BRfilters.json',
    'allRegionsFilters.json'
];

if (!$file || !in_array($file, $allowed_files)) {
    http_response_code(400);
    echo json_encode(['error' => 'Arquivo não permitido']);
    exit;
}

$basePath = realpath(__DIR__ . '/../data/Json/');
$filepath = $basePath . '/' . basename($file);
$realPath = realpath($filepath);

if (!$realPath || strpos($realPath, $basePath) !== 0 || !file_exists($realPath)) {
    http_response_code(404);
    echo json_encode(['error' => 'Arquivo não encontrado']);
    exit;
}

$filepath = $realPath;

$data = file_get_contents($filepath);
echo $data;
?>