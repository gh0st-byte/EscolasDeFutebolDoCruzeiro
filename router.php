<?php
$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Backend API routes
if (strpos($path, '/Backend/api/') === 0) {
    $file = __DIR__ . $path;
    if (file_exists($file)) {
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
    if (file_exists($file)) {
        include $file;
        return;
    }
}

// Frontend routes
if (strpos($path, '/Frontend') === 0) {
    $file = __DIR__ . $path;
    if (file_exists($file)) {
        $mimeType = mime_content_type($file);
        if ($mimeType) {
            header('Content-Type: ' . $mimeType);
        }
        readfile($file);
        return;
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