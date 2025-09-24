<?php
// Configurações do sistema
define('DATA_PATH', __DIR__ . '/data/Json/');
define('ADMIN_PATH', __DIR__ . '/admin/');

// Função para obter caminho completo do arquivo JSON
function getJsonPath($filename) {
    return DATA_PATH . $filename;
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