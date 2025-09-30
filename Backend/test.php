<?php
echo "Servidor PHP funcionando!<br>";
echo "Caminho atual: " . __DIR__ . "<br>";
echo "Arquivo news.json existe: " . (file_exists(__DIR__ . '/data/Json/news.json') ? 'SIM' : 'NÃO') . "<br>";
echo "Arquivo .user.json existe: " . (file_exists(__DIR__ . '/data/Json/.user.json') ? 'SIM' : 'NÃO') . "<br>";
echo "Arquivo schools.json existe: " . (file_exists(__DIR__ . '/data/Json/schools.json') ? 'SIM' : 'NÃO') . "<br>";


if (file_exists(__DIR__ . '/data/Json/news.json')) {
    $content = file_get_contents(__DIR__ . '/data/Json/news.json');
    echo "<br>Conteúdo do arquivo noticias publicadas: " . substr($content, 0, 100) . "...<br><br>";
}
if (file_exists(__DIR__ . '/data/Json/.user.json')) {
    $content = file_get_contents(__DIR__ . '/data/Json/.user.json');
    echo "Conteúdo do arquivo de usuarios: " . substr($content, 0, 100) . "...<br><br>";
}
if (file_exists(__DIR__ . '/data/Json/schools.json')) {
    $content = file_get_contents(__DIR__ . '/data/Json/schools.json');
    echo "Conteúdo do arquivo de escolas: " . substr($content, 0, 100) . "...<br>";
}




?>