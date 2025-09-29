<?php
$uri = $_SERVER['REQUEST_URI'];
$uri = filter_var($uri, FILTER_SANITIZE_URL);
$basePath = realpath(__DIR__);

// Função para validar path seguro
function isPathSafe($file, $basePath) {
    $realFile = realpath($file);
    return $realFile && strpos($realFile, $basePath) === 0;
}

// Redirecionar para Frontend
if (strpos($uri, '/Frontend/') === 0) {
    $file = __DIR__ . $uri;
    if (isPathSafe($file, $basePath) && file_exists($file)) {
        $allowedExtensions = ['html', 'css', 'js', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'ico'];
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        
        if (in_array($ext, $allowedExtensions)) {
            switch($ext) {
                case 'html': header('Content-Type: text/html'); break;
                case 'css': header('Content-Type: text/css'); break;
                case 'js': header('Content-Type: application/javascript'); break;
                case 'png': header('Content-Type: image/png'); break;
                case 'jpg': case 'jpeg': header('Content-Type: image/jpeg'); break;
                case 'gif': header('Content-Type: image/gif'); break;
                case 'svg': header('Content-Type: image/svg+xml'); break;
                case 'ico': header('Content-Type: image/x-icon'); break;
            }
            readfile($file);
            exit;
        }
    }
}

// Redirecionar para Backend
if (strpos($uri, '/Backend/') === 0) {
    $file = __DIR__ . $uri;
    if (isPathSafe($file, $basePath) && file_exists($file)) {
        $ext = strtolower(pathinfo($file, PATHINFO_EXTENSION));
        if ($ext === 'php') {
            include $file;
            exit;
        }
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