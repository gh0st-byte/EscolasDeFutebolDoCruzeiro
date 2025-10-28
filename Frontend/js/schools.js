let todasEscolas = [];
let filtrosDisponiveis = {};

// Carregar dados dos filtros
async function carregarFiltros() {
    try {
        const response = await fetch('http://localhost:8000/Backend/api/data.php?file=allRegionsFilters.json');
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
        const [escolasResponse, filtrosResponse] = await Promise.all([
            fetch('http://localhost:8000/Backend/api/data.php?file=schools.json'),
            fetch('http://localhost:8000/Backend/api/data.php?file=allRegionsFilters.json')
        ]);
        
        if (!escolasResponse.ok || !filtrosResponse.ok) {
            throw new Error('Erro ao carregar dados');
        }
        
        todasEscolas = await escolasResponse.json();
        filtrosDisponiveis = await filtrosResponse.json();
        
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
    const filtroEstado = document.getElementById('filtroEstado');
    
    // Limpar filtros
    filtroRegiao.innerHTML = '<option value="">Todas as Regiões</option>';
    filtroEstado.innerHTML = '<option value="">Todos os Estados</option>';
    
    // Adicionar Brasil
    if (filtrosDisponiveis.Brasil) {
        filtroRegiao.innerHTML += '<option value="Brasil">Brasil</option>';
    }
    
    // Adicionar Outras Regiões se existir dados do mundo
    if (filtrosDisponiveis.Mundo && Object.keys(filtrosDisponiveis.Mundo).length > 0) {
        filtroRegiao.innerHTML += '<option value="Mundo">Outras Regiões</option>';
    }
    
    // Event listener para atualizar estados quando região mudar
    filtroRegiao.addEventListener('change', atualizarEstados);
    filtroEstado.addEventListener('change', atualizarCidades);
}

// Atualizar estados baseado na região selecionada
function atualizarEstados() {
    const regiaoSelecionada = document.getElementById('filtroRegiao').value;
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroCidade = document.getElementById('filtroCidade');
    
    filtroEstado.innerHTML = '<option value="">Todos os Estados</option>';
    filtroCidade.innerHTML = '<option value="">Todas as Cidades</option>';
    
    if (regiaoSelecionada === 'Brasil' && filtrosDisponiveis.Brasil?.states) {
        Object.entries(filtrosDisponiveis.Brasil.states).forEach(([codigo, estado]) => {
            filtroEstado.innerHTML += `<option value="${codigo}">${estado.name}</option>`;
        });
    } else if (regiaoSelecionada === 'Mundo' && filtrosDisponiveis.Mundo) {
        Object.entries(filtrosDisponiveis.Mundo).forEach(([pais, dadosPais]) => {
            if (dadosPais.states) {
                Object.entries(dadosPais.states).forEach(([estado, dadosEstado]) => {
                    filtroEstado.innerHTML += `<option value="${estado}">${dadosEstado.name} - ${pais}</option>`;
                });
            }
        });
    }
}

// Atualizar cidades baseado no estado selecionado
function atualizarCidades() {
    const regiaoSelecionada = document.getElementById('filtroRegiao').value;
    const estadoSelecionado = document.getElementById('filtroEstado').value;
    const filtroCidade = document.getElementById('filtroCidade');
    
    filtroCidade.innerHTML = '<option value="">Todas as Cidades</option>';
    
    if (regiaoSelecionada === 'Brasil' && estadoSelecionado && filtrosDisponiveis.Brasil?.states?.[estadoSelecionado]?.cities) {
        filtrosDisponiveis.Brasil.states[estadoSelecionado].cities.forEach(cidade => {
            filtroCidade.innerHTML += `<option value="${cidade}">${cidade}</option>`;
        });
    } else if (regiaoSelecionada === 'Mundo' && estadoSelecionado && filtrosDisponiveis.Mundo) {
        Object.values(filtrosDisponiveis.Mundo).forEach(pais => {
            if (pais.states?.[estadoSelecionado]?.cities) {
                pais.states[estadoSelecionado].cities.forEach(cidade => {
                    filtroCidade.innerHTML += `<option value="${cidade}">${cidade}</option>`;
                });
            }
        });
    }
}

// Configurar eventos dos filtros
function configurarFiltros() {
    const filtroRegiao = document.getElementById('filtroRegiao');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroCidade = document.getElementById('filtroCidade');
    const limparFiltros = document.getElementById('limparFiltros');
    
    filtroRegiao.addEventListener('change', () => {
        atualizarEstados();
        aplicarFiltros();
    });
    filtroEstado.addEventListener('change', () => {
        atualizarCidades();
        aplicarFiltros();
    });
    filtroCidade.addEventListener('change', aplicarFiltros);
    limparFiltros.addEventListener('click', () => {
        filtroRegiao.value = '';
        filtroEstado.value = '';
        filtroCidade.value = '';
        atualizarEstados();
        atualizarCidades();
        renderizarEscolas(todasEscolas);
    });
}

// Aplicar filtros
function aplicarFiltros() {
    const regiaoSelecionada = document.getElementById('filtroRegiao').value;
    const estadoSelecionado = document.getElementById('filtroEstado').value;
    const cidadeSelecionada = document.getElementById('filtroCidade').value;
    
    let escolasFiltradas = todasEscolas;
    
    if (regiaoSelecionada) {
        escolasFiltradas = escolasFiltradas.filter(e => e.region === regiaoSelecionada);
    }
    
    if (estadoSelecionado) {
        escolasFiltradas = escolasFiltradas.filter(e => e.estado === estadoSelecionado);
    }
    
    if (cidadeSelecionada) {
        escolasFiltradas = escolasFiltradas.filter(e => {
            const cidadeEscola = extrairCidade(e.cidade || e.nome);
            return cidadeEscola === cidadeSelecionada;
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