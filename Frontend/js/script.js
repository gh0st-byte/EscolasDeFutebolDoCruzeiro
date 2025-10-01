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
        const imageUrl = item['1-image_URL'] || 'https://images.pexels.com/photos/29920213/pexels-photo-29920213.jpeg';
        const title = item.title || 'Título da Notícia';
        const content = item.content || 'Resumo da notícia...';
        const resumo = content.length > 80 ? content.substring(0, 80) + '...' : content;
        
        return `
          <div class="card">
            <img src="${escapeHtml(imageUrl)}" alt="${escapeHtml(title)}">
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
      <div style="text-align: center;">
        <h4>${escapeHtml(p.nome || p.cidade || '')}</h4>
        <p><strong>Endereço:</strong> ${escapeHtml(p.endereco_encontrado || '')}</p>
        ${p.telefone ? `<p><strong>Telefone:</strong> ${escapeHtml(p.telefone)}</p>` : ''}
        ${p.instagram ? `<p><strong>Instagram:</strong> ${escapeHtml(p.instagram)}</p>` : ''}
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
var newsData = [];

function openModal(index) {
    var item = newsData[index];
    document.getElementById('newsModalLabel').textContent = escapeHtml(item.title || 'Notícia');
    
    var imageContainer = document.getElementById('newsModalImage');
    var imageUrl = item['1-image_URL'];
    if (imageUrl) {
        imageContainer.innerHTML = '<img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(item.title) + '">';
    } else {
        imageContainer.innerHTML = '';
    }
    
    var dateText = '';
    if (item.dayWeek && item.date && item.month) {
        dateText = item.dayWeek + ', ' + item.date + ' de ' + item.month;
    }
    
    document.getElementById('newsModalBody').innerHTML = 
        '<div class="news-meta">' +
            (dateText ? '<span class="news-date">' + escapeHtml(dateText) + '</span>' : '') +
        '</div>' +
        '<div class="news-content">' +
            (item.subtitle ? '<h3>' + escapeHtml(item.subtitle) + '</h3>' : '') +
            '<p>' + escapeHtml(item.content || 'Conteúdo não disponível') + '</p>' +
        '</div>';
}

function loadNews() {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/Backend/api/data.php?file=news.json', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            var newsContainer = document.querySelector('.news-letter');
            if (xhr.status === 200) {
                try {
                    newsData = JSON.parse(xhr.responseText);
                    newsData.reverse();
                    
                    for (var i = 0; i < newsData.length; i++) {
                        var item = newsData[i];
                        var newsItem = document.createElement('div');
                        newsItem.className = 'news-item';
                        
                        var dateText = '';
                        if (item.dayWeek && item.date && item.month) {
                            dateText = item.dayWeek + ', ' + item.date + ' de ' + item.month;
                        } else if (item.date) {
                            var date = new Date(item.date);
                            if (!isNaN(date.getTime())) {
                                dateText = date.toLocaleDateString('pt-BR');
                            }
                        }
                        
                        var imageUrl = item['1-image_URL'];
                        var imageHtml = '';
                        if (imageUrl && imageUrl.trim() !== '') {
                            imageHtml = '<img src="' + escapeHtml(imageUrl) + '" alt="' + escapeHtml(item.title) + '" style="width: 100%; max-width: 300px; border-radius: 5%; height: auto; margin-bottom: 10px;">';
                        }
                        
                        newsItem.innerHTML = 
                            imageHtml +
                            '<h2>' + escapeHtml(item.title || 'Título') + '</h2>' +
                            (dateText ? '<p class="date" style="color: #666; font-size: 0.9em; margin: 5px 0;">' + escapeHtml(dateText) + '</p>' : '') +
                            '<p>' + escapeHtml((item.content || '').substring(0, 80)) + '...</p>' +
                            '<button class="read-more-btn" data-bs-toggle="modal" data-bs-target="#newsModal" onclick="openModal(' + i + ')">Leia mais</button>';
                        
                        newsContainer.appendChild(newsItem);
                    }
                } catch (e) {
                    newsContainer.innerHTML += '<p style="color: red;">Erro ao processar dados.</p>';
                }
            } else {
                newsContainer.innerHTML += '<p style="color: red;">Erro ao carregar notícias.</p>';
            }
        }
    };
    xhr.send();
}

// Inicializar news se estiver na página news.html
document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.news-letter')) {
        loadNews();
    }
});