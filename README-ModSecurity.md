# Configuração ModSecurity - Escolas do Cruzeiro

## Instalação Rápida

```bash
# 1. Executar script de configuração
chmod +x modsecurity-setup.sh
sudo ./modsecurity-setup.sh

# 2. Configurar Virtual Host
sudo cp apache-vhost-cruzeiro.conf /etc/apache2/sites-available/cruzeiro.conf
sudo a2ensite cruzeiro.conf
sudo a2dissite 000-default.conf

# 3. Aplicar configuração customizada
sudo cp modsecurity-custom.conf /etc/modsecurity/custom-cruzeiro.conf
echo 'Include /etc/modsecurity/custom-cruzeiro.conf' | sudo tee -a /etc/apache2/mods-enabled/security2.conf

# 4. Reiniciar Apache
sudo systemctl restart apache2
```

## Monitoramento

```bash
# Tornar executável
chmod +x modsecurity-monitor.sh

# Ver status geral
./modsecurity-monitor.sh

# Ver ataques bloqueados
./modsecurity-monitor.sh attacks

# Monitorar em tempo real
./modsecurity-monitor.sh monitor

# Gerar relatório
./modsecurity-monitor.sh report
```

## Configurações Específicas

### Regras Customizadas

- **ID 2001-2009**: Permissões para funcionalidades do projeto
- **ID 3001-3004**: Proteções específicas contra ataques
- **ID 4001-4002**: Monitoramento e logs

### Proteções Ativas

- ✅ SQL Injection ( Terá utilidade apenas após o upgrade de Json para um banco de dados convencional )
- ✅ XSS (Cross-Site Scripting)
- ✅ Limite de tentativas de login
- ✅ Proteção de arquivos JSON
- ✅ Monitoramento de área administrativa

### Permissões Configuradas

- ✅ Operações AJAX do frontend
- ✅ Upload de JSON na área admin
- ✅ URLs do WhatsApp e Instagram
- ✅ Coordenadas geográficas
- ✅ Campos específicos dos formulários

## Logs Importantes

```bash
# Log principal do ModSecurity
sudo tail -f /var/log/apache2/modsec_audit.log

# Erros do Apache
sudo tail -f /var/log/apache2/error.log

# Log específico do projeto
sudo tail -f /var/log/apache2/cruzeiro_modsec_audit.log
```

## Comandos Úteis

```bash
# Verificar status do ModSecurity
apache2ctl -M | grep security2

# Testar configuração
sudo apache2ctl configtest

# Recarregar configuração
sudo systemctl reload apache2

# Ver regras ativas
sudo grep -r "SecRule" /etc/modsecurity/
```

## Troubleshooting

### Problema: Formulários bloqueados

```bash
# Verificar logs
sudo grep "block" /var/log/apache2/modsec_audit.log

# Adicionar exceção temporária
SecRule REQUEST_FILENAME "@contains /seu-formulario.php" \
    "id:9001,phase:1,pass,ctl:ruleRemoveById=RULE_ID"
```

### Problema: AJAX não funciona

```bash
# Verificar se a regra 2001 está ativa
sudo grep "2001" /etc/modsecurity/custom-cruzeiro.conf
```

### Problema: Upload de arquivos

```bash
# Aumentar limite se necessário
SecRequestBodyLimit 20971520  # 20MB
```

## Manutenção

### Backup da Configuração

```bash
sudo tar -czf modsecurity-backup-$(date +%Y%m%d).tar.gz \
    /etc/modsecurity/ \
    /etc/apache2/sites-available/cruzeiro.conf
```

### Atualização das Regras

```bash
sudo apt update
sudo apt upgrade modsecurity-crs
sudo systemctl restart apache2
```

### Limpeza de Logs

```bash
# Manter apenas últimos 30 dias
sudo find /var/log/apache2/ -name "*.log" -mtime +30 -delete
```

## Configuração de Produção

1. **Alterar domínio** no arquivo `apache-vhost-cruzeiro.conf`
2. **Configurar SSL** com Let's Encrypt
3. **Ajustar limites** conforme necessário
4. **Configurar backup** automático dos logs
5. **Monitorar** regularmente com o script

## Suporte

Para dúvidas ou problemas:

- Verificar logs em `/var/log/apache2/`
- Usar script de monitoramento
- Consultar documentação oficial do ModSecurity
