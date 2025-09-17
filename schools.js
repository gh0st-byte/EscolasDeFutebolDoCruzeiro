// Carregar dados das escolas
async function carregarEscolas() {
    try {
        const response = await fetch('Json/schools.json');
        const escolas = await response.json();
        
        renderizarEscolas(escolas);
    } catch (error) {
        console.error('Erro ao carregar escolas:', error);
    }
}

// Renderizar escolas na página
function renderizarEscolas(escolas) {
    const container = document.querySelector('.escolas-grid');
    
    container.innerHTML = escolas.map(escola => `
        <div class="escola-card">
            <h3>${escola.nome}</h3>
            <p><strong>Endereço:</strong> ${escola.endereco_encontrado}</p>
            <p><strong>Telefone:</strong> ${escola.telefone || 'N/A'}</p>
            <p><strong>Estado:</strong> ${escola.estado}</p>
            ${escola.instagram ? `<a href="${escola.instagram_url}" target="_blank">📱 ${escola.instagram}</a>` : ''}
            ${escola.whatsapp ? `<a href="${escola.whatsapp}" target="_blank">💬 WhatsApp</a>` : ''}
        </div>
    `).join('');
}

// Carregar quando a página estiver pronta
document.addEventListener('DOMContentLoaded', carregarEscolas);