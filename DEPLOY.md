# Deploy no AWS Lightsail - Guia Completo

## Configuração Inicial

### 1. Criar Instância Lightsail

- **OS**: Ubuntu 20.04 LTS
- **Plano**: $10/mês (2GB RAM, 1 vCPU, 60GB SSD)
- **Região**: Mais próxima dos usuários

### 2. Configurar Firewall

```bash
# Portas necessárias
- 22 (SSH)
- 80 (HTTP) 
- 443 (HTTPS)
```

## Instalação com ModSecurity

### Script de Instalação Automática

```bash
#!/bin/bash
# deploy.sh - Script de deploy automatizado

# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y apache2 php libapache2-mod-php php-json php-mbstring php-curl git

# Instalar ModSecurity
sudo apt install -y libapache2-mod-security2 modsecurity-crs

# Ativar módulos Apache
sudo a2enmod security2 rewrite ssl

# Configurar ModSecurity
sudo cp /etc/modsecurity/modsecurity.conf-recommended /etc/modsecurity/modsecurity.conf
sudo sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' /etc/modsecurity/modsecurity.conf

# Ativar OWASP Core Rules
echo 'Include /usr/share/modsecurity-crs/crs-setup.conf' | sudo tee -a /etc/apache2/mods-enabled/security2.conf
echo 'Include /usr/share/modsecurity-crs/rules/*.conf' | sudo tee -a /etc/apache2/mods-enabled/security2.conf

# Deploy da aplicação
cd /var/www/html
sudo rm -rf *
sudo git clone https://github.com/seu-usuario/EscolasDeFutebolDoCruzeiro.git .

# Configurar permissões
sudo chown -R www-data:www-data Backend/data/Json/
sudo chmod -R 755 Backend/data/Json/

# Configurar ambiente
sudo cp .env.example .env

echo "✅ Instalação concluída!"
echo "📝 Configure o arquivo .env com suas credenciais"
echo "🔒 Configure SSL com: sudo certbot --apache -d seu-dominio.com"
```

## Configuração SSL

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-apache -y

# Obter certificado
sudo certbot --apache -d seu-dominio.com

# Verificar renovação automática
sudo certbot renew --dry-run
```

## Monitoramento

### Logs Importantes

```bash
# Logs do Apache
sudo tail -f /var/log/apache2/access.log
sudo tail -f /var/log/apache2/error.log

# Logs do ModSecurity
sudo tail -f /var/log/apache2/modsec_audit.log

# Verificar ataques bloqueados
sudo grep "Access denied" /var/log/apache2/error.log | tail -10
```

### Performance

```bash
# Verificar uso de recursos
htop
df -h
free -h

# Testar velocidade
curl -o /dev/null -s -w "%{time_total}\n" https://seu-dominio.com
```

## Manutenção

### Backup Automático

```bash
# Adicionar ao crontab
sudo crontab -e

# Backup diário às 2h
0 2 * * * /usr/bin/tar -czf /backup/cruzeiro-$(date +\%Y\%m\%d).tar.gz /var/www/html/Backend/data/Json/
```

### Atualizações

```bash
# Atualizar sistema (mensal)
sudo apt update && sudo apt upgrade -y

# Atualizar regras ModSecurity
sudo apt update modsecurity-crs
sudo systemctl restart apache2

# Verificar logs após atualizações
sudo systemctl status apache2
```

## Troubleshooting

### Problemas Comuns

1. **ModSecurity bloqueando requisições legítimas**

```bash
# Verificar logs
sudo grep "Access denied" /var/log/apache2/error.log

# Desabilitar regra específica (temporário)
sudo nano /etc/modsecurity/whitelist.conf
```

2. **Erro de permissões nos arquivos JSON**

```bash
sudo chown -R www-data:www-data Backend/data/Json/
sudo chmod -R 755 Backend/data/Json/
```

3. **SSL não funcionando**

```bash
# Verificar certificado
sudo certbot certificates

# Renovar manualmente
sudo certbot renew
```

## Otimizações

### Performance Apache

```apache
# /etc/apache2/conf-available/performance.conf
<IfModule mod_deflate.c>
    AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
</IfModule>

<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/pdf "access plus 1 month"
    ExpiresByType text/javascript "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
</IfModule>
```

```bash
sudo a2enconf performance
sudo systemctl restart apache2
```

## Checklist Final

- [ ]  Instância Lightsail criada
- [ ]  Dependências instaladas
- [ ]  ModSecurity configurado
- [ ]  SSL/HTTPS ativo
- [ ]  Aplicação deployada
- [ ]  Permissões configuradas
- [ ]  Backup automático ativo
- [ ]  Monitoramento funcionando
- [ ]  Domínio apontando corretamente
- [ ]  Testes de segurança realizados

## Custos Estimados

- **Lightsail**: $10/mês
- **Domínio**: $12/ano
- **SSL**: Gratuito (Let's Encrypt)
- **Total**: ~$10/mês + domínio
