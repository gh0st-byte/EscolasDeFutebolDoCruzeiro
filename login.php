<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - Sistema Cruzeiro</title>
    <link rel="stylesheet" href="style.css">
</head>
<body class="login-page">
    <div class="login-container">
        <div class="login-box">
            <div class="logo">
                <h1>🏆 Cruzeiro</h1>
                <p>Sistema de Gerenciamento</p>
            </div>
            
            <?php if (isset($_POST['username'])): ?>
                <div class="error">❌ Credenciais inválidas</div>
            <?php endif; ?>
            
            <form method="POST">
                <div class="form-group">
                    <label>👤 Usuário:</label>
                    <input type="text" name="username" required value="<?= htmlspecialchars($_POST['username'] ?? '', ENT_QUOTES, 'UTF-8') ?>">
                </div>
                
                <div class="form-group">
                    <label>🔒 Senha:</label>
                    <input type="password" name="password" required>
                </div>
                
                <button type="submit">Entrar</button>
            </form>
            
            <div class="login-info">
                <small>Acesso restrito aos administradores</small>
            </div>
        </div>
    </div>
</body>
</html>