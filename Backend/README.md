# Backend - Escolas do Cruzeiro

Esta pasta contém todos os arquivos do backend da aplicação.

## Estrutura

```
Backend/
├── config.php         # Configurações do sistema
├── admin/             # Sistema administrativo
│   ├── index.php      # Painel administrativo principal
│   ├── login.php      # Página de login
│   ├── schools.php    # Sistema antigo de escolas
│   ├── update_passwords.php # Atualização de senhas
│   └── style.css      # Estilos do admin
├── api/               # APIs REST
│   └── data.php       # API para servir dados JSON
└── data/              # Dados da aplicação
    └── Json/          # Arquivos JSON
        ├── schools.json
        ├── addressSchools.json
        ├── failed_addresses.json
        ├── news.json
        ├── news_draft.json
        ├── .user.json
        ├── BRfilters.json
        └── allRegionsFilters.json
```

## Como usar

### Iniciar o servidor
```bash
cd Backend
php -S localhost:8000
```

### Acessar o admin
- URL: http://localhost:8000/admin/
- Usuário: admin
- Senha: cruzeiro2024

### API Endpoints
- `GET /api/data.php?file=schools.json` - Dados das escolas
- `GET /api/data.php?file=news.json` - Notícias
- `GET /api/data.php?file=BRfilters.json` - Filtros do Brasil

## Funcionalidades

- **Autenticação**: Sistema de login seguro
- **CRUD**: Gerenciamento completo dos dados
- **API REST**: Endpoints para o frontend
- **Validação**: Verificação de dados e segurança

## Requisitos

- PHP 7.4+
- Permissões de escrita na pasta data/Json/