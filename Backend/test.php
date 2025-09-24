<?php
echo "Servidor PHP funcionando!<br>";
echo "Caminho atual: " . __DIR__ . "<br>";
echo "Arquivo news.json existe: " . (file_exists(__DIR__ . '/data/Json/news.json') ? 'SIM' : 'NÃO') . "<br>";

if (file_exists(__DIR__ . '/data/Json/news.json')) {
    $content = file_get_contents(__DIR__ . '/data/Json/news.json');
    echo "Conteúdo do arquivo: " . substr($content, 0, 100) . "...<br>";
}
?>