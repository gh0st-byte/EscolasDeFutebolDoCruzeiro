<?php
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Sanitizar path
$path = filter_var($path, FILTER_SANITIZE_URL);
$basePath = realpath(__DIR__);

// Função para validar path seguro
function isPathSafe($file, $basePath) {
    $realFile = realpath($file);
    return $realFile && strpos($realFile, $basePath) === 0;
}

// Backend API routes
if (strpos($path, '/Backend/api/') === 0) {
    $file = __DIR__ . $path;
    if (isPathSafe($file, $basePath) && file_exists($file)) {
        include $file;
        return;
    }
}

// Backend admin routes
if (strpos($path, '/Backend/admin') === 0) {
    $file = __DIR__ . $path;
    if (is_dir($file)) {
        $file .= '/index.php';
    }
    if (isPathSafe($file, $basePath) && file_exists($file)) {
        include $file;
        return;
    }
}

// Frontend routes
if (strpos($path, '/Frontend') === 0) {
    $file = __DIR__ . $path;
    
    if (is_dir($file)) {
        $file .= '/index.html';
    }
    
    if (isPathSafe($file, $basePath) && file_exists($file)) {
        $allowedExtensions = ['.html', '.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'];
        $extension = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        
        if (in_array('.' . $extension, $allowedExtensions)) {
            $mimeType = mime_content_type($file);
            if ($mimeType) {
                header('Content-Type: ' . $mimeType);
            }
            readfile($file);
            return;
        }
    }
}

// Root redirect
if ($path === '/') {
    header('Location: /Frontend/');
    exit;
}

http_response_code(404);
echo "Not Found";
?>