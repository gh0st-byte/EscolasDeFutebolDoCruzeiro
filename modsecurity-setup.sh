#!/bin/bash

# Script de configuração do ModSecurity para Escolas do Cruzeiro
# Desenvolvido por Marco Túlio Paiva Repoles

echo "=== Configurando ModSecurity para Escolas do Cruzeiro ==="

# 1. Instalar ModSecurity e dependências
sudo apt update
sudo apt install -y libapache2-mod-security2 modsecurity-crs

# 2. Ativar módulos Apache
sudo a2enmod security2
sudo a2enmod rewrite
sudo a2enmod headers

# 3. Configurar ModSecurity
sudo cp /etc/modsecurity/modsecurity.conf-recommended /etc/modsecurity/modsecurity.conf

# 4. Ativar ModSecurity (mudar de DetectionOnly para On)
sudo sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' /etc/modsecurity/modsecurity.conf

# 5. Configurar OWASP Core Rules
sudo ln -sf /usr/share/modsecurity-crs /etc/modsecurity/
echo 'Include /etc/modsecurity/modsecurity-crs/crs-setup.conf' | sudo tee -a /etc/apache2/mods-enabled/security2.conf
echo 'Include /etc/modsecurity/modsecurity-crs/rules/*.conf' | sudo tee -a /etc/apache2/mods-enabled/security2.conf

# 6. Criar configuração customizada
sudo tee /etc/modsecurity/custom-rules.conf > /dev/null << 'EOF'
# Regras customizadas para Escolas do Cruzeiro
# Permitir uploads de JSON para admin
SecRule REQUEST_FILENAME "@contains /admin/" \
    "id:1001,phase:1,pass,ctl:ruleRemoveById=200002,ctl:ruleRemoveById=200003"

# Permitir operações AJAX
SecRule REQUEST_HEADERS:X-Requested-With "@streq XMLHttpRequest" \
    "id:1002,phase:1,pass,ctl:ruleRemoveById=941100"

# Permitir JSON no body para API
SecRule REQUEST_HEADERS:Content-Type "@contains application/json" \
    "id:1003,phase:1,pass,ctl:ruleRemoveById=200002"
EOF

# 7. Incluir regras customizadas
echo 'Include /etc/modsecurity/custom-rules.conf' | sudo tee -a /etc/apache2/mods-enabled/security2.conf

# 8. Reiniciar Apache
sudo systemctl restart apache2

echo "=== ModSecurity configurado com sucesso! ==="
echo "Logs disponíveis em: /var/log/apache2/modsec_audit.log"