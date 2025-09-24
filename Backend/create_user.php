<?php
// Script para criar usuários - use variáveis de ambiente para senhas
$adminPassword = $_ENV['ADMIN_PASSWORD'] ?? 'cruzeiro2024';
$marcoPassword = $_ENV['MARCO_PASSWORD'] ?? '12345678';

$users = [
    [
        'username' => 'admin',
        'password' => password_hash($adminPassword, PASSWORD_DEFAULT)
    ],
    [
        'username' => 'Marco',
        'password' => password_hash($marcoPassword, PASSWORD_DEFAULT)
    ]
];

$result = file_put_contents('data/Json/.user.json', json_encode($users, JSON_PRETTY_PRINT));
if ($result !== false) {
    echo "Usuários criados com sucesso!";
} else {
    echo "Erro ao criar usuários.";
}
?>