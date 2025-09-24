document.addEventListener('DOMContentLoaded', () => {
  const map = L.map('map', {
    center: [-15.78, -47.93], 
    zoom: 4,
    minZoom: 2,
    maxZoom: 18,
    worldCopyJump: false,
    maxBounds: [
      [-85, -180], 
      [85, 180]    
    ]
  });

  // Light basemap to better see the blue markers
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    noWrap: true,
    bounds: [
      [-85, -180],
      [85, 180]
    ],
    minZoom: 2,
    maxZoom: 18
  }).addTo(map);

  // Customize marker cluster appearance
  const markers = L.markerClusterGroup({
    maxClusterRadius: 50,
    iconCreateFunction: function(cluster) {
      const childCount = cluster.getChildCount();
      let size = 40;
      
      if (childCount < 10) {
        size = 40;
      } else if (childCount < 20) {
        size = 50;
      } else {
        size = 60;
      }

      return new L.DivIcon({ 
        html: `<div style="background-color: #0033a0; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 14px;">${childCount}</div>`, 
        className: 'custom-cluster', 
        iconSize: new L.Point(size, size) 
      });
    }
  });


let schools = [];

fetch("/Backend/api/data.php?file=schools.json")
  .then(res => {
    console.log('Response status:', res.status);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return res.json();
  })
  .then(data => {
    console.log('Escolas carregadas:', data.length);
    console.log('Primeira escola:', data[0]);
    schools = data;
    addMarkers('brasil');
  })
  .catch(error => {
    console.error('Erro ao carregar escolas:', error);
  });


  // Função para escapar HTML
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Create custom blue circle icon
  function createBlueCircleIcon() {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: #0033a0; width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 0 10px 3px #0033a0;"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  }

  function addMarkers(region = 'all') {
    console.log('addMarkers chamado com região:', region);
    markers.clearLayers();
    
    const filteredSchools = schools.filter(p => {
      if (region === 'all') return true;
      if (region === 'brasil') return p.region && (p.region.toLowerCase() === 'brasil' || p.region.toLowerCase() === 'brazil');
      if (region === 'world') return p.region && p.region.toLowerCase() !== 'brasil' && p.region.toLowerCase() !== 'brazil';
      return p.region && p.region.toLowerCase() === region.toLowerCase();
    });
    
    console.log(`Filtro: ${region}, Escolas encontradas: ${filteredSchools.length}`);
    
    if (filteredSchools.length === 0) {
      console.warn('Nenhuma escola encontrada para o filtro:', region);
      return;
    }
    
    filteredSchools.forEach((p, index) => {
      console.log(`Adicionando marcador ${index + 1}:`, p.nome || p.cidade, 'lat:', p.lat, 'lng:', p.lng);
      
      if (!p.lat || !p.lng || isNaN(p.lat) || isNaN(p.lng)) {
        console.error('Coordenadas inválidas para:', p.nome || p.cidade, p.lat, p.lng);
        return;
      }
      
      const icon = createBlueCircleIcon();
      const popupContent = `
        <div style="text-align: center;">
          <h4>${escapeHtml(p.nome || p.cidade)}</h4>
          <p><strong>Endereço:</strong> ${escapeHtml(p.endereco_encontrado)}</p>
          ${p.telefone ? `<p><strong>Telefone:</strong> ${escapeHtml(p.telefone)}</p>` : ''}
          ${p.instagram ? `<p><strong>Instagram:</strong> ${escapeHtml(p.instagram)}</p>` : ''}
        </div>
      `;
      const marker = L.marker([p.lat, p.lng], {icon: icon}).bindPopup(popupContent);
      markers.addLayer(marker);
    });
    
    console.log('Total de marcadores adicionados:', markers.getLayers().length);
    map.addLayer(markers);
  }

  

  // Initialize with all markers
  // addMarkers(); // Removido pois será chamado após carregar JSON

  // Button event handlers
  document.querySelectorAll('.menu-map button').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.menu-map button').forEach(b => b.classList.remove('active-map'));
      this.classList.add('active-map');
      const region = this.dataset.region;
      
      console.log('Botão clicado, região:', region);
      if(region === 'brasil') {
        map.setView([-15.78, -47.93], 4);
        addMarkers('brasil');
      } else if(region === 'world') {
        map.setView([20, 0], 2);
        addMarkers('world');
      }
    });
    
  });

  

  // Make sure map renders properly after DOM is fully loaded
  setTimeout(() => {
    map.invalidateSize();
    console.log('Mapa invalidado e redimensionado');
  }, 300);

  // Carousel and menu-map button logic moved inside DOMContentLoaded to avoid timing issues
  const track = document.querySelector('.news-cards');
  const prevBtn = document.querySelector('.btn-prev');
  const nextBtn = document.querySelector('.btn-next');
  const cards = document.querySelectorAll('.card');

  let visibleCards = 3; // ajuste conforme layout
  let index = 0; // começa no primeiro card
  const cardWidth = cards.length > 0 ? cards[0].offsetWidth + 28 : 0; // largura + gap
  const maxIndex = Math.max(cards.length - visibleCards, 0);

  function updateCarousel() {
    // Garante que o índice está dentro dos limites
    index = Math.max(0, Math.min(index, maxIndex));
    if (track) {
      track.style.transform = `translateX(${-index * cardWidth}px)`;
    }
  }

  // Inicializa o carrossel mostrando o primeiro card
  updateCarousel();

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (index < maxIndex) {
        index++;
      } else {
        index = 0; // loop para o início
      }
      updateCarousel();
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (index > 0) {
        index--;
      } else {
        index = maxIndex; // loop para o final
      }
      updateCarousel();
    });
  }

  window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 0) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

});





// news.html
// News functionality
var newsData = [];

function openModal(index) {
    var item = newsData[index];
    document.getElementById('newsModalLabel').textContent = escapeHtml(item.title || 'Notícia');
    
    var imageContainer = document.getElementById('newsModalImage');
    var imageUrl = item['1-image_URL'] || item.image_URL;
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
                    for (var i = 0; i < newsData.length; i++) {
                        var item = newsData[i];
                        var newsItem = document.createElement('div');
                        newsItem.className = 'news-item';
                        
                        var dateText = '';
                        if (item.dayWeek && item.date && item.month) {
                            dateText = item.dayWeek + ', ' + item.date + ' de ' + item.month;
                        }
                        
                        newsItem.innerHTML = 
                            '<h2>' + escapeHtml(item.title || 'Título') + '</h2>' +
                            (dateText ? '<p class="date">' + escapeHtml(dateText) + '</p>' : '') +
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

document.addEventListener('DOMContentLoaded', function() {
    if (document.querySelector('.news-letter')) {
        loadNews();
    }
});



