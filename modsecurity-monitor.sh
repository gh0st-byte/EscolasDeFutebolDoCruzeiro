#!/bin/bash

# Script de monitoramento do ModSecurity
# Para Escolas do Cruzeiro - Marco Túlio Paiva Repoles

LOG_FILE="/var/log/apache2/modsec_audit.log"
ERROR_LOG="/var/log/apache2/error.log"
ACCESS_LOG="/var/log/apache2/access.log"

echo "=== Monitor ModSecurity - Escolas do Cruzeiro ==="
echo "Data: $(date)"
echo

# Função para mostrar ataques bloqueados hoje
show_blocked_attacks() {
    echo "🛡️  ATAQUES BLOQUEADOS HOJE:"
    echo "================================"
    
    TODAY=$(date +%Y-%m-%d)
    
    if [ -f "$LOG_FILE" ]; then
        grep "$TODAY" "$LOG_FILE" | grep -E "(SQL|XSS|attack)" | wc -l | xargs echo "Total de ataques bloqueados:"
        
        echo
        echo "Tipos de ataques:"
        grep "$TODAY" "$LOG_FILE" | grep -oE "(SQL Injection|XSS|attack-[a-z]+)" | sort | uniq -c | sort -nr
    else
        echo "Log do ModSecurity não encontrado"
    fi
    echo
}

# Função para mostrar IPs suspeitos
show_suspicious_ips() {
    echo "🚨 IPs SUSPEITOS (mais de 10 tentativas):"
    echo "========================================"
    
    if [ -f "$ERROR_LOG" ]; then
        grep "$(date +%Y-%m-%d)" "$ERROR_LOG" | grep -oE "[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+" | sort | uniq -c | sort -nr | head -10
    fi
    echo
}

# Função para mostrar status do sistema
show_system_status() {
    echo "📊 STATUS DO SISTEMA:"
    echo "===================="
    
    echo "ModSecurity: $(apache2ctl -M | grep security2 > /dev/null && echo "✅ Ativo" || echo "❌ Inativo")"
    echo "Apache: $(systemctl is-active apache2)"
    echo "SSL: $(systemctl is-active certbot.timer)"
    
    echo
    echo "Uso de recursos:"
    echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"
    echo "RAM: $(free -m | awk 'NR==2{printf "%.1f%%", $3*100/$2}')"
    echo "Disco: $(df -h / | awk 'NR==2{print $5}')"
    echo
}

# Função para mostrar logs em tempo real
monitor_realtime() {
    echo "📡 MONITORAMENTO EM TEMPO REAL:"
    echo "=============================="
    echo "Pressione Ctrl+C para parar"
    echo
    
    if [ -f "$LOG_FILE" ]; then
        tail -f "$LOG_FILE" | grep --line-buffered -E "(attack|block|deny)" | while read line; do
            echo "$(date '+%H:%M:%S') - $line"
        done
    else
        echo "Log não encontrado. Monitorando error.log..."
        tail -f "$ERROR_LOG" | grep --line-buffered "ModSecurity"
    fi
}

# Função para gerar relatório
generate_report() {
    REPORT_FILE="/tmp/modsecurity-report-$(date +%Y%m%d).txt"
    
    echo "📋 Gerando relatório completo..."
    
    {
        echo "RELATÓRIO MODSECURITY - ESCOLAS DO CRUZEIRO"
        echo "=========================================="
        echo "Data: $(date)"
        echo
        
        show_blocked_attacks
        show_suspicious_ips
        show_system_status
        
        echo "CONFIGURAÇÃO ATUAL:"
        echo "=================="
        apache2ctl -M | grep security
        echo
        
        echo "ÚLTIMAS 20 ENTRADAS DO LOG:"
        echo "=========================="
        if [ -f "$LOG_FILE" ]; then
            tail -20 "$LOG_FILE"
        fi
        
    } > "$REPORT_FILE"
    
    echo "Relatório salvo em: $REPORT_FILE"
}

# Menu principal
case "$1" in
    "attacks")
        show_blocked_attacks
        ;;
    "ips")
        show_suspicious_ips
        ;;
    "status")
        show_system_status
        ;;
    "monitor")
        monitor_realtime
        ;;
    "report")
        generate_report
        ;;
    *)
        echo "Uso: $0 {attacks|ips|status|monitor|report}"
        echo
        echo "Comandos disponíveis:"
        echo "  attacks  - Mostrar ataques bloqueados hoje"
        echo "  ips      - Mostrar IPs suspeitos"
        echo "  status   - Status do sistema"
        echo "  monitor  - Monitoramento em tempo real"
        echo "  report   - Gerar relatório completo"
        echo
        
        # Mostrar resumo por padrão
        show_system_status
        show_blocked_attacks
        ;;
esac