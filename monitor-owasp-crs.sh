#!/bin/bash

# Script de monitoramento do OWASP CRS
# Monitora ataques e gera relatórios

LOG_FILE="/var/log/apache2/cruzeiro_modsec_audit.log"
REPORT_FILE="/tmp/modsec_report_$(date +%Y%m%d_%H%M%S).txt"

echo "=== Relatório de Segurança ModSecurity ===" > $REPORT_FILE
echo "Data: $(date)" >> $REPORT_FILE
echo "=========================================" >> $REPORT_FILE
echo "" >> $REPORT_FILE

# Verificar se o log existe
if [ ! -f "$LOG_FILE" ]; then
    echo "ERRO: Log file não encontrado: $LOG_FILE"
    exit 1
fi

# Contar ataques por tipo
echo "ATAQUES DETECTADOS (últimas 24h):" >> $REPORT_FILE
echo "=================================" >> $REPORT_FILE

# XSS
XSS_COUNT=$(grep -c "Cross-site Scripting" $LOG_FILE 2>/dev/null || echo "0")
echo "XSS (Cross-site Scripting): $XSS_COUNT" >> $REPORT_FILE

# SQL Injection
SQL_COUNT=$(grep -c "SQL Injection" $LOG_FILE 2>/dev/null || echo "0")
echo "SQL Injection: $SQL_COUNT" >> $REPORT_FILE

# Path Traversal
PATH_COUNT=$(grep -c "Path Traversal" $LOG_FILE 2>/dev/null || echo "0")
echo "Path Traversal: $PATH_COUNT" >> $REPORT_FILE

# Command Injection
CMD_COUNT=$(grep -c "Command Injection" $LOG_FILE 2>/dev/null || echo "0")
echo "Command Injection: $CMD_COUNT" >> $REPORT_FILE

# Rate Limiting
RATE_COUNT=$(grep -c "Rate limit exceeded" $LOG_FILE 2>/dev/null || echo "0")
echo "Rate Limit Exceeded: $RATE_COUNT" >> $REPORT_FILE

echo "" >> $REPORT_FILE

# Top IPs atacantes
echo "TOP 10 IPs ATACANTES:" >> $REPORT_FILE
echo "====================" >> $REPORT_FILE
grep "client:" $LOG_FILE | awk '{print $NF}' | sort | uniq -c | sort -nr | head -10 >> $REPORT_FILE

echo "" >> $REPORT_FILE

# Últimos ataques
echo "ÚLTIMOS 10 ATAQUES:" >> $REPORT_FILE
echo "==================" >> $REPORT_FILE
tail -20 $LOG_FILE | grep -E "(XSS|SQL|Injection|Traversal)" | tail -10 >> $REPORT_FILE

# Exibir relatório
cat $REPORT_FILE

echo ""
echo "Relatório salvo em: $REPORT_FILE"
echo ""
echo "Para monitoramento em tempo real:"
echo "sudo tail -f $LOG_FILE"