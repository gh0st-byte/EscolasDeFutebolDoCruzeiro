<?php
$uri = $_SERVER['REQUEST_URI'];

// Redirecionar para Frontend
if (strpos($uri, '/Frontend/') === 0) {
    $file = __DIR__ . $uri;
    if (file_exists($file)) {
        $ext = pathinfo($file, PATHINFO_EXTENSION);
        switch($ext) {
            case 'html': header('Content-Type: text/html'); break;
            case 'css': header('Content-Type: text/css'); break;
            case 'js': header('Content-Type: application/javascript'); break;
        }
        readfile($file);
        exit;
    }
}

// Redirecionar para Backend
if (strpos($uri, '/Backend/') === 0) {
    $file = __DIR__ . $uri;
    if (file_exists($file)) {
        include $file;
        exit;
    }
}

// Raiz redireciona para Frontend
if ($uri === '/') {
    header('Location: /Frontend/index.html');
    exit;
}

http_response_code(404);
echo "Not Found";
?>