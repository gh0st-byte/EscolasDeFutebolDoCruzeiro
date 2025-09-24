# Sistema de Gerenciamento - Escolas do Cruzeiro

Sistema web para gerenciar os arquivos JSON das escolas de futebol do Cruzeiro.

Para iniciar o sistema:

### Backend (Servidor)
```bash
cd Backend
php -S localhost:8000
```

### Frontend (Interface)
Abra os arquivos HTML da pasta Frontend em um navegador ou use um servidor local:
```bash
cd Frontend
python -m http.server 3000
# ou
npx serve .
```

## Funcionalidades

- **Autenticação**: Login seguro para administradores
- **Gerenciamento de Escolas**: CRUD completo para schools.json
- **Gerenciamento de Endereços**: CRUD para addressSchools.json
- **Gerenciamento de Falhas**: CRUD para failed_addresses.json
- **Interface Responsiva**: Funciona em desktop e mobile
- **Validação de Dados**: Campos obrigatórios e tipos corretos

## Estrutura de Arquivos

```
EscolasDeFutebolDoCruzeiro/
├── Frontend/              # Interface do usuário
│   ├── index.html         # Página principal
│   ├── schools.html       # Página das escolas
│   ├── news.html          # Página de notícias
│   ├── css/               # Arquivos de estilo
│   ├── js/                # Scripts JavaScript
│   └── assets/            # Recursos estáticos
├── Backend/               # Servidor e dados
│   ├── admin/             # Sistema administrativo
│   ├── api/               # APIs REST
│   ├── data/Json/         # Arquivos de dados
│   └── config.php         # Configurações
└── README.md              # Este arquivo
```

## Credenciais de Acesso

- **Usuário**: admin
- **Senha**: cruzeiro2024

## Como Usar

### Frontend (Usuários)
1. Acesse `Frontend/index.html` no navegador
2. Navegue pelas páginas:
   - **Home**: Página principal com mapa e notícias
   - **Escolas**: Lista filtrada das escolas
   - **Notícias**: Últimas notícias do Cruzeiro

### Backend (Administradores)
1. Acesse `Backend/admin/index.php` no navegador
2. Faça login com as credenciais
3. Use as abas para gerenciar:
   - **Escolas**: Dados completos das escolas
   - **Endereços**: Coordenadas e endereços
   - **Falhas**: Endereços que falharam
   - **Notícias**: Gerenciar notícias e rascunhos
   - **Usuários**: Gerenciar usuários do sistema

### Operações Disponíveis

- **Adicionar**: Novos registros
- **Editar**: Modificar registros existentes
- **Deletar**: Remover registros (com confirmação)

## Estrutura dos Dados

### schools.json

```json
{
  "lat": -19.9227318,
  "lng": -43.9450948,
  "nome": "Belo Horizonte – Castelo/MG",
  "endereco": "Rua original...",
  "endereco_encontrado": "Endereço processado...",
  "telefone": "(31) 99878-6291",
  "whatsapp": "https://api.whatsapp.com/send/?phone=...",
  "instagram": "@escoladocruzeirocastelo",
  "instagram_url": "http://instagram.com/...",
  "region": "brasil",
  "estado": "MG"
}
```

### addressSchools.json

```json
{
  "lat": -19.9227318,
  "lng": -43.9450948,
  "nome": "Nome da escola",
  "endereco_encontrado": "Endereço completo",
  "region": "brasil"
}
```

### failed_addresses.json

```json
[
  "Endereço que falhou no processamento",
  "Outro endereço com problema"
]
```

## Instalação Rápida

```bash
# 1. Iniciar o servidor
cd Backend
php -S localhost:8000

# 2. Acessar a aplicação
# Frontend: http://localhost:8000/
# Admin: http://localhost:8000/Backend/admin/
```

Para instruções detalhadas, consulte [INSTALL.md](INSTALL.md)

## Requisitos Técnicos

- PHP 7.4+
- Servidor web (Apache/Nginx) ou PHP built-in server
- Permissões de escrita na pasta Backend/data/Json/

## Interface

- Design moderno com cores do Cruzeiro
- Interface responsiva para mobile
- Ícones intuitivos para ações
- Confirmações para operações destrutivas
- Modal para edição inline

## Segurança

- Autenticação por sessão
- Validação de dados no servidor
- Escape de HTML para prevenir XSS
- Confirmação para exclusões

## Arquitetura

### Frontend
- **Tecnologias**: HTML5, CSS3, JavaScript ES6+
- **Frameworks**: Bootstrap 5, Leaflet Maps
- **Responsivo**: Desktop, Tablet, Mobile

### Backend
- **Linguagem**: PHP 7.4+
- **Dados**: JSON files
- **API**: REST endpoints
- **Admin**: Interface web completa

## Responsividade

O sistema se adapta automaticamente para:

- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)
