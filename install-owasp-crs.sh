#!/bin/bash

# Script de instalação do OWASP CRS para Escolas do Cruzeiro
# Execute como root: sudo bash install-owasp-crs.sh

echo "=== Instalação do OWASP ModSecurity CRS ==="

# Verificar se está executando como root
if [ "$EUID" -ne 0 ]; then
    echo "Execute como root: sudo bash install-owasp-crs.sh"
    exit 1
fi

# Atualizar sistema
echo "Atualizando sistema..."
apt update

# Instalar ModSecurity e dependências
echo "Instalando ModSecurity..."
apt install -y apache2 libapache2-mod-security2 modsecurity-crs

# Ativar módulos Apache
echo "Ativando módulos Apache..."
a2enmod security2
a2enmod rewrite
a2enmod ssl
a2enmod headers

# Configurar ModSecurity
echo "Configurando ModSecurity..."
cp /etc/modsecurity/modsecurity.conf-recommended /etc/modsecurity/modsecurity.conf
sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' /etc/modsecurity/modsecurity.conf

# Copiar configurações personalizadas
echo "Aplicando configurações do OWASP CRS..."
cp owasp-crs-setup.conf /etc/modsecurity/
cp owasp-crs-exclusions.conf /etc/modsecurity/

# Configurar security2.conf
cat > /etc/apache2/mods-enabled/security2.conf << 'EOF'
<IfModule mod_security2.c>
    # Configuração principal do ModSecurity
    Include /etc/modsecurity/modsecurity.conf
    
    # Configuração personalizada do OWASP CRS
    Include /etc/modsecurity/owasp-crs-setup.conf
    
    # OWASP Core Rule Set
    Include /usr/share/modsecurity-crs/crs-setup.conf
    Include /usr/share/modsecurity-crs/rules/*.conf
    
    # Exclusões personalizadas
    Include /etc/modsecurity/owasp-crs-exclusions.conf
</IfModule>
EOF

# Configurar Virtual Host
echo "Configurando Virtual Host..."
cp apache-vhost-cruzeiro.conf /etc/apache2/sites-available/cruzeiro.conf

# Ativar site
a2ensite cruzeiro.conf
a2dissite 000-default.conf

# Criar diretórios de log
mkdir -p /var/log/apache2
touch /var/log/apache2/modsec_audit.log
touch /var/log/apache2/modsec_debug.log
touch /var/log/apache2/cruzeiro_error.log
touch /var/log/apache2/cruzeiro_access.log
touch /var/log/apache2/cruzeiro_modsec_audit.log

# Configurar permissões
chown www-data:www-data /var/log/apache2/modsec_*
chown www-data:www-data /var/log/apache2/cruzeiro_*

# Testar configuração
echo "Testando configuração do Apache..."
apache2ctl configtest

if [ $? -eq 0 ]; then
    echo "Configuração OK! Reiniciando Apache..."
    systemctl restart apache2
    systemctl enable apache2
    
    echo ""
    echo "=== INSTALAÇÃO CONCLUÍDA ==="
    echo "ModSecurity com OWASP CRS instalado e configurado!"
    echo ""
    echo "Próximos passos:"
    echo "1. Configure SSL com: sudo certbot --apache -d seu-dominio.com"
    echo "2. Edite /etc/apache2/sites-available/cruzeiro.conf com seu domínio"
    echo "3. Monitore logs em: /var/log/apache2/cruzeiro_modsec_audit.log"
    echo ""
    echo "Para testar: curl -I http://localhost/?param=<script>alert(1)</script>"
    
else
    echo "ERRO na configuração do Apache!"
    echo "Verifique os logs: sudo journalctl -u apache2"
    exit 1
fi