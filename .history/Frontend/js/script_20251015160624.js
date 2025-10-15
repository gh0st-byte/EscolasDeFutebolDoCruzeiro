// Função para escapar HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}


// Carregar notícias para o index
function loadIndexNews() {
  
  fetch('/Backend/api/data.php?file=news.json')
    .then(response => response.json())
    .then(data => {
      const container = document.getElementById('newsCardsContainer');
      if (!container) return;
      
      // Reverter array para pegar as mais recentes (de baixo para cima)
      const noticias = data.reverse().slice(0, 15);
      
      container.innerHTML = noticias.map((item, index) => {
        const imageURL = item['1-image_URL'] || 'https://images.pexels.com/photos/29920213/pexels-photo-29920213.jpeg';
        const title = item.title || 'Título da Notícia';
        const content = item.content || 'Resumo da notícia...';
        const resumo = content.length > 80 ? content.substring(0, 80) + '...' : content;
        
        return `
          <div class="card">
            <img src="${escapeHtml(imageURL)}" alt="${escapeHtml(title)}">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(resumo)}</p>
            <a href="#" onclick="openIndexNewsModal(${index}); return false;">Leia mais</a>
          </div>
        `;
      }).join('');
      
      // Armazenar notícias globalmente para o modal
      window.indexNews = noticias;
      
      // Inicializar carrossel após carregar imagens das notícias
      waitForImages(container).then(() => initNewsCarousel()).catch(() => initNewsCarousel());
    })
    .catch(error => {
      console.error('Erro ao carregar notícias:', error);
      const container = document.getElementById('newsCardsContainer');
      if (container) {
        container.innerHTML = `
          <div class="card">
            <img src="https://images.pexels.com/photos/29920213/pexels-photo-29920213.jpeg" alt="Notícia">
            <h3>Últimas Notícias</h3>
            <p>Acompanhe as novidades das Escolas do Cruzeiro...</p>
          </div>
        `;
      }
    });
}

// Aguarda as imagens dentro de um container serem carregadas
function waitForImages(container) {
  const imgs = Array.from(container.querySelectorAll('img'));
  if (imgs.length === 0) return Promise.resolve();

  const promises = imgs.map(img => {
    // If image is already complete and decoded, resolve
    if (img.complete) {
      // try decode for better reliability
      if (img.decode) return img.decode().catch(() => {});
      return Promise.resolve();
    }
    return new Promise(resolve => {
      img.addEventListener('load', resolve);
      img.addEventListener('error', resolve);
    });
  });

  return Promise.all(promises);
}

// Header scroll effect
window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (header) {
    header.classList.toggle('scrolled', window.scrollY > 0);
  }
});

// Variáveis globais
let map, markers, schools = [];

// Inicializar mapa
function initMap() {
  const mapElement = document.getElementById('map');
  if (!mapElement) return;
  
  // Verificar se Leaflet está carregado
  if (typeof L === 'undefined') {
    console.error('Leaflet não carregado');
    return;
  }
  
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
    iconCreateFunction: function(cluster) {
      const childCount = cluster.getChildCount();
      const size = childCount < 10 ? 40 : childCount < 20 ? 50 : 60;
      return new L.DivIcon({ 
        html: `<div style="background-color: #0033a0; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${childCount}</div>`, 
        className: 'custom-cluster', 
        iconSize: new L.Point(size, size) 
      });
    }
  });
  
  loadSchools();
  setupMapButtons();
  setupMapSearch();
  
  // Forçar redimensionamento do mapa
  setTimeout(() => {
    if (map) {
      map.invalidateSize();
      console.log('Mapa inicializado');
    }
  }, 500);
}

// Carregar escolas
function loadSchools() {
  fetch("/Backend/api/data.php?file=schools.json")
    .then(res => {
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      return res.json();
    })
    .then(data => {
      schools = data;
      addMarkers('Brasil');
    })
    .catch(error => console.error('Erro ao carregar escolas:', error));
}

// Criar ícone personalizado
function createBlueCircleIcon() {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: #0033a0; width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 0 10px 3px #0033a0;"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });
}

// Adicionar marcadores no mapa
function addMarkers(region = 'all') {
  if (!markers) return;
  
  markers.clearLayers();
  
  const filteredSchools = schools.filter(p => {
    if (region === 'all') return true;
    if (region === 'Brasil') return p.region && (p.region.toLowerCase() === 'brasil');
    if (region === 'world') return p.region && p.region.toLowerCase() !== 'brasil' && p.region.toLowerCase() !== 'brazil';
    return p.region && p.region.toLowerCase() === region.toLowerCase();
  });
  
  filteredSchools.forEach(p => {
    if (!p.lat || !p.lng || isNaN(p.lat) || isNaN(p.lng)) {
      console.log('Escola ignorada (coordenadas inválidas):', p.nome, p.lat, p.lng);
      return;
    }
    
    console.log('Adicionando marcador:', p.nome, p.lat, p.lng);
    
    const nome = p.nome || p.cidade || 'Escola do Cruzeiro';
    const endereco = p.endereco_encontrado || p.endereco || 'Endereço não disponível';
    const telefone = p.telefone || '';
    
    // Verificar WhatsApp
    const hasWhatsapp = p.whatsapp && p.whatsapp.trim() && p.whatsapp !== 'null';
    
    // Verificar Instagram - pode estar em instagram_url ou instagram
    let instagramUrl = '';
    if (p.instagram_url && p.instagram_url.trim() && p.instagram_url !== 'null') {
        instagramUrl = p.instagram_url;
    } else if (p.instagram && p.instagram.trim() && p.instagram !== 'null' && p.instagram.startsWith('@')) {
        instagramUrl = `https://www.instagram.com/${p.instagram.replace('@', '')}`;
    }
    
    const popupContent = `
      <div class="escola-popup-card" style="min-width: 250px; text-align: center; padding: 15px;">
        <h4 style="color: #0033a0; margin-bottom: 10px; font-size: 16px; font-weight: bold;">${escapeHtml(nome)}</h4>
        <p style="margin-bottom: 8px; font-size: 14px; color: #555;"><strong>Endereço:</strong><br>${escapeHtml(endereco)}</p>
        ${telefone ? `<p style="margin-bottom: 10px; font-size: 14px; color: #555;"><strong>Telefone:</strong> ${escapeHtml(telefone)}</p>` : ''}
        <div style="display: flex; gap: 8px; justify-content: center; margin-top: 12px;">
          ${hasWhatsapp ? `<a href="${escapeHtml(p.whatsapp)}" target="_blank" rel="noopener" style="background: #25D366; color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; font-size: 12px; font-weight: bold; display: inline-block;">WhatsApp</a>` : ''}
          ${instagramUrl ? `<a href="${escapeHtml(instagramUrl)}" target="_blank" rel="noopener" style="background: #E1306C; color: white; padding: 8px 16px; border-radius: 20px; text-decoration: none; font-size: 12px; font-weight: bold; display: inline-block;">Instagram</a>` : ''}
        </div>
      </div>
    `;
    
    const latNum = Number(p.lat);
    const lngNum = Number(p.lng);
    const marker = L.marker([latNum, lngNum], {icon: createBlueCircleIcon(), title: nome});

    // attach school id for reliable matching from search
    try { marker.schoolId = p.id || p._id || p.codigo || null; } catch(e) { marker.schoolId = null; }

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

// --- Map search UI ---
function setupMapSearch() {
  const input = document.getElementById('mapSearch');
  const resultsList = document.getElementById('mapSearchResults');
  if (!input || !resultsList) return;

  function clearResults() {
    resultsList.innerHTML = '';
    resultsList.style.display = 'none';
  }

  function showResults(items) {
    resultsList.innerHTML = items.map((item, index) => `<li data-index="${index}" data-lat="${item.lat || ''}" data-lng="${item.lng || ''}">${escapeHtml(item.nome || item.cidade || item.endereco_encontrado || item.title || '')}</li>`).join('');
    resultsList.style.display = items.length ? 'block' : 'none';
    resultsList._currentItems = items;
  }

  input.addEventListener('input', debounce((e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) { clearResults(); return; }

    // Search only in loaded schools from schools.json
    const results = schools.filter(s => {
      const fields = ((s.nome||'') + ' ' + (s.cidade||'') + ' ' + (s.endereco_encontrado||'') + ' ' + (s.bairro||'')).toLowerCase();
      return fields.includes(q) && s.lat && s.lng;
    }).slice(0, 8);

    showResults(results);
  }, 300));

  // click on results
  resultsList.addEventListener('click', (ev) => {
    const li = ev.target.closest('li');
    if (!li) return;
    
    const index = parseInt(li.dataset.index);
    const items = resultsList._currentItems || [];
    const selected = items[index];
    
    if (selected && selected.lat && selected.lng) {
      const lat = Number(selected.lat);
      const lng = Number(selected.lng);
      
      // Center map on location
      map.setView([lat, lng], 15);
      
      // Find and open the corresponding marker popup
      let markerFound = false;

      // 1) try to match by id if available
      if (selected.id) {
        markers.eachLayer(layer => {
          if (markerFound) return;
          if (layer.schoolId && String(layer.schoolId) === String(selected.id)) {
            setTimeout(() => layer.openPopup(), 200);
            markerFound = true;
          }
        });
      }

      // 2) fallback: match by coordinates with looser tolerance
      if (!markerFound) {
        markers.eachLayer(layer => {
          if (markerFound) return;
          if (!layer.getLatLng) return;
          const markerLat = layer.getLatLng().lat;
          const markerLng = layer.getLatLng().lng;
          if (Math.abs(markerLat - lat) < 0.01 && Math.abs(markerLng - lng) < 0.01) {
            setTimeout(() => { layer.openPopup(); }, 200);
            markerFound = true;
          }
        });
      }

      if (!markerFound) console.log('Marcador não encontrado para:', selected.nome, selected.id, lat, lng);
    }
    
    clearResults();
    input.value = '';
  });

  // click outside to close
  document.addEventListener('click', (e)=>{
    if (!e.target.closest('.map-search')) clearResults();
  });
}

// small debounce helper
function debounce(fn, wait=200){
  let t;
  return function(...args){ clearTimeout(t); t = setTimeout(()=>fn.apply(this,args), wait); };
}

// Inicializar carrossel de notícias
function initNewsCarousel() {
  const track = document.querySelector('.news-cards');
  const cards = document.querySelectorAll('.card');
  
  if (!track || cards.length === 0) return;
  let currentIndex = 0;

  // Ensure we don't create controls more than once
  const controlsClass = 'news-carousel-controls';
  let controls = track.parentElement.querySelector('.' + controlsClass);

  function calculateLayout() {
    const firstCard = track.querySelector('.card');
    const cardRect = firstCard.getBoundingClientRect();
    const style = window.getComputedStyle(firstCard);
    const marginRight = parseFloat(style.marginRight || '0');
    const cardWidth = Math.round(cardRect.width + marginRight);
    const containerWidth = track.parentElement.clientWidth || track.parentElement.offsetWidth;
    const visibleCards = Math.max(1, Math.floor(containerWidth / cardWidth));
    const maxIndex = Math.max(0, cards.length - visibleCards);
    return { cardWidth, visibleCards, maxIndex };
  }

  function updateCarousel() {
    const { cardWidth, maxIndex } = calculateLayout();
    if (currentIndex > maxIndex) currentIndex = maxIndex;
    track.style.transition = 'transform 300ms ease';
    track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;

    const prev = controls.querySelector('.prev-btn');
    const next = controls.querySelector('.next-btn');
    if (prev) prev.disabled = currentIndex === 0;
    if (next) next.disabled = currentIndex >= maxIndex;
  }

  if (!controls) {
    controls = document.createElement('div');
    controls.className = controlsClass;
    const prevBtn = document.createElement('button');
    prevBtn.innerHTML = '‹';
    prevBtn.className = 'carousel-btn prev-btn';

    const nextBtn = document.createElement('button');
    nextBtn.innerHTML = '›';
    nextBtn.className = 'carousel-btn next-btn';

    prevBtn.addEventListener('click', () => {
      if (currentIndex > 0) {
        currentIndex--;
        updateCarousel();
      }
    });

    nextBtn.addEventListener('click', () => {
      const { maxIndex } = calculateLayout();
      if (currentIndex < maxIndex) {
        currentIndex++;
        updateCarousel();
      }
    });

    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    // Prefer to append controls to the explicit wrapper (.news-carousel) if present
    const wrapper = track.closest('.news-carousel') || track.parentElement;
    wrapper.appendChild(controls);
  }

  // Responsive handling: recalc on resize
  if (!window._newsCarouselInitialized) {
    window.addEventListener('resize', () => {
      // small debounce
      clearTimeout(window._newsCarouselResizeTimer);
      window._newsCarouselResizeTimer = setTimeout(updateCarousel, 120);
    });
    window._newsCarouselInitialized = true;
  }

  // initial layout
  updateCarousel();
}

// Função para abrir modal de notícia no index
function openIndexNewsModal(index) {
  const news = window.indexNews[index];
  if (!news) return;
  
  // Criar modal se não existir
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
  
  // Preencher conteúdo do modal
  document.getElementById('indexNewsModalLabel').textContent = news.title;
  
  const imageContainer = document.getElementById('indexNewsModalImage');
  if (news['1-image_URL']) {
    imageContainer.innerHTML = `<img src="${news['1-image_URL']}" class="img-fluid mb-3" alt="Imagem da notícia">`;
  } else {
    imageContainer.innerHTML = '';
  }
  
  let dateText = '';
  if (news.dayWeek && news.date && news.month) {
    dateText = `${news.dayWeek}, ${news.date} de ${news.month}`;
  }
  
  document.getElementById('indexNewsModalBody').innerHTML = `
    ${dateText ? `<div class="news-date mb-3"><strong>${dateText}</strong></div>` : ''}
    ${news.subtitle ? `<h4 class="mb-3">${news.subtitle}</h4>` : ''}
    <div class="news-content">${news.content}</div>
  `;
  
  // Abrir modal
  new bootstrap.Modal(modal).show();
}

// Formulário de contato - formAulaWhatsapp.html
function initFormularioContato() {
  const telefoneInput = document.getElementById('telefone');
  const cidadeSelect = document.getElementById('cidade');
  const estadoSelect = document.getElementById('estado');
  const unidadeSelect = document.getElementById('unidade');
  const form = document.getElementById('whatsappForm');
  
  if (!telefoneInput || !form) return;
  
  let schoolsData = [];
  
  // Carregar dados das escolas
  fetch('/Backend/api/data.php?file=schools.json')
    .then(response => response.json())
    .then(data => {
      schoolsData = data;
      console.log('Escolas carregadas:', schoolsData.length);
    })
    .catch(error => {
      console.error('Erro ao carregar escolas:', error);
    });
  
  // Máscara para telefone
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

  // Atualizar cidades baseado no estado
  function atualizarCidades() {
    if (!estadoSelect || !cidadeSelect) return;
    
    const estado = estadoSelect.value;
    cidadeSelect.innerHTML = '<option value="" disabled selected>Selecione a cidade</option>';
    
    if (schoolsData.length > 0) {
      const cidadesUnicas = [...new Set(
        schoolsData
          .filter(escola => escola.estado === estado && escola.whatsapp && escola.whatsapp.trim() && escola.whatsapp !== 'null')
          .map(escola => {
            if (escola.cidade) {
              // Usar o campo cidade diretamente, removendo partes após barra ou hífen
              return escola.cidade.split(/[\/\-–]/)[0].trim();
            }
            return '';
          })
          .filter(cidade => cidade)
      )];
      
      cidadesUnicas.forEach(cidade => {
        cidadeSelect.innerHTML += `<option value="${cidade}">${cidade}</option>`;
      });
    }
    
    cidadeSelect.disabled = false;
    unidadeSelect.innerHTML = '<option value="" disabled selected>Primeiro selecione a cidade</option>';
    unidadeSelect.disabled = true;
  }

  // Atualizar unidades baseado na cidade/estado
  function atualizarUnidades() {
    if (!cidadeSelect || !estadoSelect || !unidadeSelect) return;
    
    const cidade = cidadeSelect.value;
    const estado = estadoSelect.value;
    
    unidadeSelect.innerHTML = '<option value="" disabled selected>Selecione a unidade</option>';
    
    if (schoolsData.length > 0) {
      const unidadesFiltradas = schoolsData.filter(escola => 
        escola.estado === estado && 
        escola.cidade && 
        escola.cidade.includes(cidade) &&
        escola.whatsapp && 
        escola.whatsapp.trim() && 
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
  }
  
  if (estadoSelect) estadoSelect.addEventListener('change', atualizarCidades);
  if (cidadeSelect) cidadeSelect.addEventListener('change', atualizarUnidades);

  // Validação e envio
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const nome = document.getElementById('nome').value.trim();
    const cidade = cidadeSelect.value;
    const estado = estadoSelect.value;
    const unidade = unidadeSelect.value;
    const telefone = telefoneInput.value.trim();
    const mensagem = document.getElementById('mensagem').value.trim();

    if (!nome || !cidade || !estado || !unidade || !telefone) {
      alert('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (telefone.replace(/\D/g, '').length < 10) {
      alert('Por favor, digite um número de WhatsApp válido.');
      return;
    }

    // Obter WhatsApp da unidade selecionada
    const unidadeOption = unidadeSelect.querySelector(`option[value="${unidade}"]`);
    const whatsappUnidade = unidadeOption ? unidadeOption.getAttribute('data-whatsapp') : null;
    
    if (!whatsappUnidade || whatsappUnidade === 'Consultar disponibilidade') {
      alert('Esta unidade não possui WhatsApp disponível. Tente outra unidade.');
      return;
    }
    
    // Limpar WhatsApp (remover caracteres especiais)
    const whatsappLimpo = whatsappUnidade.replace(/\D/g, '');
    
    let texto = `Olá me chamo ${nome}, muito prazer, sou de ${cidade} este é meu WhatsApp vim do site das ESCOLAS DO CRUZEIRO%0A%0A`;
    texto += `Eu gostaria de marcar a aula experimental na sua unidade  ${unidade}%0A se possível`;

    
    if (mensagem) texto += `%0AObservações: ${mensagem}%0A`;
    
    texto += `%0AGostaria de agendar uma aula experimental gratuita!`;
    
    const url = `https://wa.me/${whatsappLimpo}?text=${texto}`;
    window.open(url, '_blank');
  });
}

// Inicialização principal
document.addEventListener('DOMContentLoaded', () => {
  // Carregar notícias se estivermos na página index
  if (document.getElementById('newsCardsContainer')) {
    loadIndexNews();
  }
  
  // Inicializar formulário de contato se estivermos na página
  if (document.getElementById('whatsappForm')) {
    initFormularioContato();
  }
  
  // Aguardar um pouco antes de inicializar o mapa
  setTimeout(() => {
    initMap();
  }, 100);
});

// News functionality para news.html

        let allNews = [];
        let currentPage = 1;
        const newsPerPage = 10;
        
        async function loadNews() {
            try {
                const response = await fetch('/Backend/api/data.php?file=news.json');

                if (!response.ok) throw new Error('Erro ao carregar notícias');
                
                allNews = await response.json();
                if (!Array.isArray(allNews)) throw new Error('Dados inválidos');

                allNews = allNews.reverse();
                
                displayNews();
                updatePagination();
            } catch (error) {
                console.error('Erro:', error);
                document.getElementById('newsContainer').innerHTML = '<p class="text-center text-danger">Erro ao carregar notícias</p>';
            }
        }

        
        function displayNews() {
            const startIndex = (currentPage - 1) * newsPerPage;
            const endIndex = startIndex + newsPerPage;
            const newsToShow = allNews.slice(startIndex, endIndex);
            
            const container = document.getElementById('newsContainer');
            
            if (newsToShow.length === 0) {
                container.innerHTML = '<p class="text-center">Nenhuma notícia encontrada</p>';
                return;
            }
            
            container.innerHTML = newsToShow.map((news, index) => `
                <div class="news-item" onclick="openNewsModal(${startIndex + index})">
                    <h2>${news.title}</h2>
                    <div class="date">${news.dayWeek ? news.dayWeek + ', ' : ''}${news.date} de ${news.month}</div>
                    <p>${news.content.substring(0, 150)}...</p>
                    <button class="read-more-btn">Ler Mais</button>
                </div>
            `).join('');
        }
        
        function updatePagination() {
            const totalPages = Math.ceil(allNews.length / newsPerPage);
            
            document.getElementById('pageInfo').textContent = `Página ${currentPage} de ${totalPages}`;
            document.getElementById('prevPage').disabled = currentPage === 1;
            document.getElementById('nextPage').disabled = currentPage === totalPages;
        }
        
        function openNewsModal(index) {
            const news = allNews[index];
            document.getElementById('newsModalLabel').textContent = news.title;
            
            const imageContainer = document.getElementById('newsModalImage');
            if (news['1-image_URL']) {
                imageContainer.innerHTML = `<img src="${news['1-image_URL']}" class="img-fluid mb-3" alt="Imagem da notícia">`;
            } else {
                imageContainer.innerHTML = '';
            }
            
            let dateText = '';
            if (news.dayWeek && news.date && news.month) {
                dateText = `${news.dayWeek}, ${news.date} de ${news.month}`;
            }
            
            document.getElementById('newsModalBody').innerHTML = `
                ${dateText ? `<div class="news-date mb-3"><strong>${dateText}</strong></div>` : ''}
                ${news.subtitle ? `<h4 class="mb-3">${news.subtitle}</h4>` : ''}
                <div class="news-content">${news.content}</div>
            `;
            
            new bootstrap.Modal(document.getElementById('newsModal')).show();
        }
        
        document.addEventListener('DOMContentLoaded', () => {
            loadNews();
            
            document.getElementById('prevPage').addEventListener('click', () => {
                if (currentPage > 1) {
                    currentPage--;
                    window.scrollTo(0, 0);
                    displayNews();
                    updatePagination();
                }
            });
            
            document.getElementById('nextPage').addEventListener('click', () => {
                const totalPages = Math.ceil(allNews.length / newsPerPage);
                if (currentPage < totalPages) {
                    currentPage++;
                    window.scrollTo(0, 0);
                    displayNews();
                    updatePagination();
                }
            });
        });

// Função para controlar dropdown da metodologia
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
// Carousel da metodologia
let metodologiaCurrentIndex = 0;

function prevSlide() {
    const track = document.getElementById('metodologiaCarousel');
    const cards = track.querySelectorAll('.metodologia-cards');
    if (metodologiaCurrentIndex > 0) {
        metodologiaCurrentIndex--;
        updateMetodologiaCarousel();
    }
}

function nextSlide() {
    const track = document.getElementById('metodologiaCarousel');
    const cards = track.querySelectorAll('.metodologia-cards');
    if (metodologiaCurrentIndex < cards.length - 1) {
        metodologiaCurrentIndex++;
        updateMetodologiaCarousel();
    }
}

function updateMetodologiaCarousel() {
    const track = document.getElementById('metodologiaCarousel');
    const cardWidth = 320; // width + gap
    track.style.transform = `translateX(-${metodologiaCurrentIndex * cardWidth}px)`;
}

// Inicializar carousel da metodologia
document.addEventListener('DOMContentLoaded', () => {
    updateMetodologiaCarousel();
});