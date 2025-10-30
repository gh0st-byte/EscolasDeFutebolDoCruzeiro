let todasEscolas = [];
let filtrosDisponiveis = {};
let filtrosSelecionados = {
    regiao: [],
    estado: [],
    cidade: []
};

// Carregar dados dos filtros
async function carregarFiltros() {
    try {
        const response = await fetch('./data/allRegionsFilters.json');
        if (response.ok) {
            filtrosDisponiveis = await response.json();
        }
    } catch (error) {
        console.error('Erro ao carregar filtros:', error);
    }
}

// Função para escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
        '/': '&#x2F;'
    };
    return String(text).replace(/[&<>"'\/]/g, function (s) {
        return map[s];
    });
}

// Carregar dados das escolas
async function carregarEscolas() {
    try {
        const escolasResponse = await fetch('./data/schools.json');
        
        if (!escolasResponse.ok) {
            throw new Error(`Erro ao carregar escolas: ${escolasResponse.status}`);
        }
        
        todasEscolas = await escolasResponse.json();
        
        if (!Array.isArray(todasEscolas)) {
            throw new Error('Dados de escolas inválidos');
        }
        
        await carregarFiltros();
        preencherFiltros();
        renderizarEscolas(todasEscolas);
        configurarFiltros();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
        const container = document.querySelector('.escolas-grid');
        if (container) {
            container.innerHTML = '<p style="text-align: center; color: #ff0000; grid-column: 1/-1;">Erro ao carregar escolas. Verifique se o servidor está rodando.</p>';
        }
    }
}

// Preencher opções dos filtros baseado no allRegionsFilters.json
function preencherFiltros() {
    const filtroRegiao = document.getElementById('filtroRegiao');
    
    // Adicionar opções de região
    filtroRegiao.innerHTML = `
        <div class="filter-option">
            <input type="checkbox" id="regiao-brasil" value="Brasil">
            <label for="regiao-brasil">Brasil</label>
        </div>
        <div class="filter-option">
            <input type="checkbox" id="regiao-outras" value="outras">
            <label for="regiao-outras">Outras Regiões</label>
        </div>
    `;
    
    // Configurar event listeners para dropdowns
    configurarDropdowns();
    configurarCheckboxes();
}

// Configurar dropdowns
function configurarDropdowns() {
    document.querySelectorAll('.filter-header').forEach(header => {
        header.addEventListener('click', function() {
            const dropdown = this.parentElement;
            const options = dropdown.querySelector('.filter-options');
            const isActive = this.classList.contains('active');
            
            // Fechar outros dropdowns
            document.querySelectorAll('.filter-header.active').forEach(h => {
                if (h !== this) {
                    h.classList.remove('active');
                    h.parentElement.querySelector('.filter-options').classList.remove('show');
                }
            });
            
            // Toggle atual
            this.classList.toggle('active');
            options.classList.toggle('show');
        });
    });
    
    // Fechar dropdowns ao clicar fora
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.filter-dropdown')) {
            document.querySelectorAll('.filter-header.active').forEach(header => {
                header.classList.remove('active');
                header.parentElement.querySelector('.filter-options').classList.remove('show');
            });
        }
    });
}

// Configurar checkboxes
function configurarCheckboxes() {
    // Event listeners para checkboxes de região
    document.querySelectorAll('#filtroRegiao input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                filtrosSelecionados.regiao.push(this.value);
            } else {
                filtrosSelecionados.regiao = filtrosSelecionados.regiao.filter(v => v !== this.value);
            }
            atualizarContador('regiao');
            atualizarEstados();
            aplicarFiltros();
        });
    });
}

// Atualizar contador de filtros selecionados
function atualizarContador(tipo) {
    const header = document.querySelector(`[data-filter="${tipo}"]`);
    const count = header.querySelector('.filter-count');
    const selected = filtrosSelecionados[tipo].length;
    
    count.textContent = selected;
    count.classList.toggle('active', selected > 0);
}

// Atualizar estados baseado na região
function atualizarEstados() {
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroCidade = document.getElementById('filtroCidade');
    
    // Limpar estados e cidades
    filtroEstado.innerHTML = '';
    filtroCidade.innerHTML = '';
    filtrosSelecionados.estado = [];
    filtrosSelecionados.cidade = [];
    atualizarContador('estado');
    atualizarContador('cidade');
    
    const regioesSelecionadas = filtrosSelecionados.regiao;
    
    if (regioesSelecionadas.includes('Brasil') && filtrosDisponiveis?.Brasil?.states) {
        Object.entries(filtrosDisponiveis.Brasil.states).forEach(([codigo, estado]) => {
            filtroEstado.innerHTML += `
                <div class="filter-option">
                    <input type="checkbox" id="estado-${codigo}" value="${codigo}">
                    <label for="estado-${codigo}">${estado.name}</label>
                </div>
            `;
        });
    }
    
    if (regioesSelecionadas.includes('outras') && filtrosDisponiveis?.Mundo) {
        Object.entries(filtrosDisponiveis.Mundo).forEach(([pais, dadosPais]) => {
            if (dadosPais.states) {
                Object.entries(dadosPais.states).forEach(([estado, dadosEstado]) => {
                    filtroEstado.innerHTML += `
                        <div class="filter-option">
                            <input type="checkbox" id="estado-${estado}" value="${estado}">
                            <label for="estado-${estado}">${dadosEstado.name}</label>
                        </div>
                    `;
                });
            }
        });
    }
    
    // Configurar event listeners para novos checkboxes de estado
    document.querySelectorAll('#filtroEstado input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                filtrosSelecionados.estado.push(this.value);
            } else {
                filtrosSelecionados.estado = filtrosSelecionados.estado.filter(v => v !== this.value);
            }
            atualizarContador('estado');
            atualizarCidades();
            aplicarFiltros();
        });
    });
}

// Atualizar cidades baseado no estado selecionado
function atualizarCidades() {
    const filtroCidade = document.getElementById('filtroCidade');
    
    // Limpar cidades
    filtroCidade.innerHTML = '';
    filtrosSelecionados.cidade = [];
    atualizarContador('cidade');
    
    const estadosSelecionados = filtrosSelecionados.estado;
    const regioesSelecionadas = filtrosSelecionados.regiao;
    
    if (regioesSelecionadas.includes('Brasil') && filtrosDisponiveis?.Brasil?.states) {
        estadosSelecionados.forEach(estadoSelecionado => {
            if (filtrosDisponiveis.Brasil.states[estadoSelecionado]?.cities) {
                filtrosDisponiveis.Brasil.states[estadoSelecionado].cities.forEach(cidade => {
                    filtroCidade.innerHTML += `
                        <div class="filter-option">
                            <input type="checkbox" id="cidade-${cidade.replace(/\s+/g, '-')}" value="${cidade}">
                            <label for="cidade-${cidade.replace(/\s+/g, '-')}">${cidade}</label>
                        </div>
                    `;
                });
            }
        });
    }
    
    if (regioesSelecionadas.includes('outras') && filtrosDisponiveis?.Mundo) {
        Object.values(filtrosDisponiveis.Mundo).forEach(pais => {
            estadosSelecionados.forEach(estadoSelecionado => {
                if (pais.states?.[estadoSelecionado]?.cities) {
                    pais.states[estadoSelecionado].cities.forEach(cidade => {
                        filtroCidade.innerHTML += `
                            <div class="filter-option">
                                <input type="checkbox" id="cidade-${cidade.replace(/\s+/g, '-')}" value="${cidade}">
                                <label for="cidade-${cidade.replace(/\s+/g, '-')}">${cidade}</label>
                            </div>
                        `;
                    });
                }
            });
        });
    }
    
    // Configurar event listeners para novos checkboxes de cidade
    document.querySelectorAll('#filtroCidade input[type="checkbox"]').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            if (this.checked) {
                filtrosSelecionados.cidade.push(this.value);
            } else {
                filtrosSelecionados.cidade = filtrosSelecionados.cidade.filter(v => v !== this.value);
            }
            atualizarContador('cidade');
            aplicarFiltros();
        });
    });
}

// Configurar eventos dos filtros
function configurarFiltros() {
    const limparFiltros = document.getElementById('limparFiltros');
    
    limparFiltros.addEventListener('click', () => {
        // Limpar todos os checkboxes
        document.querySelectorAll('.filter-options input[type="checkbox"]').forEach(checkbox => {
            checkbox.checked = false;
        });
        
        // Resetar filtros selecionados
        filtrosSelecionados = {
            regiao: [],
            estado: [],
            cidade: []
        };
        
        // Atualizar contadores
        atualizarContador('regiao');
        atualizarContador('estado');
        atualizarContador('cidade');
        
        // Limpar estados e cidades
        document.getElementById('filtroEstado').innerHTML = '';
        document.getElementById('filtroCidade').innerHTML = '';
        
        // Renderizar todas as escolas
        renderizarEscolas(todasEscolas);
    });
}

// Aplicar filtros
function aplicarFiltros() {
    let escolasFiltradas = todasEscolas;
    
    // Filtrar por região
    if (filtrosSelecionados.regiao.length > 0) {
        escolasFiltradas = escolasFiltradas.filter(escola => {
            if (filtrosSelecionados.regiao.includes('Brasil') && escola.region === 'Brasil') {
                return true;
            }
            if (filtrosSelecionados.regiao.includes('outras') && escola.region !== 'Brasil') {
                return true;
            }
            return false;
        });
    }
    
    // Filtrar por estado
    if (filtrosSelecionados.estado.length > 0) {
        escolasFiltradas = escolasFiltradas.filter(escola => 
            filtrosSelecionados.estado.includes(escola.estado)
        );
    }
    
    // Filtrar por cidade
    if (filtrosSelecionados.cidade.length > 0) {
        escolasFiltradas = escolasFiltradas.filter(escola => {
            const cidadeEscola = extrairCidade(escola.cidade || escola.nome);
            return filtrosSelecionados.cidade.includes(cidadeEscola);
        });
    }
    
    renderizarEscolas(escolasFiltradas);
}

// Função auxiliar para extrair cidade
function extrairCidade(texto) {
    if (!texto) return '';
    
    // Remover sufixos como /MG, /SP, etc.
    const limpo = texto.replace(/\s*[–-]\s*[A-Z]{2}\s*$/, '').trim();
    
    // Se contém hífen ou traço, pegar a primeira parte
    if (limpo.includes('–') || limpo.includes('-')) {
        return limpo.split(/[–-]/)[0].trim();
    }
    
    return limpo;
}

// Renderizar escolas na página
function renderizarEscolas(escolas) {
    const container = document.querySelector('.escolas-grid');
    
    if (!container) {
        console.error('Container .escolas-grid não encontrado');
        return;
    }
    
    if (!escolas || escolas.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">Nenhuma escola encontrada com os filtros selecionados.</p>';
        return;
    }
    
    container.innerHTML = escolas.map(escola => {
        const nome = escapeHtml(escola.nome || escola.cidade || 'Escola do Cruzeiro');
        const endereco = escapeHtml(escola.endereco_encontrado || escola.endereco || 'Endereço não informado');
        const telefone = escapeHtml(escola.telefone || '');

        const whatsappUrl = escola.whatsapp && escola.whatsapp.trim() && escola.whatsapp !== 'null' ? escola.whatsapp : '';
        let instagramUrl = '';
        if (escola.instagram_url && escola.instagram_url.trim() && escola.instagram_url !== 'null') {
            instagramUrl = escola.instagram_url;
        } else if (escola.instagram && escola.instagram.trim() && escola.instagram !== 'null' && escola.instagram.startsWith('@')) {
            instagramUrl = `https://www.instagram.com/${escola.instagram.replace('@', '')}`;
        }
        
        return `
            <div class="escola-card">
                <div class="embed-map-responsive">
                    <iframe 
                        src="https://maps.google.com/maps?width=100%25&height=200&hl=pt&q=${encodeURIComponent(endereco)}&t=&z=15&ie=UTF8&iwloc=B&output=embed"
                        width="100%" 
                        height="100%" 
                        style="border:0; border-radius: 12px;" 
                        allowfullscreen="" 
                        loading="lazy" 
                        referrerpolicy="no-referrer-when-downgrade">
                    </iframe>
                </div>
                <br>
                <h3>${nome}</h3>
                ${telefone ? `<p><strong>Telefone:</strong> ${telefone}</p>` : ''}
                <p><strong>Endereço:</strong> ${endereco}</p>
                <div class="btn-container">
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(endereco)}" target="_blank" class="btn-maps">Como Chegar</a>
                    ${whatsappUrl ? `<a href="${escapeHtml(whatsappUrl)}" target="_blank" class="btn-whatsapp">WhatsApp</a>` : ''}
                    ${instagramUrl ? `<a href="${escapeHtml(instagramUrl)}" target="_blank" class="btn-instagram">Instagram</a>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Carregar quando a página estiver pronta
document.addEventListener('DOMContentLoaded', carregarEscolas);