let todasEscolas = [];

// Carregar dados das escolas
async function carregarEscolas() {
    try {
        const response = await fetch('Json/schools.json');
        todasEscolas = await response.json();
        
        preencherFiltros();
        renderizarEscolas(todasEscolas);
        configurarFiltros();
    } catch (error) {
        console.error('Erro ao carregar escolas:', error);
    }
}

// Preencher opções dos filtros
function preencherFiltros() {
    const regioes = [...new Set(todasEscolas.map(e => e.region).filter(Boolean))];
    const estados = [...new Set(todasEscolas.map(e => e.estado).filter(Boolean))];
    const cidades = [...new Set(todasEscolas.map(e => e.cidade ? e.cidade.split('/')[0].split('–')[0].trim() : '').filter(Boolean))];
    
    const filtroRegiao = document.getElementById('filtroRegiao');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroCidade = document.getElementById('filtroCidade');
    
    regioes.forEach(regiao => {
        filtroRegiao.innerHTML += `<option value="${regiao}">${regiao}</option>`;
    });
    
    estados.sort().forEach(estado => {
        filtroEstado.innerHTML += `<option value="${estado}">${estado}</option>`;
    });
    
    cidades.sort().forEach(cidade => {
        filtroCidade.innerHTML += `<option value="${cidade}">${cidade}</option>`;
    });
}

// Configurar eventos dos filtros
function configurarFiltros() {
    const filtroRegiao = document.getElementById('filtroRegiao');
    const filtroEstado = document.getElementById('filtroEstado');
    const filtroCidade = document.getElementById('filtroCidade');
    const limparFiltros = document.getElementById('limparFiltros');
    
    filtroRegiao.addEventListener('change', aplicarFiltros);
    filtroEstado.addEventListener('change', aplicarFiltros);
    filtroCidade.addEventListener('change', aplicarFiltros);
    limparFiltros.addEventListener('click', () => {
        filtroRegiao.value = '';
        filtroEstado.value = '';
        filtroCidade.value = '';
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
            const cidade = e.cidade ? e.cidade.split('/')[0].split('–')[0].trim() : '';
            return cidade === cidadeSelecionada;
        });
    }
    
    renderizarEscolas(escolasFiltradas);
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