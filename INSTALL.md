# Guia de Instalação - Escolas do Cruzeiro

## Pré-requisitos

- PHP 7.4 ou superior
- Servidor web (Apache/Nginx) ou PHP built-in server
- Navegador moderno com suporte a JavaScript ES6+

## Instalação

### 1. Clone ou baixe o projeto
```bash
git clone <repository-url>
cd EscolasDeFutebolDoCruzeiro
```

### 2. Configurar permissões (Linux/Mac)
```bash
chmod -R 755 Backend/data/Json/
chmod -R 644 Backend/data/Json/*.json
```

### 3. Iniciar o servidor

#### Opção A: Servidor PHP built-in (Recomendado para desenvolvimento)
```bash
cd Backend
php -S localhost:8000
```

#### Opção B: Apache/Nginx
- Configure o DocumentRoot para a pasta raiz do projeto
- Certifique-se de que o PHP está habilitado

### 4. Acessar a aplicação

#### Frontend (Usuários)
- URL: http://localhost:8000/ (redireciona automaticamente)
- Ou diretamente: http://localhost:8000/Frontend/

#### Backend (Administradores)
- URL: http://localhost:8000/Backend/admin/
- Usuário: admin
- Senha: cruzeiro2025

## Estrutura de URLs

```
http://localhost:8000/                    # Página principal (Frontend)
http://localhost:8000/Frontend/           # Interface do usuário
http://localhost:8000/Backend/admin/      # Painel administrativo
http://localhost:8000/Backend/api/        # APIs REST
```

## Solução de Problemas

### Erro de permissão nos arquivos JSON
```bash
sudo chown -R www-data:www-data Backend/data/Json/
sudo chmod -R 755 Backend/data/Json/
```

### Erro de CORS (Cross-Origin)
- Use sempre um servidor HTTP (não abra arquivos diretamente no navegador)
- O arquivo `Backend/api/data.php` já inclui headers CORS

### Dados não carregam no Frontend
1. Verifique se o Backend está rodando
2. Teste a API diretamente: http://localhost:8000/Backend/api/data.php?file=schools.json
3. Verifique o console do navegador para erros

## Desenvolvimento

### Adicionar novos dados
1. Acesse o painel administrativo
2. Use as abas para gerenciar diferentes tipos de dados
3. Os dados são salvos automaticamente nos arquivos JSON

### Modificar o Frontend
- Edite os arquivos em `Frontend/`
- CSS: `Frontend/css/`
- JavaScript: `Frontend/js/`
- Imagens: `Frontend/assets/img/`

### Modificar o Backend
- APIs: `Backend/api/`
- Admin: `Backend/admin/`
- Configurações: `Backend/config.php`

## Backup

### Fazer backup dos dados
```bash
cp -r Backend/data/Json/ backup-$(date +%Y%m%d)/
```

### Restaurar backup
```bash
cp -r backup-YYYYMMDD/* Backend/data/Json/
```