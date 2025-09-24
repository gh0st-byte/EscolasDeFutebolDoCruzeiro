let todasEscolas = [];
let filtrosDisponiveis = {};

// Carregar dados das escolas e filtros
async function carregarEscolas() {
    try {
        const [escolasResponse, filtrosResponse] = await Promise.all([
            fetch('../Backend/api/data.php?file=schools.json'),
            fetch('../Backend/api/data.php?file=BRfilters.json')
        ]);
        
        todasEscolas = await escolasResponse.json();
        filtrosDisponiveis = await filtrosResponse.json();
        
        preencherFiltros();
        renderizarEscolas(todasEscolas);
        configurarFiltros();
    } catch (error) {
        console.error('Erro ao carregar dados:', error);
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
    
    if (escolas.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666; grid-column: 1/-1;">Nenhuma escola encontrada com os filtros selecionados.</p>';
        return;
    }
    
    container.innerHTML = escolas.map(escola => `
        <div class="escola-card">
            ${escola.imagem_URL ? `<img src="${escola.imagem_URL}" alt="${escola.nome}" class="escola-imagem">` : ''}
            <h3>${escola.cidade || escola.nome}</h3>
            <p><strong>Endereço:</strong> ${escola.endereco_encontrado}</p>
            <p><strong>Telefone:</strong> ${escola.telefone || 'N/A'}</p>
            <p><strong>Estado:</strong> ${escola.estado}</p>
            <div class="btn-container">
                ${escola.whatsapp ? `<a href="${escola.whatsapp}" target="_blank" class="btn-whatsapp">WhatsApp</a>` : ''}
                ${escola.instagram ? `<a href="${escola.instagram_url}" target="_blank" class="btn-instagram">Instagram</a>` : ''}
            </div>
        </div>
    `).join('');
}

// Carregar quando a página estiver pronta
document.addEventListener('DOMContentLoaded', carregarEscolas);