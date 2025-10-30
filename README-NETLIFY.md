# Deploy na Netlify - Escolas do Cruzeiro

## Versão Beta Estática

Esta é a versão beta estática do site das Escolas do Cruzeiro, adaptada para deploy na Netlify.

### Alterações Realizadas

1. **Configuração Netlify**
   - Criado `netlify.toml` com configurações de build e headers de segurança
   - Criado `_redirects` para roteamento
   - Criado `package.json` para configuração do projeto

2. **Dados Estáticos**
   - Copiados arquivos JSON do backend para `Frontend/data/`
   - Alterado `script.js` para carregar dados localmente

3. **Funcionalidades Adaptadas**
   - Formulário de licenciado salva apenas no localStorage
   - Mensagens atualizadas para orientar contato por email
   - Removidas dependências do backend PHP

### Como Fazer Deploy

1. **Via GitHub (Recomendado)**
   ```bash
   git add .
   git commit -m "Preparação para deploy Netlify"
   git push origin main
   ```
   - Conecte o repositório GitHub na Netlify
   - Configure build settings:
     - Build command: `echo 'Build completed'`
     - Publish directory: `Frontend`

2. **Via Drag & Drop**
   - Faça zip da pasta `Frontend`
   - Arraste para o painel da Netlify

### Configurações da Netlify

- **Build Command**: `echo 'Build completed'`
- **Publish Directory**: `Frontend`
- **Node Version**: 18

### Funcionalidades Disponíveis

✅ **Funcionando:**
- Visualização de escolas no mapa
- Notícias
- Formulário de aula experimental (WhatsApp)
- Interface responsiva
- Navegação entre páginas

⚠️ **Limitado (versão estática):**
- Formulário de licenciado (salva apenas localmente)
- Dados não são enviados para servidor

### URLs de Exemplo

- **Produção**: `https://escolas-cruzeiro.netlify.app`
- **Preview**: `https://deploy-preview-X--escolas-cruzeiro.netlify.app`

### Próximos Passos

Para funcionalidade completa, considere:
1. Implementar Netlify Functions para backend
2. Integrar com serviços como Formspree para formulários
3. Usar Netlify CMS para gerenciar conteúdo

### Contato

Para dúvidas sobre licenciamento: escolas@cruzeiro.com.br