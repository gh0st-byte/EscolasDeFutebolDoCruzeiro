<?php
// Configurações do sistema
define('DATA_PATH', __DIR__ . '/data/Json/');
define('ADMIN_PATH', __DIR__ . '/admin/');

// Função para obter caminho completo do arquivo JSON
function getJsonPath($filename) {
    // Validar entrada para prevenir path traversal
    if (!$filename || !is_string($filename)) {
        throw new InvalidArgumentException('Nome do arquivo inválido');
    }
    
    // Remover caracteres perigosos
    $filename = basename($filename);
    $filename = str_replace(['../', '..\\', '\0'], '', $filename);
    
    // Verificar se arquivo é permitido
    if (!isAllowedFile($filename)) {
        throw new InvalidArgumentException('Arquivo não permitido');
    }
    
    $fullPath = DATA_PATH . $filename;
    
    // Verificar se o caminho resolvido está dentro do diretório permitido
    $realDataPath = realpath(DATA_PATH);
    $realFilePath = realpath($fullPath);
    
    if ($realFilePath && strpos($realFilePath, $realDataPath) !== 0) {
        throw new InvalidArgumentException('Caminho não permitido');
    }
    
    return $fullPath;
}

// Função para verificar se arquivo é permitido
function isAllowedFile($filename) {
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
    return in_array($filename, $allowed_files);
}
?>