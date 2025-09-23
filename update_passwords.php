<?php
// Script para atualizar senhas existentes para hash
$usuarios = json_decode(file_get_contents('Json/.user.json'), true);

foreach ($usuarios as &$usuario) {
    // Se a senha não está em hash, fazer hash
    if (strlen($usuario['password']) < 60) {
        $usuario['password'] = password_hash($usuario['password'], PASSWORD_DEFAULT);
    }
}

file_put_contents('Json/.user.json', json_encode($usuarios, JSON_PRETTY_PRINT));
echo "Senhas atualizadas com sucesso!";
?>