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
      
      const noticias = data.slice(0, 5);
      
      container.innerHTML = noticias.map(item => {
        const imageURL = item['1-image_URL'] || 'https://images.pexels.com/photos/29920213/pexels-photo-29920213.jpeg';
        const title = item.title || 'Título da Notícia';
        const content = item.content || 'Resumo da notícia...';
        const resumo = content.length > 80 ? content.substring(0, 80) + '...' : content;
        
        return `
          <div class="card">
            <img src="${escapeHtml(imageURL)}" alt="${escapeHtml(title)}">
            <h3>${escapeHtml(title)}</h3>
            <p>${escapeHtml(resumo)}</p>
            <a href="news.html?id=${item.id}">Leia mais</a>
          </div>
        `;
      }).join('');
      
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
    if (!p.lat || !p.lng || isNaN(p.lat) || isNaN(p.lng)) return;
    
    const popupContent = `
      <div style="text-align: center !important; color: #0033a0; font-weight: bold; font-size: 16px; margin-bottom: 10px; box-shadow: none !important " class="escola-card">
        <h4>${escapeHtml(p.nome || p.cidade || '')}</h4>
        <p><strong>Endereço:</strong> ${escapeHtml(p.endereco_encontrado || '')}</p>
        ${p.ComoChegar ? `<a href="${escapeHtml(p.ComoChegar)}" target="_blank" class="btn-maps">Como Chegar</a>` : ''}
        <div class="btn-container">
          ${p.whatsapp ? `<a href="${escapeHtml(p.whatsapp)}" target="_blank" class="btn-whatsapp" style=" color: white;">WhatsApp</a>` : ''}
          ${p.instagram ? `<a href="${escapeHtml(p.instagram_url)}" target="_blank" class="btn-instagram" style="color: white;">Instagram</a>` : ''}
        </div>
      </div>
    `;
    
    const marker = L.marker([p.lat, p.lng], {icon: createBlueCircleIcon()}).bindPopup(popupContent);
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
    resultsList.innerHTML = items.map(item => `<li data-id="${escapeHtml(item.id || '')}">${escapeHtml(item.nome || item.cidade || item.endereco_encontrado || item.title || '')}</li>`).join('');
    resultsList.style.display = items.length ? 'block' : 'none';
  }

  input.addEventListener('input', debounce(async (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (!q) { clearResults(); return; }

    // local search in loaded schools
    const local = schools.filter(s => {
      const fields = ((s.nome||'') + ' ' + (s.cidade||'') + ' ' + (s.endereco_encontrado||'') + ' ' + (s.bairro||'')).toLowerCase();
      return fields.includes(q);
    }).slice(0, 8);

    if (local.length) {
      showResults(local);
      return;
    }

    // fallback: geocode via Nominatim
    try {
      const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=6`);
      const data = await resp.json();
      if (Array.isArray(data) && data.length) {
        const mapped = data.map((d, i)=>({ id: 'geocode-'+i, nome: d.display_name, lat: d.lat, lng: d.lon }));
        showResults(mapped);
      } else {
        clearResults();
      }
    } catch (err) {
      console.error('Geocode error', err);
      clearResults();
    }
  }, 300));

  // click on results
  resultsList.addEventListener('click', (ev) => {
    const li = ev.target.closest('li');
    if (!li) return;
    const id = li.dataset.id;
    // find in local schools first
    const found = schools.find(s => (s.id && String(s.id) === id) || s.id === id || ('geocode-'+(s._geocodeIndex||'') === id));
    if (found) {
      if (found.lat && found.lng) {
        map.setView([found.lat, found.lng], 14);
        // find marker and open popup
        markers.eachLayer(layer => {
          if (layer.getLatLng && layer.getLatLng().lat === Number(found.lat) && layer.getLatLng().lng === Number(found.lng)) {
            layer.openPopup();
          }
        });
      }
      clearResults();
      input.value = '';
      return;
    }

    // if not local, it's geocode result (we stored lat/lng in the li text mapping above)
    const text = li.textContent;
    // attempt to find lat/lon by re-querying Nominatim for that exact display name
    (async () => {
      try {
        const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(text)}&limit=1`);
        const data = await resp.json();
        if (data && data[0]) {
          const lat = Number(data[0].lat), lng = Number(data[0].lon);
          map.setView([lat, lng], 14);
          L.marker([lat, lng]).addTo(map).bindPopup(text).openPopup();
        }
      } catch (err) { console.error(err); }
      clearResults();
      input.value = '';
    })();
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

// Inicialização principal
document.addEventListener('DOMContentLoaded', () => {
  // Carregar notícias se estivermos na página index
  if (document.getElementById('newsCardsContainer')) {
    loadIndexNews();
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
// Inicializar carousel da metodologia em mobile
function initMetodologiaCarousel() {
    if (window.innerWidth <= 700) {
        const carousel = document.querySelector('.metodologia-carousel');
        const track = document.querySelector('.metodologia-text');
        const cards = document.querySelectorAll('.card-metodologia');
        
        if (!carousel || !track || cards.length === 0) return;
        
    let currentIndex = 0;

    // Avoid duplicated controls
    if (!carousel.querySelector('.metodologia-controls')) {
      const controls = document.createElement('div');
      controls.className = 'metodologia-controls';

      const prevBtn = document.createElement('button');
      prevBtn.innerHTML = '‹';
      prevBtn.className = 'carousel-btn prev-btn';

      const nextBtn = document.createElement('button');
      nextBtn.innerHTML = '›';
      nextBtn.className = 'carousel-btn next-btn';

      controls.appendChild(prevBtn);
      controls.appendChild(nextBtn);
      carousel.appendChild(controls);

      function calculate() {
        const cardRect = cards[0].getBoundingClientRect();
        const style = window.getComputedStyle(cards[0]);
        const marginRight = parseFloat(style.marginRight || '0');
        const cardWidth = Math.round(cardRect.width + marginRight);
        const maxIndex = Math.max(0, cards.length - 1);
        return { cardWidth, maxIndex };
      }

      function updateCarousel() {
        const { cardWidth, maxIndex } = calculate();
        if (currentIndex > maxIndex) currentIndex = maxIndex;
        track.style.transition = 'transform 300ms ease';
        track.style.transform = `translateX(-${currentIndex * cardWidth}px)`;
        prevBtn.disabled = currentIndex === 0;
        nextBtn.disabled = currentIndex >= maxIndex;
      }

      prevBtn.addEventListener('click', () => {
        if (currentIndex > 0) {
          currentIndex--;
          updateCarousel();
        }
      });

      nextBtn.addEventListener('click', () => {
        const { maxIndex } = calculate();
        if (currentIndex < maxIndex) {
          currentIndex++;
          updateCarousel();
        }
      });

      // responsive resize handling
      if (!window._metodologiaCarouselInitialized) {
        window.addEventListener('resize', () => {
          clearTimeout(window._metodologiaCarouselResizeTimer);
          window._metodologiaCarouselResizeTimer = setTimeout(updateCarousel, 120);
        });
        window._metodologiaCarouselInitialized = true;
      }

      updateCarousel();
    }
    }
}

// Inicializar no carregamento e redimensionamento
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initMetodologiaCarousel, 100);
});

window.addEventListener('resize', () => {
    setTimeout(initMetodologiaCarousel, 100);
});