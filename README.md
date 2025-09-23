# Sistema de Gerenciamento - Escolas do Cruzeiro

Sistema web para gerenciar os arquivos JSON das escolas de futebol do Cruzeiro.

Para iniciar o cms:
```Bash
php -S localhost:8000
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
├── index.php              # Página principal do sistema
├── login.php              # Página de login
├── style.css              # Estilos CSS
├── schools.php            # Sistema antigo (mantido)
├── README.md              # Este arquivo
└── Json/
    ├── schools.json           # Dados das escolas
    ├── addressSchools.json    # Endereços processados
    └── failed_addresses.json  # Endereços que falharam
```

## Credenciais de Acesso

- **Usuário**: admin
- **Senha**: cruzeiro2024

## Como Usar

1. Acesse `index.php` no navegador
2. Faça login com as credenciais
3. Use as abas para navegar entre os arquivos:
   - **Escolas**: Dados completos das escolas
   - **Endereços**: Coordenadas e endereços
   - **Falhas**: Endereços que não foram processados

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

## Requisitos Técnicos

- PHP 7.4+
- Servidor web (Apache/Nginx)
- Permissões de escrita na pasta Json/

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

## Responsividade

O sistema se adapta automaticamente para:

- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)
