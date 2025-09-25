let todasEscolas = [];
let filtrosDisponiveis = {};

// Função para escapar HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Carregar dados das escolas e filtros
async function carregarEscolas() {
    try {
        const [escolasResponse, filtrosResponse] = await Promise.all([
            fetch('/api/data.php?file=schools.json'),
            fetch('/api/data.php?file=BRfilters.json')
        ]);
        
        if (!escolasResponse.ok) {
            throw new Error(`Erro ao carregar escolas: ${escolasResponse.status}`);
        }
        if (!filtrosResponse.ok) {
            throw new Error(`Erro ao carregar filtros: ${filtrosResponse.status}`);
        }
        
        todasEscolas = await escolasResponse.json();
        filtrosDisponiveis = await filtrosResponse.json();
        
        if (!Array.isArray(todasEscolas)) {
            throw new Error('Dados de escolas inválidos');
        }
        
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

// Preencher opções dos filtros usando BRfilters.json
function preencherFiltros() {
    const filtroRegiao = document.getElementById('filtroRegiao');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroCidade = document.getElementById('filtroCidade');
    
    // Preencher regiões
    filtroRegiao.innerHTML += `<option value="brasil">Brasil</option>`;
    
    // Preencher estados usando BRfilters.json
    Object.keys(filtrosDisponiveis).forEach(siglaEstado => {
        const estado = filtrosDisponiveis[siglaEstado];
        filtroEstado.innerHTML += `<option value="${siglaEstado}">${estado.name}</option>`;
    });
    
    // Event listener para atualizar cidades quando estado mudar
    filtroEstado.addEventListener('change', atualizarCidades);
}

// Atualizar cidades baseado no estado selecionado
function atualizarCidades() {
    const estadoSelecionado = document.getElementById('filtroEstado').value;
    const filtroCidade = document.getElementById('filtroCidade');
    
    filtroCidade.innerHTML = '<option value="">Todas as Cidades</option>';
    
    if (estadoSelecionado && filtrosDisponiveis[estadoSelecionado]) {
        const cidades = Object.keys(filtrosDisponiveis[estadoSelecionado].cities);
        cidades.sort().forEach(cidade => {
            filtroCidade.innerHTML += `<option value="${cidade}">${cidade}</option>`;
        });
    }
}

// Configurar eventos dos filtros
function configurarFiltros() {
    const filtroRegiao = document.getElementById('filtroRegiao');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroCidade = document.getElementById('filtroCidade');
    const limparFiltros = document.getElementById('limparFiltros');
    
    filtroRegiao.addEventListener('change', aplicarFiltros);
    filtroEstado.addEventListener('change', () => {
        atualizarCidades();
        aplicarFiltros();
    });
    filtroCidade.addEventListener('change', aplicarFiltros);
    limparFiltros.addEventListener('click', () => {
        filtroRegiao.value = '';
        filtroEstado.value = '';
        filtroCidade.value = '';
        filtroCidade.innerHTML = '<option value="">Todas as Cidades</option>';
        renderizarEscolas(todasEscolas);
    });
}

// Aplicar filtros usando BRfilters.json como referência
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
        // Usar BRfilters.json para validar se a cidade existe no estado
        if (filtrosDisponiveis[estadoSelecionado] && 
            filtrosDisponiveis[estadoSelecionado].cities[cidadeSelecionada]) {
            escolasFiltradas = escolasFiltradas.filter(e => {
                const cidadeEscola = extrairCidade(e.endereco_encontrado || e.nome);
                return cidadeEscola === cidadeSelecionada;
            });
        }
    }
    
    renderizarEscolas(escolasFiltradas);
}

// Função auxiliar para extrair cidade do endereço
function extrairCidade(endereco) {
    // Buscar por padrões de cidade nos endereços
    const cidades = Object.values(filtrosDisponiveis).flatMap(estado => 
        Object.keys(estado.cities)
    );
    
    for (const cidade of cidades) {
        if (endereco.includes(cidade)) {
            return cidade;
        }
    }
    return '';
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
        const telefone = escapeHtml(escola.telefone || 'N/A');
        const estado = escapeHtml(escola.estado || 'N/A');
        const imagemUrl = escapeHtml(escola.imagem_URL || '');
        const whatsappUrl = escapeHtml(escola.whatsapp || '');
        const instagramUrl = escapeHtml(escola.instagram_url || '');
        
        return `
            <div class="escola-card">
                ${imagemUrl ? `<img src="${imagemUrl}" alt="${nome}" class="escola-imagem" onerror="this.style.display='none'">` : ''}
                <h3>${nome}</h3>
                <p><strong>Endereço:</strong> ${endereco}</p>
                <p><strong>Telefone:</strong> ${telefone}</p>
                <p><strong>Estado:</strong> ${estado}</p>
                <div class="btn-container">
                    ${whatsappUrl ? `<a href="${whatsappUrl}" target="_blank" class="btn-whatsapp">WhatsApp</a>` : ''}
                    ${instagramUrl ? `<a href="${instagramUrl}" target="_blank" class="btn-instagram">Instagram</a>` : ''}
                </div>
            </div>
        `;
    }).join('');
}

// Carregar quando a página estiver pronta
document.addEventListener('DOMContentLoaded', carregarEscolas);