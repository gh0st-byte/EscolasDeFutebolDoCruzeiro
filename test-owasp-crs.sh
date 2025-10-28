#!/bin/bash

# Script de teste do OWASP CRS
# Testa se as regras estão funcionando corretamente

echo "=== Teste do OWASP ModSecurity CRS ==="

# URL base 
BASE_URL="http://localhost:8000"

echo "Testando proteções..."

# Teste 1: XSS
echo "1. Testando proteção XSS..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/?test=<script>alert(1)</script>"

# Teste 2: SQL Injection
echo "2. Testando proteção SQL Injection..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/?id=1' OR '1'='1"

# Teste 3: Path Traversal
echo "3. Testando proteção Path Traversal..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/?file=../../../etc/passwd"

# Teste 4: Command Injection
echo "4. Testando proteção Command Injection..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/?cmd=; cat /etc/passwd"

# Teste 5: Request válido
echo "5. Testando request válido..."
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE_URL/"

echo ""
echo "Códigos esperados:"
echo "- Ataques (1-4): 403 (Forbidden)"
echo "- Request válido (5): 200 (OK)"
echo ""
echo "Verificar logs detalhados:"
echo "sudo tail -f /var/log/apache2/cruzeiro_modsec_audit.log"