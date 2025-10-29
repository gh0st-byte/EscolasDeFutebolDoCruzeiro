// Traduções estáticas PT -> EN
const translations = {
  'pt': {
    'Escolas do Cruzeiro': 'Cruzeiro Schools',
    'Home': 'Home',
    'Benefícios': 'Benefits',
    'Unidades': 'Units',
    'Notícias': 'News',
    'Quero ser Franqueado': 'I want to be a Franchisee',
    'MARCAR AULA EXPERIMENTAL': 'BOOK TRIAL CLASS',
    'Últimas Notícias': 'Latest News',
    'Ver Todas': 'View All',
    'NOSSA METODOLOGIA': 'OUR METHODOLOGY',
    'Exclusividade': 'Exclusivity',
    'Formação': 'Training',
    'Desenvolvimento': 'Development',
    'Atributos': 'Attributes',
    'Saiba Mais': 'Learn More',
    'ONDE ESTAMOS?': 'WHERE ARE WE?',
    'Brasil': 'Brazil',
    'Mundo': 'World',
    'Pesquisar unidades ou endereço...': 'Search units or address...',
    'SEJA UM LICENCIADO': 'BECOME A LICENSEE',
    'Quero ser Licenciado': 'I want to be a Licensee',
    'O Maior Campeão': 'The Greatest Champion',
    'Metodologia': 'Methodology',
    'Contato': 'Contact',
    'Siga-nos': 'Follow us',
    'Todos os direitos reservados': 'All rights reserved',
    'Leia mais': 'Read more',
    'Arraste para o lado para conseguir visualizar mais Notícias': 'Swipe to see more News',
    'Sobre Nós': 'About Us',
    'Anterior': 'Previous',
    'Próxima': 'Next',
    'Página': 'Page',
    'de': 'of',
    'Endereço': 'Address',
    'Telefone': 'Phone',
    'WhatsApp': 'WhatsApp',
    'Instagram': 'Instagram',
    'Fechar': 'Close',
    'Entendi': 'Got it',
    'Nome': 'Name',
    'Email': 'Email',
    'Cidade': 'City',
    'Estado': 'State',
    'Mensagem': 'Message',
    'Enviar': 'Send'
  }
};

// Função de tradução usando Google Translate API gratuita
async function translateText(text, targetLang = 'en') {
  if (!text || typeof text !== 'string') return text;
  
  // Primeiro verifica traduções estáticas
  if (translations.pt[text]) {
    return translations.pt[text];
  }
  
  try {
    // Usa API gratuita do Google Translate via proxy
    const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=pt&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`);
    const data = await response.json();
    return data[0][0][0] || text;
  } catch (error) {
    console.warn('Translation failed:', error);
    return text;
  }
}

// Expor função globalmente
window.translateText = translateText;

// Função para traduzir elementos da página
async function translatePage(targetLang = 'en') {
  const elementsToTranslate = document.querySelectorAll('[data-translate]');
  
  for (const element of elementsToTranslate) {
    // Preservar HTML interno se existir
    const hasHTML = element.innerHTML !== element.textContent;
    
    if (hasHTML) {
      // Para elementos com HTML, traduzir apenas o texto
      const originalHTML = element.dataset.originalHTML || element.innerHTML;
      if (!element.dataset.originalHTML) {
        element.dataset.originalHTML = originalHTML;
      }
      
      const textNodes = getTextNodes(element);
      for (const node of textNodes) {
        if (node.textContent.trim()) {
          const originalText = node.dataset?.original || node.textContent;
          const translatedText = await translateText(originalText, targetLang);
          node.textContent = translatedText;
        }
      }
    } else {
      // Para elementos só com texto
      const originalText = element.dataset.original || element.textContent;
      if (!element.dataset.original) {
        element.dataset.original = originalText;
      }
      
      const translatedText = await translateText(originalText, targetLang);
      element.textContent = translatedText;
    }
  }
  
  // Traduzir placeholders
  const inputs = document.querySelectorAll('input[placeholder][data-translate-placeholder], textarea[placeholder][data-translate-placeholder]');
  for (const input of inputs) {
    const originalPlaceholder = input.dataset.originalPlaceholder || input.placeholder;
    if (!input.dataset.originalPlaceholder) {
      input.dataset.originalPlaceholder = originalPlaceholder;
    }
    
    const translatedPlaceholder = await translateText(originalPlaceholder, targetLang);
    input.placeholder = translatedPlaceholder;
  }
  
  // Marcar que a tradução está ativa
  window.translationActive = targetLang;
}

// Função auxiliar para obter nós de texto
function getTextNodes(element) {
  const textNodes = [];
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );
  
  let node;
  while (node = walker.nextNode()) {
    textNodes.push(node);
  }
  return textNodes;
}

// Função para restaurar idioma original
function restoreOriginalLanguage() {
  window.translationActive = false;
  
  // Restaurar elementos com HTML
  const elementsWithHTML = document.querySelectorAll('[data-original-html]');
  elementsWithHTML.forEach(element => {
    element.innerHTML = element.dataset.originalHTML;
  });
  
  // Restaurar elementos só com texto
  const elementsToRestore = document.querySelectorAll('[data-original]:not([data-original-html])');
  elementsToRestore.forEach(element => {
    element.textContent = element.dataset.original;
  });
  
  // Restaurar placeholders
  const inputs = document.querySelectorAll('input[data-original-placeholder], textarea[data-original-placeholder]');
  inputs.forEach(input => {
    input.placeholder = input.dataset.originalPlaceholder;
  });
}

// Inicializar tradutor
function initTranslator() {
  // Criar botão de tradução no header
  const translateBtn = document.createElement('button');
  translateBtn.innerHTML = 'EN';
  translateBtn.style.cssText = `
    background: transparent;
    color: #fff;
    border: 1px solid rgba(255,255,255,0.3);
    padding: 6px 12px;
    border-radius: 15px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.85rem;
    margin-left: 10px;
    transition: all 0.3s ease;
  `;
  
  translateBtn.addEventListener('mouseenter', () => {
    translateBtn.style.background = 'rgba(255,255,255,0.1)';
  });
  
  translateBtn.addEventListener('mouseleave', () => {
    translateBtn.style.background = 'transparent';
  });
  
  let isTranslated = false;
  
  translateBtn.addEventListener('click', async () => {
    if (isTranslated) {
      restoreOriginalLanguage();
      translateBtn.innerHTML = 'EN';
      isTranslated = false;
      if (window.reloadPageData) await window.reloadPageData();
    } else {
      translateBtn.innerHTML = '...';
      await translatePage('en');
      if (window.reloadPageData) await window.reloadPageData();
      translateBtn.innerHTML = 'PT';
      isTranslated = true;
    }
  });
  
  // Adicionar ao header, ao lado direito da logo
  const logo = document.querySelector('.logo');
  if (logo) {
    logo.appendChild(translateBtn);
  }
  
  // Marcar elementos para tradução
  markElementsForTranslation();
}

// Marcar elementos que devem ser traduzidos
function markElementsForTranslation() {
  const selectors = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p:not(.card p)', 'span:not(.menu-icon)', 
    'a:not([href*="mailto"]):not([href*="tel"]):not([href*="whatsapp"]):not(.carousel-btn)', 
    'button:not([data-bs-dismiss]):not(.carousel-btn):not(.fechar-noticia)',
    '.nav-item', '.btn:not(.carousel-btn)', 
    '.card h3', '.card p', '.card a',
    '.footer-section h2', '.footer-section h3', '.footer-section p',
    '.news-item h2', '.news-item p', 
    '.modal-title:not(.news-modal-title)', 
    'label', '.form-label', 'option'
  ];
  
  selectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(element => {
      if (element.textContent.trim() && 
          !element.querySelector('img') && 
          !element.closest('.dropdown-menu') &&
          !element.hasAttribute('data-translate') &&
          element.textContent.length > 1 &&
          !element.classList.contains('carousel-btn')) {
        element.setAttribute('data-translate', '');
      }
    });
  });
  
  // Marcar inputs com placeholder (exceto busca do mapa)
  document.querySelectorAll('input[placeholder]:not(#mapSearch), textarea[placeholder]').forEach(input => {
    input.setAttribute('data-translate-placeholder', '');
  });
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    initTranslator();
    interceptModalOpening();
  }, 500);
});

// Função para traduzir modal específico quando aberto
async function translateOpenModal(modal, targetLang = 'en') {
  const modalTitle = modal.querySelector('.modal-title, .news-modal-title');
  const modalBody = modal.querySelector('.modal-body, .news-modal-text');
  
  if (modalTitle && modalTitle.textContent.trim()) {
    const originalTitle = modalTitle.dataset.original || modalTitle.textContent;
    if (!modalTitle.dataset.original) {
      modalTitle.dataset.original = originalTitle;
    }
    modalTitle.textContent = await translateText(originalTitle, targetLang);
  }
  
  if (modalBody && modalBody.innerHTML.trim()) {
    const originalHTML = modalBody.dataset.originalHTML || modalBody.innerHTML;
    if (!modalBody.dataset.originalHTML) {
      modalBody.dataset.originalHTML = originalHTML;
    }
    
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = originalHTML;
    
    const textNodes = getTextNodes(tempDiv);
    for (const node of textNodes) {
      if (node.textContent.trim() && node.textContent.length > 3) {
        const translatedText = await translateText(node.textContent, targetLang);
        node.textContent = translatedText;
      }
    }
    
    modalBody.innerHTML = tempDiv.innerHTML;
  }
}

// Interceptar abertura de modais
function interceptModalOpening() {
  // Para modais do Bootstrap
  document.addEventListener('shown.bs.modal', async (event) => {
    if (window.translationActive) {
      await translateOpenModal(event.target, window.translationActive);
    }
  });
  
  // Para modais criados dinamicamente (index)
  const originalOpenIndexModal = window.openIndexNewsModal;
  if (originalOpenIndexModal) {
    window.openIndexNewsModal = async function(index) {
      originalOpenIndexModal(index);
      if (window.translationActive) {
        setTimeout(async () => {
          const modal = document.getElementById('indexNewsModal');
          if (modal) await translateOpenModal(modal, window.translationActive);
        }, 100);
      }
    };
  }
  
  // Para modais do news.html
  const originalOpenNewsModal = window.openNewsModal;
  if (originalOpenNewsModal) {
    window.openNewsModal = async function(index) {
      originalOpenNewsModal(index);
      if (window.translationActive) {
        setTimeout(async () => {
          const modal = document.getElementById('newsModal');
          if (modal) await translateOpenModal(modal, window.translationActive);
        }, 100);
      }
    };
  }
}

// Observar mudanças no DOM para traduzir conteúdo dinâmico
const observer = new MutationObserver(() => {
  if (document.querySelector('[data-translate]')) {
    markElementsForTranslation();
  }
});

observer.observe(document.body, {
  childList: true,
  subtree: true
});