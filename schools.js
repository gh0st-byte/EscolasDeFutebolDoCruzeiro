// Carregar JSON local
fetch('./Json/schools.json')
  .then(response => response.json())
  .then(data => {
    const container = document.querySelector('.escolas div');
    
    data.escolas.forEach(escola => {
      container.innerHTML += `
        <div class="escola-card">
          <h3>${escola.nome}</h3>
          <p>${escola.endereco}</p>
          <p>${escola.telefone}</p>
        </div>
      `;
    });
  });
