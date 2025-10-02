# Configuração OWASP CRS - Escolas do Cruzeiro

## Instalação Rápida

```bash
# 1. Executar instalação
sudo bash install-owasp-crs.sh

# 2. Configurar domínio (editar arquivo)
sudo nano /etc/apache2/sites-available/cruzeiro.conf
# Alterar "seu-dominio.com" para seu domínio real

# 3. Instalar SSL
sudo certbot --apache -d seu-dominio.com

# 4. Testar configuração
bash test-owasp-crs.sh
```

## Arquivos Criados

- `owasp-crs-setup.conf` - Configuração principal
- `owasp-crs-exclusions.conf` - Exclusões para evitar falsos positivos
- `install-owasp-crs.sh` - Script de instalação
- `test-owasp-crs.sh` - Script de teste
- `monitor-owasp-crs.sh` - Script de monitoramento

## Proteções Ativadas

### Ataques Bloqueados
- XSS (Cross-site Scripting)
- SQL Injection
- Path Traversal
- Command Injection
- File Upload malicioso
- Rate Limiting (60 req/min)

### Exclusões Configuradas
- Campos de endereço (caracteres especiais)
- URLs do WhatsApp/Instagram
- Coordenadas geográficas
- Conteúdo de notícias
- Tokens CSRF e sessões PHP

## Monitoramento

### Logs Principais
```bash
# Log de auditoria
sudo tail -f /var/log/apache2/cruzeiro_modsec_audit.log

# Log de erro
sudo tail -f /var/log/apache2/cruzeiro_error.log

# Log de acesso
sudo tail -f /var/log/apache2/cruzeiro_access.log
```

### Relatório de Segurança
```bash
# Gerar relatório
bash monitor-owasp-crs.sh
```

## Configurações Específicas

### Rate Limiting
- Limite: 60 requests por minuto por IP
- Resposta: HTTP 429 (Too Many Requests)

### Uploads
- Limite: 12.5MB por request
- Tipos permitidos: Configurado via exclusões

### Auditoria
- Modo: RelevantOnly (apenas eventos importantes)
- Status auditados: 4xx e 5xx (exceto 404)

## Troubleshooting

### Falsos Positivos
Se alguma funcionalidade for bloqueada incorretamente:

1. Verificar logs:
```bash
sudo tail -f /var/log/apache2/cruzeiro_modsec_audit.log
```

2. Adicionar exclusão em `owasp-crs-exclusions.conf`:
```apache
SecRule ARGS:campo_problema "@unconditionalMatch" \
    "id:'1050',phase:2,pass,nolog,ctl:ruleRemoveTargetById=RULE_ID;ARGS:campo_problema"
```

3. Reiniciar Apache:
```bash
sudo systemctl restart apache2
```

### Desabilitar Temporariamente
```bash
# Modo detecção apenas (não bloqueia)
sudo sed -i 's/SecRuleEngine On/SecRuleEngine DetectionOnly/' /etc/modsecurity/modsecurity.conf
sudo systemctl restart apache2

# Reativar bloqueio
sudo sed -i 's/SecRuleEngine DetectionOnly/SecRuleEngine On/' /etc/modsecurity/modsecurity.conf
sudo systemctl restart apache2
```

## Manutenção

### Atualizar Regras
```bash
sudo apt update
sudo apt upgrade modsecurity-crs
sudo systemctl restart apache2
```

### Backup da Configuração
```bash
sudo tar -czf modsecurity-backup-$(date +%Y%m%d).tar.gz \
    /etc/modsecurity/ \
    /etc/apache2/sites-available/cruzeiro.conf
```

## Status da Instalação

Para verificar se está funcionando:
```bash
# Testar proteção XSS
curl -I "http://seu-dominio.com/?test=<script>alert(1)</script>"
# Deve retornar: HTTP/1.1 403 Forbidden

# Testar request normal
curl -I "http://seu-dominio.com/"
# Deve retornar: HTTP/1.1 200 OK
```