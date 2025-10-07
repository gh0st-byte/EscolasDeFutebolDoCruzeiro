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
      
      // Inicializar carrossel após carregar notícias
      setTimeout(() => initNewsCarousel(), 100);
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

// Inicializar carrossel de notícias
function initNewsCarousel() {
  const track = document.querySelector('.news-cards');
  const cards = document.querySelectorAll('.card');
  
  if (!track || cards.length === 0) return;
  
  let currentIndex = 0;
  const cardWidth = cards[0].offsetWidth + 20; // incluindo margin
  const visibleCards = Math.floor(track.parentElement.offsetWidth / cardWidth);
  const maxIndex = Math.max(0, cards.length - visibleCards);
  
  // Criar botões de navegação
  const prevBtn = document.createElement('button');
  prevBtn.innerHTML = '‹';
  prevBtn.className = 'carousel-btn prev-btn';
  
  const nextBtn = document.createElement('button');
  nextBtn.innerHTML = '›';
  nextBtn.className = 'carousel-btn next-btn';
  
  track.parentElement.appendChild(prevBtn);
  track.parentElement.appendChild(nextBtn);
  
  function updateCarousel() {
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
    if (currentIndex < maxIndex) {
      currentIndex++;
      updateCarousel();
    }
  });
  
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