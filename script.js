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
      let c = ' marker-cluster-';
      let size, className;
      
      if (childCount < 10) {
        c += 'small';
        size = 40;
      } else if (childCount < 20) {
        c += 'medium';
        size = 50;
      } else {
        c += 'large';
        size = 60;
      }

      return new L.DivIcon({ 
        html: '<div><span>' + childCount + '</span></div>', 
        className: 'marker-cluster' + c, 
        iconSize: new L.Point(size, size) 
      });
    }
  });

//   const schools = [
//     {lat: 40.71, lng: -74.00, nome: 'New York', region: 'mundo'},
//     {lat: 51.50, lng: -0.12, nome: 'London', region: 'mundo'},
//     {lat: 35.68, lng: 139.76, nome: 'Tokyo', region: 'mundo'},
//     // Brasil
//     {lat: -23.55, lng: -46.63, nome: 'São Paulo', region: 'brasil'}, 
//     {lat: -22.90, lng: -43.20, nome: 'Rio de Janeiro', region: 'brasil'},
//     {lat: -19.9677, lng: -44.1980, nome: 'Betim/MG', region: 'brasil'},
//     {lat: -20.0145, lng: -43.8512, nome: 'Vila Cristina, Nova Lima/MG', region: 'brasil'},
//     {lat: -19.9227, lng: -43.9378, nome: 'Ouro Mansões, Belo Horizonte/MG', region: 'brasil'},
//     {lat: -19.9227, lng: -43.9378, nome: 'Barro Preto, Belo Horizonte/MG', region: 'brasil'},
//     {lat: -19.9317, lng: -44.0539, nome: 'Santa Branca, Contagem/MG', region: 'brasil'},
//     {lat: -20.2639, lng: -40.4203, nome: 'Centro, Cariacica/ES', region: 'brasil'},
//     {lat: -20.3417, lng: -40.2875, nome: 'Vila Velha/ES', region: 'brasil'},
//     {lat: -19.4714, lng: -42.5476, nome: 'Ipatinga/MG', region: 'brasil'},
//     {lat: -19.8937, lng: -43.8266, nome: 'Sabará/MG', region: 'brasil'},
//     {lat: -19.6222, lng: -44.0439, nome: 'Nações Unidas, Pedro Leopoldo/MG', region: 'brasil'},
//     {lat: -19.6308, lng: -43.8932, nome: 'Lagoa Santa/MG', region: 'brasil'},
//     {lat: -19.9227, lng: -43.9378, nome: 'Castelo, Belo Horizonte/MG', region: 'brasil'},
//     {lat: -19.9245, lng: -43.9266, nome: 'Santa Tereza, Belo Horizonte/MG', region: 'brasil'},
//     {lat: -19.7690, lng: -43.8512, nome: 'Santa Luzia/MG', region: 'brasil'},
//     {lat: -20.4958, lng: -43.8512, nome: 'Congonhas/MG', region: 'brasil'},
//     {lat: -19.8126, lng: -43.1737, nome: 'João Monlevade/MG', region: 'brasil'},
//     {lat: -19.9317, lng: -44.0539, nome: 'Jardim Riacho, Contagem/MG', region: 'brasil'},
//     {lat: -19.8937, lng: -43.8266, nome: 'Bandeirantes, Sabará/MG', region: 'brasil'},
//     {lat: -19.9317, lng: -44.0539, nome: 'Arvoredo, Contagem/MG', region: 'brasil'},
//     {lat: -17.8595, lng: -41.5087, nome: 'Teófilo Otoni/MG', region: 'brasil'},
//     {lat: -18.8545, lng: -41.9555, nome: 'Governador Valadares/MG', region: 'brasil'},
//     {lat: -18.9439, lng: -46.9934, nome: 'Patrocínio/MG', region: 'brasil'},
//     {lat: -20.1446, lng: -44.8912, nome: 'Divinópolis/MG', region: 'brasil'},
//     {lat: -19.8606, lng: -44.6113, nome: 'Pará de Minas/MG', region: 'brasil'},
//     {lat: -25.4951, lng: -49.2331, nome: 'Alto Boqueirão, Curitiba/PR', region: 'brasil'},
//     {lat: -31.7710, lng: -52.3426, nome: 'Pelotas/RS', region: 'brasil'},
//     {lat: -15.8333, lng: -48.0833, nome: 'Ceilândia Sul, Brasília/DF', region: 'brasil'},
//     {lat: -2.4385, lng: -54.6996, nome: 'Santarém/PA', region: 'brasil'},
//     {lat: -19.9227, lng: -43.9378, nome: 'Aquaball, Belo Horizonte/MG', region: 'brasil'},
//     {lat: -22.3644, lng: -46.1497, nome: 'Camanducaia/MG', region: 'brasil'},
//     {lat: -20.6636, lng: -43.7862, nome: 'Conselheiro Lafaiete/MG', region: 'brasil'},
//     {lat: -3.7172, lng: -38.5433, nome: 'Fortaleza/CE', region: 'brasil'},
//     {lat: -20.2500, lng: -43.8039, nome: 'Itabirito/MG', region: 'brasil'},
//     {lat: -19.8126, lng: -41.4406, nome: 'Mutum/MG', region: 'brasil'},
//     {lat: -22.9068, lng: -43.1729, nome: 'Rio de Janeiro/RJ', region: 'brasil'},
//     {lat: -2.5387, lng: -44.2825, nome: 'São Luís/MA', region: 'brasil'},
//     {lat: -22.8832, lng: -43.1034, nome: 'Niterói/RJ', region: 'brasil'},
//     {lat: -15.7481, lng: -43.0286, nome: 'Porteirinha/MG', region: 'brasil'},
//     {lat: -17.2252, lng: -46.8750, nome: 'Paracatu/MG', region: 'brasil'},
//     {lat: -3.7172, lng: -38.5433, nome: 'Iracema, Fortaleza/CE', region: 'brasil'},
//     {lat: -19.7668, lng: -44.0868, nome: 'Ribeirão das Neves/MG', region: 'brasil'}
// ];

let schools = [];

fetch("./Json/schools.json")
  .then(res => res.json())
  .then(data => {
    schools = data;
    addMarkers();
  });


  // Create custom blue circle icon
  function createBlueCircleIcon(intensity) {
    const sizes = {
      'low': [20, 20],
      'medium': [25, 25],
      'high': [30, 30]
    };
    
    const colors = {
      'low': '#1E90FF',      // Dodger Blue
      'medium': '#0066CC',   // Medium Blue
      'high': '#003399'      // Dark Blue
    };
    
    const size = sizes[intensity] || sizes.medium;
    const color = colors[intensity] || colors.medium;
    
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: \${color}; width: 100%; height: 100%; border-radius: 50%; box-shadow: 0 0 15px 5px \${color};"></div>`,
      iconSize: size,
      iconAnchor: [size[0]/2, size[1]/2]
    });
  }

  function addMarkers(region = 'all') {
    markers.clearLayers();
    
    schools.filter(p => region === 'all' || p.region === region)
      .forEach(p => {
        // Determine marker intensity randomly for visual variety
        const intensities = ['low', 'medium', 'high'];
        const randomIntensity = intensities[Math.floor(Math.random() * intensities.length)];
        
        const icon = createBlueCircleIcon(randomIntensity);
        const marker = L.marker([p.lat, p.lng], {icon: icon}).bindPopup(p.nome);
        markers.addLayer(marker);
      });
    
    map.addLayer(markers);
  }

  

  // Initialize with all markers
  addMarkers();

  // Button event handlers
  document.querySelectorAll('.menu-map button').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('.menu-map button').forEach(b => b.classList.remove('active-map'));
      this.classList.add('active-map');
      const region = this.dataset.region;
      
      if(region === 'brasil') {
        map.setView([-15.78, -47.93], 4); // Brasil
        addMarkers('brasil');
      } else if(region === 'world') {
        map.setView([20, 0], 2); // Mundo
        addMarkers('mundo');
      } else {
        map.setView([-15.78, -47.93], 3); // Todas
        addMarkers('all');
      }
    });
    
  });

  

  // Make sure map renders properly after DOM is fully loaded
  setTimeout(() => map.invalidateSize(), 300);


});





const track = document.querySelector('.news-cards');
const prevBtn = document.querySelector('.btn-prev');
const nextBtn = document.querySelector('.btn-next');
const cards = document.querySelectorAll('.card');


let visibleCards = 3; // ajuste conforme layout
let index = 0; // começa no primeiro card
const cardWidth = cards[0].offsetWidth + 28; // largura + gap
const maxIndex = Math.max(cards.length - visibleCards, 0);

function updateCarousel() {
  // Garante que o índice está dentro dos limites
  index = Math.max(0, Math.min(index, maxIndex));
  track.style.transform = `translateX(${-index * cardWidth}px)`;
}

// Inicializa o carrossel mostrando o primeiro card
updateCarousel();

nextBtn.addEventListener('click', () => {
  if (index < maxIndex) {
    index++;
  } else {
    index = 0; // loop para o início
  }
  updateCarousel();
});

prevBtn.addEventListener('click', () => {
  if (index > 0) {
    index--;
  } else {
    index = maxIndex; // loop para o final
  }
  updateCarousel();
});


window.addEventListener('scroll', () => {
  const header = document.querySelector('header');
  if (window.scrollY > 0) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});






// news.html
document.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.news-letter')) {
    fetch('./Json/news.json')
      .then(response => response.json())
      .then(data => {
        const newsContainer = document.querySelector('.news-letter');
        
        data.forEach(item => {
          const newsItem = document.createElement('div');
          newsItem.classList.add('news-item');
          newsItem.innerHTML = `
            <h2>${item.title}</h2>
            <p class="date">${item.dayWeek}, ${item.date} de ${item.month}</p>
            <p>${item.content.substring(0, 80)}...</p>
            <button class="read-more-btn">Leia mais</button>
          `;
          
          const newsItemOpen = document.createElement('div');
          newsItemOpen.classList.add('news-item-open');
          newsItem.appendChild(newsItemOpen);
          newsItemOpen.innerHTML = `
            <h3>${item.subtitle || ''}</h3>
            <p>${item.content}</p>
            ${item["1-image_URL"] ? `<img src="${item["1-image_URL"]}" alt="${item.title}">` : ''}
          `;
          
          const readMoreBtn = newsItem.querySelector('.read-more-btn');
          readMoreBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            newsItemOpen.classList.toggle('active');
            readMoreBtn.textContent = newsItemOpen.classList.contains('active') ? 'Leia menos' : 'Leia mais';
          });
          
          newsContainer.appendChild(newsItem);
        });
      })
      .catch(error => console.error('Error loading news:', error));
  }
});
