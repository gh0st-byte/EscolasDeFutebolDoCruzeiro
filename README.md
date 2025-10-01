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


<<<<<<< HEAD
=======
-  **IMPORTANTE**: Antes de usar em produção:

1. Copie `.env.example` para `.env`
2. Altere as credenciais no arquivo `.env`
3. Configure variáveis de ambiente seguras
>>>>>>> 23a3139 (update de segurança)

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
  "region": "Brasil",
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
  "region": "Brasil"
}
```

### failed_addresses.json

```json
[
  "Endereço que falhou no processamento",
  "Outro endereço com problema"
]
```

## Instalação no AWS Lightsail

### 1. Configuração do Servidor

```bash
# Conectar via SSH
ssh -i sua-chave.pem ubuntu@seu-ip-lightsail

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install apache2 php libapache2-mod-php php-json php-mbstring php-curl -y

# Instalar ModSecurity
sudo apt install libapache2-mod-security2 modsecurity-crs -y
sudo a2enmod security2
sudo a2enmod rewrite
```

### 2. Configurar ModSecurity

```bash
# Ativar ModSecurity
sudo cp /etc/modsecurity/modsecurity.conf-recommended /etc/modsecurity/modsecurity.conf
sudo sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' /etc/modsecurity/modsecurity.conf

# Ativar OWASP Core Rules
sudo ln -s /usr/share/modsecurity-crs /etc/modsecurity/
echo 'Include /etc/modsecurity/modsecurity-crs/crs-setup.conf' | sudo tee -a /etc/apache2/mods-enabled/security2.conf
echo 'Include /etc/modsecurity/modsecurity-crs/rules/*.conf' | sudo tee -a /etc/apache2/mods-enabled/security2.conf
```

### 3. Deploy da Aplicação

```bash
# Clonar repositório
cd /var/www/html
sudo git clone https://github.com/seu-usuario/EscolasDeFutebolDoCruzeiro.git .

# Configurar permissões
sudo chown -R www-data:www-data Backend/data/Json/
sudo chmod -R 755 Backend/data/Json/

# Configurar variáveis de ambiente
sudo cp .env.example .env
sudo nano .env  # Editar credenciais
```

### 4. Configurar SSL (HTTPS)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-apache -y

# Obter certificado SSL
sudo certbot --apache -d seu-dominio.com
```

### 5. Configurar Virtual Host

```apache
# /etc/apache2/sites-available/cruzeiro.conf
<VirtualHost *:80>
    ServerName seu-dominio.com
    DocumentRoot /var/www/html
  
    # ModSecurity
    SecRuleEngine On
  
    # Redirecionar para HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName seu-dominio.com
    DocumentRoot /var/www/html
  
    # SSL
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/seu-dominio.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/seu-dominio.com/privkey.pem
  
    # ModSecurity
    SecRuleEngine On
  
    # PHP
    DirectoryIndex index.php index.html
  
    <Directory /var/www/html>
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

### 6. Ativar Site

```bash
sudo a2ensite cruzeiro.conf
sudo a2dissite 000-default.conf
sudo systemctl restart apache2
```

## Instalação Local (Desenvolvimento)

```bash
# 1. Iniciar o servidor
cd Backend
php -S localhost:8000

# 2. Acessar a aplicação
# Frontend: http://localhost:8000/
# Admin: http://localhost:8000/Backend/admin/
```

## Requisitos Técnicos

### Servidor (AWS Lightsail)

- **OS**: Ubuntu 20.04 LTS ou superior
- **PHP**: 7.4+ com extensões: json, mbstring, curl
- **Servidor Web**: Apache 2.4+ (recomendado) ou Nginx
- **ModSecurity**: 2.9+ (WAF - Web Application Firewall)
- **SSL/TLS**: Certificado Let's Encrypt
- **Memória**: Mínimo 1GB RAM
- **Armazenamento**: 20GB SSD

### Dependências do Sistema

```bash
# Pacotes essenciais
sudo apt update
sudo apt install apache2 php libapache2-mod-php php-json php-mbstring php-curl

# ModSecurity (Firewall de Aplicação Web)
sudo apt install libapache2-mod-security2 modsecurity-crs

# SSL/HTTPS
sudo apt install certbot python3-certbot-apache
```

### Permissões Necessárias

- Escrita na pasta `Backend/data/Json/`
- Execução de scripts PHP
- Acesso de leitura aos arquivos estáticos

## Interface

- Design moderno com cores do Cruzeiro
- Interface responsiva para mobile
- Ícones intuitivos para ações
- Confirmações para operações destrutivas
- Modal para edição inline

## Segurança

- Autenticação por sessão com CSRF protection
- Validação de dados no servidor
- Escape de HTML para prevenir XSS
- Proteção contra Path Traversal
- Headers de segurança configurados
- Sanitização de entrada de dados
- Confirmação para exclusões

### Configuração de Segurança

1. **ModSecurity (WAF)**: Firewall de aplicação web ativo

   - Proteção contra XSS, SQL Injection, Path Traversal
   - OWASP Core Rule Set habilitado
   - Monitoramento em tempo real
2. **SSL/TLS**: Certificado Let's Encrypt configurado

   - HTTPS obrigatório (redirecionamento automático)
   - Criptografia TLS 1.2+
3. **Variáveis de Ambiente**: Credenciais em `.env`

   - Senhas criptografadas
   - Tokens CSRF protegidos
4. **Firewall AWS**: Portas restritas

   - Apenas 80 (HTTP) e 443 (HTTPS) abertas
   - SSH restrito por IP
5. **Backup**: Dados protegidos

   - Arquivos JSON com backup automático
   - Versionamento no Git

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

## Monitoramento e Manutenção

### Logs do ModSecurity

```bash
# Verificar logs de segurança
sudo tail -f /var/log/apache2/modsec_audit.log

# Verificar ataques bloqueados
sudo grep "Access denied" /var/log/apache2/error.log
```

### Atualizações de Segurança

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Atualizar regras ModSecurity
sudo apt update modsecurity-crs
sudo systemctl restart apache2

# Renovar certificado SSL (automático)
sudo certbot renew --dry-run
```

### Backup dos Dados

```bash
# Backup manual
sudo tar -czf backup-$(date +%Y%m%d).tar.gz Backend/data/Json/

# Backup automático (crontab)
0 2 * * * /usr/bin/tar -czf /backup/cruzeiro-$(date +\%Y\%m\%d).tar.gz /var/www/html/Backend/data/Json/
```

## Responsividade

O sistema se adapta automaticamente para:

- Desktop (1200px+)
- Tablet (768px - 1199px)
- Mobile (< 768px)


# Licenciamento

- **Desenvolvedor Reponsável:** Marco Túlio Paiva Repoles
- **Empresa:** &copy;Cruzeiro Esporte Clube - SAF
