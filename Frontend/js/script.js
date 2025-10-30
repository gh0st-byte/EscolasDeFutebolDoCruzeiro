// Configuração de segurança
const CONFIG = {
  API_BASE: './data/',
  FALLBACK_IMAGE: 'https://images.pexels.com/photos/29920213/pexels-photo-29920213.jpeg',
  DEBOUNCE_DELAY: 300,
  MAP_INIT_DELAY: 100
};

// Utilitários de segurança
const Security = {
  escapeHtml: (text) => {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },
  
  sanitizeUrl: (url) => {
    if (!url || typeof url !== 'string') return '';
    return url.startsWith('http') ? url : '';
  },
  
  validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  
  validatePhone: (phone) => phone.replace(/\D/g, '').length >= 10,
  
  debounce: (fn, delay = CONFIG.DEBOUNCE_DELAY) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }
};

// Cache para dados
const Cache = {
  data: new Map(),
  set: (key, value, ttl = 300000) => { // 5min TTL
    Cache.data.set(key, { value, expires: Date.now() + ttl });
  },
  get: (key) => {
    const item = Cache.data.get(key);
    return item && item.expires > Date.now() ? item.value : null;
  }
};

// API Helper
const API = {
  fetch: async (file) => {
    const cached = Cache.get(file);
    if (cached) return cached;
    
    const response = await fetch(`${CONFIG.API_BASE}${file}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const data = await response.json();
    Cache.set(file, data);
    return data;
  },
  
  fetchTranslated: async (file, targetLang = 'en') => {
    const cacheKey = `${file}_${targetLang}`;
    const cached = Cache.get(cacheKey);
    if (cached) return cached;
    
    const originalData = await API.fetch(file);
    const translatedData = await translateJsonData(originalData, targetLang);
    Cache.set(cacheKey, translatedData);
    return translatedData;
  }
};

// Header scroll effect
window.addEventListener('scroll', () => {
  document.querySelector('header')?.classList.toggle('scrolled', window.scrollY > 0);
});

// Variáveis globais do mapa
let map, markers, schools = [];

// Inicializar mapa
function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement || typeof L === 'undefined') return;
  
  map = L.map('map', {
    center: [-15.78, -47.93], 
    zoom: 4,
    minZoom: 2,
    maxZoom: 18,
    worldCopyJump: false,
    maxBounds: [[-85, -180], [85, 180]]
  });

  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    noWrap: true,
    bounds: [[-85, -180], [85, 180]],
    minZoom: 2,
    maxZoom: 18
  }).addTo(map);

  markers = L.markerClusterGroup({
    maxClusterRadius: 50,
    iconCreateFunction: (cluster) => {
      const count = cluster.getChildCount();
      const size = count < 10 ? 40 : count < 20 ? 50 : 60;
      return new L.DivIcon({ 
        html: `<div style="background-color: #0033a0; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${count}</div>`, 
        className: 'custom-cluster', 
        iconSize: new L.Point(size, size) 
      });
    }
  });
  
  loadSchools();
  setupMapButtons();
  setupMapSearch();
  
  setTimeout(() => map?.invalidateSize(), 500);
}

// Carregar escolas
async function loadSchools() {
  try {
    schools = window.translationActive ? 
      await API.fetchTranslated('schools.json', window.translationActive) : 
      await API.fetch('schools.json');
    addMarkers('Brasil');
  } catch (error) {
    console.error('Erro ao carregar escolas:', error);
  }
}

// Criar ícone personalizado
const createBlueCircleIcon = () => L.divIcon({
  className: 'custom-marker',
  html: '<div style="background-color: #0033a0; width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 0 25px 3px #0026ffff;"></div>',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

// Adicionar marcadores no mapa
function addMarkers(region = 'all') {
  if (!markers) return;
  
  markers.clearLayers();
  
  const filteredSchools = schools.filter(p => {
    if (region === 'all') return true;
    if (region === 'Brasil') return p.region?.toLowerCase() === 'brasil';
    if (region === 'world') return p.region?.toLowerCase() !== 'brasil';
    return p.region?.toLowerCase() === region.toLowerCase();
  });
  
  filteredSchools.forEach(p => {
    if (!p.lat || !p.lng || isNaN(p.lat) || isNaN(p.lng)) return;
    
    const nome = p.nome || p.cidade || 'Escola do Cruzeiro';
    const endereco = p.endereco_encontrado || p.endereco || 'Endereço não disponível';
    const telefone = p.telefone || '';
    
    const hasWhatsapp = p.whatsapp?.trim() && p.whatsapp !== 'null';
    let instagramUrl = '';
    if (p.instagram_url?.trim() && p.instagram_url !== 'null') {
      instagramUrl = Security.sanitizeUrl(p.instagram_url);
    } else if (p.instagram?.startsWith('@')) {
      instagramUrl = `https://www.instagram.com/${p.instagram.replace('@', '')}`;
    }
    
    const popupContent = `
      <div class="escola-popup-card" style="min-width: 250px; text-align: center; padding: 15px;">
        <h4 style="color: #0033a0; margin-bottom: 10px; font-size: 16px; font-weight: bold;">${Security.escapeHtml(nome)}</h4>
        <p style="margin-bottom: 8px; font-size: 14px; color: #555;"><strong>Endereço:</strong><br>${Security.escapeHtml(endereco)}</p>
        ${telefone ? `<p style="margin-bottom: 10px; font-size: 14px; color: #555;"><strong>Telefone:</strong> ${Security.escapeHtml(telefone)}</p>` : ''}
        <div style="display: flex; gap: 8px; justify-content: center; margin-top: 12px;">
          ${hasWhatsapp ? `<a href="${Security.escapeHtml(p.whatsapp)}" target="_blank" rel="noopener" style="background: #25D366; color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; font-size: 12px; font-weight: bold; display: inline-block;">WhatsApp</a>` : ''}
          ${instagramUrl ? `<a href="${Security.escapeHtml(instagramUrl)}" target="_blank" rel="noopener" style="background: #E1306C; color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; font-size: 12px; font-weight: bold; display: inline-block;">Instagram</a>` : ''}
        </div>
      </div>
    `;
    
    const marker = L.marker([Number(p.lat), Number(p.lng)], {icon: createBlueCircleIcon(), title: nome});
    marker.schoolId = p.id || p._id || p.codigo || null;
    marker.bindPopup(popupContent, { maxWidth: 300, className: 'custom-popup' });
    markers.addLayer(marker);
  });
  
  map.addLayer(markers);
}

// Configurar botões do mapa
function setupMapButtons() {
  document.querySelectorAll('.menu-map button').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.menu-map button').forEach(b => b.classList.remove('active-map'));
      this.classList.add('active-map');
      const region = this.dataset.region;
      
      if(region === 'Brasil') {
        map.setView([-15.78, -47.93], 4);
        addMarkers('Brasil');
      } else if(region === 'world') {
        map.setView([20, 0], 2);
        addMarkers('world');
      }
    });
  });
}

// Configurar busca do mapa
function setupMapSearch() {
  const input = document.getElementById('mapSearch');
  const resultsList = document.getElementById('mapSearchResults');
  if (!input || !resultsList) return;

  const clearResults = () => {
    resultsList.innerHTML = '';
    resultsList.style.display = 'none';
  };

  const showResults = (items) => {
    resultsList.innerHTML = items.map((item, index) => 
      `<li data-index="${index}" data-lat="${item.lat || ''}" data-lng="${item.lng || ''}">${Security.escapeHtml(item.nome || item.cidade || item.endereco_encontrado || '')}</li>`
    ).join('');
    resultsList.style.display = items.length ? 'block' : 'none';
    resultsList._currentItems = items;
  };

  input.addEventListener('input', Security.debounce((e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) { clearResults(); return; }

    const results = schools.filter(s => {
      const fields = `${s.nome || ''} ${s.cidade || ''} ${s.endereco_encontrado || ''} ${s.bairro || ''}`.toLowerCase();
      return fields.includes(q) && s.lat && s.lng;
    }).slice(0, 8);

    showResults(results);
  }));

  resultsList.addEventListener('click', (ev) => {
    const li = ev.target.closest('li');
    if (!li) return;
    
    const index = parseInt(li.dataset.index);
    const items = resultsList._currentItems || [];
    const selected = items[index];
    
    if (selected?.lat && selected?.lng) {
      const lat = Number(selected.lat);
      const lng = Number(selected.lng);
      
      map.setView([lat, lng], 15);
      
      let markerFound = false;
      if (selected.id) {
        markers.eachLayer(layer => {
          if (markerFound) return;
          if (layer.schoolId && String(layer.schoolId) === String(selected.id)) {
            setTimeout(() => layer.openPopup(), 200);
            markerFound = true;
          }
        });
      }

      if (!markerFound) {
        markers.eachLayer(layer => {
          if (markerFound || !layer.getLatLng) return;
          const markerLat = layer.getLatLng().lat;
          const markerLng = layer.getLatLng().lng;
          if (Math.abs(markerLat - lat) < 0.01 && Math.abs(markerLng - lng) < 0.01) {
            setTimeout(() => layer.openPopup(), 200);
            markerFound = true;
          }
        });
      }
    }
    
    clearResults();
    input.value = '';
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.map-search')) clearResults();
  });
}

// Função para traduzir dados JSON
async function translateJsonData(data, targetLang = 'en') {
  if (!data || !window.translateText) return data;
  
  if (Array.isArray(data)) {
    return Promise.all(data.map(item => translateJsonData(item, targetLang)));
  }
  
  if (typeof data === 'object') {
    const translated = {};
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'string' && shouldTranslateField(key)) {
        translated[key] = await window.translateText(value, targetLang);
      } else if (typeof value === 'object') {
        translated[key] = await translateJsonData(value, targetLang);
      } else {
        translated[key] = value;
      }
    }
    return translated;
  }
  
  return data;
}

// Campos que devem ser traduzidos no JSON
function shouldTranslateField(fieldName) {
  const translatableFields = [
    'title', 'subtitle', 'content', 'nome', 'endereco', 'endereco_encontrado',
    'bairro', 'cidade', 'region', 'estado', 'experiencia', 'mensagem',
    'dayWeek', 'month', 'status'
  ];
  return translatableFields.includes(fieldName);
}

// Carregar notícias para o index
async function loadIndexNews() {
  const container = document.getElementById('newsCardsContainer');
  if (!container) return;
  
  try {
    const data = window.translationActive ? 
      await API.fetchTranslated('news.json', window.translationActive) : 
      await API.fetch('news.json');
    const noticias = data.reverse().slice(0, 15);
    
    container.innerHTML = noticias.map((item, index) => {
      const imageURL = Security.sanitizeUrl(item['1-image_URL']) || CONFIG.FALLBACK_IMAGE;
      const title = item.title || 'Título da Notícia';
      const content = item.content || 'Resumo da notícia...';
      const resumo = content.length > 80 ? content.substring(0, 80) + '...' : content;
      
      return `
        <div class="card">
          <img src="${Security.escapeHtml(imageURL)}" alt="${Security.escapeHtml(title)}">
          <h3>${Security.escapeHtml(title)}</h3>
          <p>${Security.escapeHtml(resumo)}</p>
          <a href="#" onclick="openIndexNewsModal(${index}); return false;">Leia mais</a>
        </div>
      `;
    }).join('');
    
    window.indexNews = noticias;
    
    const imgs = container.querySelectorAll('img');
    Promise.all(Array.from(imgs).map(img => 
      img.complete ? Promise.resolve() : new Promise(resolve => {
        img.addEventListener('load', resolve);
        img.addEventListener('error', resolve);
      })
    )).then(() => initNewsCarousel()).catch(() => initNewsCarousel());
  } catch (error) {
    console.error('Erro ao carregar notícias:', error);
    container.innerHTML = `
      <div class="card">
        <img src="${CONFIG.FALLBACK_IMAGE}" alt="Notícia">
        <h3>Últimas Notícias</h3>
        <p>Acompanhe as novidades das Escolas do Cruzeiro...</p>
      </div>
    `;
  }
}

// Inicializar carrossel de notícias
function initNewsCarousel() {
  const track = document.querySelector('.news-cards');
  const carousel = document.querySelector('.news-carousel');
  const cards = document.querySelectorAll('.card');
  
  if (!track || !carousel || cards.length === 0) return;
  let currentIndex = 0;

  const calculateLayout = () => {
  const firstCard = track.querySelector('.card');
  if (!firstCard) return { cardWidth: 360, visibleCards: 1, maxIndex: 0 };

  const cardRect = firstCard.getBoundingClientRect();
  const style = window.getComputedStyle(firstCard);

  // usa o gap real do container em vez da marginRight
  const gap = parseFloat(window.getComputedStyle(track).gap || '0');
  const cardWidth = Math.round(cardRect.width + gap);

  const containerWidth = carousel.clientWidth;
  const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
  const maxIndex = Math.max(0, cards.length - visibleCards);

  return { cardWidth, visibleCards, maxIndex };
};

  const updateCarousel = () => {
    const { cardWidth, maxIndex } = calculateLayout();
    const screenWidth = window.innerWidth;
    
    if (currentIndex > maxIndex) currentIndex = maxIndex;
    
    if (screenWidth > 480) {
      track.style.transition = 'transform 300ms ease';
      track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
      carousel.scrollLeft = 0;
    } else {
      track.style.transform = 'translateX(0)';
      carousel.scrollLeft = currentIndex * cardWidth;
    }


    const next = document.getElementById('newsNextBtn');
    const prev = document.getElementById('newsPrevBtn');
    if (prev) prev.disabled = currentIndex === 0;
    if (next) next.disabled = currentIndex >= maxIndex;
  };

  const prevBtn = document.getElementById('newsPrevBtn');
  const nextBtn = document.getElementById('newsNextBtn');
  
  if (prevBtn && nextBtn && !prevBtn.dataset.initialized) {
    

    nextBtn.addEventListener('click', () => {
      const { maxIndex } = calculateLayout();
      if (currentIndex < maxIndex) {
        currentIndex++;
        updateCarousel();
      }
    });
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    });
    nextBtn.dataset.initialized = 'true';
    prevBtn.dataset.initialized = 'true';

  }

  if (!window._newsCarouselInitialized) {
    window.addEventListener('resize', Security.debounce(() => {
      currentIndex = 0;
      updateCarousel();
    }, 120));
    window._newsCarouselInitialized = true;
  }

  updateCarousel();
}

// Formulário de contato
function initFormularioContato() {
  const telefoneInput = document.getElementById('telefone');
  const form = document.getElementById('whatsappForm');
  
  if (!telefoneInput || !form) return;
  
  let schoolsData = [];
  
  API.fetch('schools.json').then(data => {
    schoolsData = data;
  }).catch(console.error);
  
  telefoneInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 11) {
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length >= 7) {
      value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length >= 3) {
      value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    }
    e.target.value = value;
  });

  const atualizarCidades = () => {
    const estadoSelect = document.getElementById('estado');
    const cidadeSelect = document.getElementById('cidade');
    const unidadeSelect = document.getElementById('unidade');
    
    if (!estadoSelect || !cidadeSelect) return;
    
    const estado = estadoSelect.value;
    cidadeSelect.innerHTML = '<option value="" disabled selected>Selecione a cidade</option>';
    
    if (schoolsData.length > 0) {
      const cidadesUnicas = [...new Set(
        schoolsData
          .filter(escola => escola.estado === estado && escola.whatsapp?.trim() && escola.whatsapp !== 'null')
          .map(escola => escola.cidade ? escola.cidade.split(/[\/\-–]/)[0].trim() : '')
          .filter(cidade => cidade)
      )];
      
      cidadesUnicas.forEach(cidade => {
        cidadeSelect.innerHTML += `<option value="${cidade}">${cidade}</option>`;
      });
    }
    
    cidadeSelect.disabled = false;
    if (unidadeSelect) {
      unidadeSelect.innerHTML = '<option value="" disabled selected>Primeiro selecione a cidade</option>';
      unidadeSelect.disabled = true;
    }
  };

  const atualizarUnidades = () => {
    const cidadeSelect = document.getElementById('cidade');
    const estadoSelect = document.getElementById('estado');
    const unidadeSelect = document.getElementById('unidade');
    
    if (!cidadeSelect || !estadoSelect || !unidadeSelect) return;
    
    const cidade = cidadeSelect.value;
    const estado = estadoSelect.value;
    
    unidadeSelect.innerHTML = '<option value="" disabled selected>Selecione a unidade</option>';
    
    if (schoolsData.length > 0) {
      const unidadesFiltradas = schoolsData.filter(escola => 
        escola.estado === estado && 
        escola.cidade?.includes(cidade) &&
        escola.whatsapp?.trim() && 
        escola.whatsapp !== 'null'
      );
      
      if (unidadesFiltradas.length > 0) {
        unidadesFiltradas.forEach(escola => {
          const nomeExibicao = escola.nome || escola.cidade;
          unidadeSelect.innerHTML += `<option value="${nomeExibicao}" data-whatsapp="${escola.whatsapp}">${nomeExibicao}</option>`;
        });
      } else {
        unidadeSelect.innerHTML += '<option value="Consultar disponibilidade">Nenhuma unidade com WhatsApp disponível nesta região</option>';
      }
    }
    
    unidadeSelect.disabled = false;
  };
  
  document.getElementById('estado')?.addEventListener('change', atualizarCidades);
  document.getElementById('cidade')?.addEventListener('change', atualizarUnidades);

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const cidade = document.getElementById('cidade').value;
    const estado = document.getElementById('estado').value;
    const unidade = document.getElementById('unidade').value;
    const telefone = telefoneInput.value.trim();
    const mensagem = document.getElementById('mensagem').value.trim();

    if (!nome || !cidade || !estado || !unidade || !telefone) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!Security.validatePhone(telefone)) {
      alert('Por favor, digite um número de WhatsApp válido.');
      return;
    }

    const unidadeOption = document.getElementById('unidade').querySelector(`option[value="${unidade}"]`);
    const whatsappUnidade = unidadeOption?.getAttribute('data-whatsapp');
    
    if (!whatsappUnidade || whatsappUnidade === 'Consultar disponibilidade') {
      alert('Esta unidade não possui WhatsApp disponível. Tente outra unidade.');
      return;
    }
    
    const whatsappLimpo = whatsappUnidade.replace(/\D/g, '');
    
    let texto = `Olá me chamo ${nome}, muito prazer, sou de ${cidade} este é meu WhatsApp vim do site das ESCOLAS DO CRUZEIRO%0A%0A`;
    texto += `Eu gostaria de marcar a aula experimental na sua unidade ${unidade}%0A se possível`;
    
    if (mensagem) texto += `%0AObservações: ${mensagem}%0A`;
    
    const url = `https://wa.me/${whatsappLimpo}?text=${texto}`;
    window.open(url, '_blank');
  });
}

// Salvar dados do licenciado
async function salvarDadosLicenciado(dados) {
  const urls = [
    'https://calvus-sylvester-limply.ngrok-free.dev/Backend/admin/index.php',
    '/Backend/admin/index.php',
    '../Backend/admin/index.php',
    'Backend/admin/index.php'
  ];
  
  for (let i = 0; i < urls.length; i++) {
    try {
      const response = await fetch(urls[i], {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': 'true'
        },
        body: JSON.stringify({...dados, action: 'save_proposta'})
      });
      
      if (response.ok) {
        const result = await response.json();
        const timestamp = new Date().toISOString();
        const dadosComTimestamp = { ...dados, timestamp, id: result.id };
        
        let licenciados = JSON.parse(localStorage.getItem('licenciados') || '[]');
        licenciados.push(dadosComTimestamp);
        localStorage.setItem('licenciados', JSON.stringify(licenciados));
        
        return { ok: true };
      }
    } catch (error) {
      console.log(`Tentativa ${i + 1} falhou:`, error.message);
    }
  }
  
  // Fallback: salvar apenas no localStorage
  const timestamp = new Date().toISOString();
  const dadosComTimestamp = { ...dados, timestamp };
  
  let licenciados = JSON.parse(localStorage.getItem('licenciados') || '[]');
  licenciados.push(dadosComTimestamp);
  localStorage.setItem('licenciados', JSON.stringify(licenciados));
  
  throw new Error('Todas as URLs falharam');
}

// Formulário de licenciado
function initFormularioLicenciado() {
  const telefoneInput = document.getElementById('telefone');
  const form = document.getElementById('licenciadoForm');
  
  if (!telefoneInput || !form) return;
  
  telefoneInput.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 11) {
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length >= 7) {
      value = value.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    } else if (value.length >= 3) {
      value = value.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    }
    e.target.value = value;
  });

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefone = telefoneInput.value.trim();
    const cidade = document.getElementById('cidade').value.trim();
    const estado = document.getElementById('estado').value;
    const experiencia = document.getElementById('experiencia').value;
    const investimento = document.getElementById('investimento').value;
    const mensagem = document.getElementById('mensagem').value.trim();

    if (!nome || !email || !telefone || !cidade || !estado) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (!Security.validateEmail(email)) {
      alert('Por favor, digite um e-mail válido.');
      return;
    }

    if (!Security.validatePhone(telefone)) {
      alert('Por favor, digite um número de WhatsApp válido.');
      return;
    }

    const dados = {
      nome,
      email,
      telefone,
      cidade,
      bairro: document.getElementById('bairro')?.value?.trim() || '',
      estado,
      experiencia,
      investimento,
      mensagem,
      status: 'Em análise'
    };

    const submitBtn = form.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Enviando...';

    salvarDadosLicenciado(dados)
      .then(() => {
        mostrarMensagemSucesso();
        form.reset();
      })
      .catch(() => mostrarMensagemErro())
      .finally(() => {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      });
  });
}

// Modais de mensagem
const mostrarMensagemSucesso = () => {
  const modal = criarModal(
    '✓ Proposta Enviada com Sucesso!',
    'Sua solicitação de licenciamento foi recebida e está sendo analisada pela nossa equipe. Entraremos em contato em breve caso a gente tenha interesse na sua proposta.',
    '#28a745'
  );
  document.body.appendChild(modal);
  setTimeout(() => modal.style.display = 'flex', 100);
};

const mostrarMensagemErro = () => {
  const modal = criarModal(
    '⚠ Erro no Envio',
    'Houve um problema ao enviar sua proposta. Seus dados foram salvos localmente. Tente novamente em alguns minutos.',
    '#dc3545'
  );
  document.body.appendChild(modal);
  setTimeout(() => modal.style.display = 'flex', 100);
};

function criarModal(titulo, mensagem, cor) {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: rgba(0,0,0,0.5); display: none; align-items: center; 
    justify-content: center; z-index: 10000;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white; padding: 40px; border-radius: 15px; 
      max-width: 500px; margin: 20px; text-align: center;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
    ">
      <div style="
        width: 80px; height: 80px; border-radius: 50%; 
        background: ${Security.escapeHtml(cor)}; margin: 0 auto 20px; 
        display: flex; align-items: center; justify-content: center;
        font-size: 40px; color: white; font-weight: bold;
      ">${Security.escapeHtml(titulo.charAt(0))}</div>
      <h2 style="color: #333; margin-bottom: 15px; font-size: 24px;">${Security.escapeHtml(titulo)}</h2>
      <p style="color: #666; line-height: 1.6; margin-bottom: 30px; font-size: 16px;">${Security.escapeHtml(mensagem)}</p>
      <button onclick="this.closest('div').parentElement.remove()" style="
        background: ${Security.escapeHtml(cor)}; color: white; border: none; 
        padding: 12px 30px; border-radius: 25px; 
        font-size: 16px; font-weight: 600; cursor: pointer;
        transition: all 0.3s ease;
      ">Entendi</button>
    </div>
  `;
  
  modal.onclick = (e) => {
    if (e.target === modal) modal.remove();
  };
  
  return modal;
}

// Carregar notícias para a página news.html
async function loadNewsPage() {
  const container = document.getElementById('newsContainer');
  if (!container) return;
  
  try {
    const data = window.translationActive ? 
      await API.fetchTranslated('news.json', window.translationActive) : 
      await API.fetch('news.json');
    const noticias = data.reverse();
    const itemsPerPage = 6;
    let currentPage = 1;
    const totalPages = Math.ceil(noticias.length / itemsPerPage);
    
    const renderPage = (page) => {
      const start = (page - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      const pageNews = noticias.slice(start, end);
      
      container.innerHTML = pageNews.map((item, index) => {
        const globalIndex = start + index;
        const imageURL = Security.sanitizeUrl(item['1-image_URL']) || CONFIG.FALLBACK_IMAGE;
        const title = item.title || 'Título da Notícia';
        const content = item.content || 'Conteúdo da notícia...';
        const resumo = content.length > 150 ? content.substring(0, 150) + '...' : content;
        
        let dateText = '';
        if (item.dayWeek && item.date && item.month) {
          dateText = `${item.dayWeek}, ${item.date} de ${item.month}`;
        }
        
        return `
          <div class="news-item" onclick="openNewsModal(${globalIndex})">
            <h2>${Security.escapeHtml(title)}</h2>
            ${dateText ? `<div class="date">${Security.escapeHtml(dateText)}</div>` : ''}
            <p>${Security.escapeHtml(resumo)}</p>
            <button class="read-more-btn">Leia mais</button>
          </div>
        `;
      }).join('');
      
      document.getElementById('pageInfo').textContent = `Página ${page} de ${totalPages}`;
      document.getElementById('prevPage').disabled = page === 1;
      document.getElementById('nextPage').disabled = page === totalPages;
    };
    
    window.allNews = noticias;
    renderPage(1);
    
    document.getElementById('prevPage').onclick = () => {
      if (currentPage > 1) {
        currentPage--;
        renderPage(currentPage);
      }
    };
    
    document.getElementById('nextPage').onclick = () => {
      if (currentPage < totalPages) {
        currentPage++;
        renderPage(currentPage);
      }
    };
  } catch (error) {
    console.error('Erro ao carregar notícias:', error);
    container.innerHTML = '<p style="text-align: center; color: #666;">Erro ao carregar notícias.</p>';
  }
}

// Abrir modal de notícia na página news.html
function openNewsModal(index) {
  const news = window.allNews?.[index];
  if (!news) return;
  
  document.getElementById('newsModalLabel').textContent = news.title;
  
  const imageContainer = document.getElementById('newsModalImage');
  const imageUrl = Security.sanitizeUrl(news['1-image_URL']);
  if (imageUrl) {
    imageContainer.innerHTML = `<img src="${Security.escapeHtml(imageUrl)}" class="img-fluid mb-3" alt="Imagem da notícia">`;
  } else {
    imageContainer.innerHTML = '';
  }
  
  let dateText = '';
  if (news.dayWeek && news.date && news.month) {
    dateText = `${news.dayWeek}, ${news.date} de ${news.month}`;
  }
  
  document.getElementById('newsModalBody').innerHTML = `
    ${dateText ? `<div class="news-date mb-3"><strong>${Security.escapeHtml(dateText)}</strong></div>` : ''}
    ${news.subtitle ? `<h4 class="mb-3">${Security.escapeHtml(news.subtitle)}</h4>` : ''}
    <div class="news-content">${Security.escapeHtml(news.content).replace(/\n/g, '<br>')}</div>
  `;
  
  new bootstrap.Modal(document.getElementById('newsModal')).show();
}

// Abrir modal de notícia no index
function openIndexNewsModal(index) {
  const news = window.indexNews?.[index];
  if (!news) return;
  
  let modal = document.getElementById('indexNewsModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'indexNewsModal';
    modal.className = 'modal fade';
    modal.innerHTML = `
      <div class="modal-dialog modal-fullscreen">
        <div class="modal-content news-modal-wireframe">
          <div class="news-modal-container">
            <h1 class="news-modal-title" id="indexNewsModalLabel">Título da Notícia</h1>
            <div class="news-modal-image" id="indexNewsModalImage"></div>
            <div class="news-modal-text" id="indexNewsModalBody"></div>
          </div>
          <button type="button" class="fechar-noticia" data-bs-dismiss="modal" aria-label="Close">&times;</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }
  
  document.getElementById('indexNewsModalLabel').textContent = news.title;
  
  const imageContainer = document.getElementById('indexNewsModalImage');
  const imageUrl = Security.sanitizeUrl(news['1-image_URL']);
  if (imageUrl) {
    imageContainer.innerHTML = `<img src="${Security.escapeHtml(imageUrl)}" class="img-fluid mb-3" alt="Imagem da notícia">`;
  } else {
    imageContainer.innerHTML = '';
  }
  
  let dateText = '';
  if (news.dayWeek && news.date && news.month) {
    dateText = `${news.dayWeek}, ${news.date} de ${news.month}`;
  }
  
  document.getElementById('indexNewsModalBody').innerHTML = `
    ${dateText ? `<div class="news-date mb-3"><strong>${Security.escapeHtml(dateText)}</strong></div>` : ''}
    ${news.subtitle ? `<h4 class="mb-3">${Security.escapeHtml(news.subtitle)}</h4>` : ''}
    <div class="news-content">${Security.escapeHtml(news.content).replace(/\n/g, '<br>')}</div>
  `;
  
  new bootstrap.Modal(modal).show();
}

// Controlar dropdown da metodologia
function toggleDropdown(button) {
  const dropdownContent = button.nextElementSibling;
  const isActive = dropdownContent.classList.contains('active');

  if (isActive) {
    dropdownContent.classList.remove('active');
    button.textContent = 'Saiba Mais';
  } else {
    dropdownContent.classList.add('active');
    button.textContent = 'X';
  }
}

// Inicializar carousel de metodologia
function initMetodologiaCarousel() {
  const track = document.querySelector('.metodologia-track');
  const carousel = document.querySelector('.metodologia-carousel');
  const cards = document.querySelectorAll('.metodologia-cards');
  
  if (!track || !carousel || cards.length === 0) return;
  let currentIndex = 0;

  const calculateLayout = () => {
    const firstCard = track.querySelector('.metodologia-cards');
    if (!firstCard) return { cardWidth: 382, visibleCards: 1, maxIndex: 0 };

    const cardRect = firstCard.getBoundingClientRect();
    const gap = parseFloat(window.getComputedStyle(track).gap || '32');
    const cardWidth = Math.round(cardRect.width + gap);

    const containerWidth = carousel.clientWidth;
    const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
    const maxIndex = Math.max(0, cards.length - visibleCards);

    return { cardWidth, visibleCards, maxIndex };
  };

  const updateCarousel = () => {
    const { cardWidth, maxIndex } = calculateLayout();
    const screenWidth = window.innerWidth;
    
    if (currentIndex > maxIndex) currentIndex = maxIndex;
    
    if (screenWidth > 480) {
      track.style.transition = 'transform 300ms ease';
      track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
      carousel.scrollLeft = 0;
    } else {
      track.style.transform = 'translateX(0)';
      carousel.scrollLeft = currentIndex * cardWidth;
    }

    const next = document.getElementById('nextBtn');
    const prev = document.getElementById('prevBtn');
    if (prev) prev.disabled = currentIndex === 0;
    if (next) next.disabled = currentIndex >= maxIndex;
  };

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (prevBtn && nextBtn && !prevBtn.dataset.initialized) {
    nextBtn.addEventListener('click', () => {
      const { maxIndex } = calculateLayout();
      if (currentIndex < maxIndex) {
        currentIndex++;
        updateCarousel();
      }
    });
    
    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    });
    
    nextBtn.dataset.initialized = 'true';
    prevBtn.dataset.initialized = 'true';
  }

  if (!window._metodologiaCarouselInitialized) {
    window.addEventListener('resize', Security.debounce(() => {
      currentIndex = 0;
      updateCarousel();
    }, 120));
    window._metodologiaCarouselInitialized = true;
  }

  updateCarousel();
}

// Função para recarregar dados da página
window.reloadPageData = async function() {
  // Recarregar notícias do index
  if (document.getElementById('newsCardsContainer')) {
    await loadIndexNews();
  }
  
  // Recarregar notícias do news.html
  if (document.getElementById('newsContainer')) {
    await loadNewsPage();
  }
  
  // Recarregar escolas do mapa
  if (typeof loadSchools === 'function') {
    await loadSchools();
  }
};

// Inicialização principal
document.addEventListener('DOMContentLoaded', () => {
  // Carregar notícias se estivermos na página index
  if (document.getElementById('newsCardsContainer')) {
    loadIndexNews();
  }
  
  // Carregar notícias se estivermos na página news.html
  if (document.getElementById('newsContainer')) {
    loadNewsPage();
  }
  
  // Inicializar formulário de contato se estivermos na página
  if (document.getElementById('whatsappForm')) {
    initFormularioContato();
  }
  
  // Inicializar formulário de licenciado se estivermos na página
  if (document.getElementById('licenciadoForm')) {
    initFormularioLicenciado();
  }
  
  // Inicializar carousel de metodologia
  if (document.querySelector('.metodologia-track')) {
    initMetodologiaCarousel();
  }
  
  // Aguardar um pouco antes de inicializar o mapa
  setTimeout(() => {
    initMap();
  }, CONFIG.MAP_INIT_DELAY);
});