# Frontend - Escolas do Cruzeiro

Esta pasta contém todos os arquivos do frontend da aplicação.

## Estrutura

```
Frontend/
├── index.html          # Página principal
├── schools.html        # Página das escolas
├── news.html          # Página de notícias
├── test.html          # Página de teste
├── test-news.html     # Teste de notícias
├── debug-news.html    # Debug de notícias
├── css/               # Arquivos de estilo
│   ├── styles.css     # Estilos principais
│   └── schools-styles.css # Estilos das escolas
├── js/                # Arquivos JavaScript
│   ├── script.js      # Script principal
│   └── schools.js     # Script das escolas
└── assets/            # Recursos estáticos
    └── img/           # Imagens
```

## Como usar

1. Abra qualquer arquivo HTML em um navegador
2. Certifique-se de que o Backend está rodando para carregar os dados
3. Para desenvolvimento local, use um servidor HTTP simples

## Dependências

- Bootstrap 5.3.0 (CDN)
- Leaflet (para mapas)
- Leaflet MarkerCluster

## APIs utilizadas

- `../Backend/api/data.php` - Para carregar dados JSON