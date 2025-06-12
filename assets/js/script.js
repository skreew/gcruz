// assets/js/script.js

/**
 * Ponto de entrada principal. Executado quando o DOM está totalmente carregado.
 * Determina qual página está ativa e chama a função de inicialização correspondente.
 */
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;

    // Roteamento simples baseado no nome do arquivo HTML
    if (path.endsWith('/') || path.endsWith('index.html')) {
        initIndexPage();
    } else if (path.endsWith('case.html')) {
        initCasePage();
    }

    // Funcionalidade comum a todas as páginas
    updateCopyrightYear();
});

/**
 * Inicializa a página principal (index.html), carregando e exibindo os projetos.
 */
async function initIndexPage() {
    const grid = document.getElementById('portfolio-grid');
    const loadingIndicator = document.getElementById('loading-indicator');
    const filterBtns = document.querySelectorAll('.filter-btn');

    if (!grid) return;

    try {
        const projects = await fetchProjects();
        
        loadingIndicator.style.display = 'none';
        displayProjects(projects);

        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterProjects(btn.dataset.filter, projects);
            });
        });

    } catch (error) {
        console.error("Falha ao carregar projetos:", error);
        loadingIndicator.textContent = "Não foi possível carregar os projetos. Tente novamente mais tarde.";
    }
}

/**
 * Renderiza os cards dos projetos na grid da página inicial.
 * @param {Array} projects - Array de objetos de projeto.
 */
function displayProjects(projects) {
    const grid = document.getElementById('portfolio-grid');
    grid.innerHTML = ''; // Limpa a grid para evitar duplicatas

    if (!projects || projects.length === 0) {
        document.getElementById('no-results').classList.remove('hidden');
        return;
    }
    
    projects.forEach(project => {
        const card = document.createElement('a');
        card.href = `case.html?p=${project.slug}`;
        card.className = 'project-card';
        card.dataset.category = project.categoria;
        // Adiciona subcategoria e tags como data attributes para filtros mais avançados no futuro
        if (project.subcategoria) card.dataset.subcategory = project.subcategoria;
        if (project.tags) card.dataset.tags = project.tags.join(',');
        
        card.setAttribute('aria-label', `Ver detalhes do projeto ${project.titulo}`);

        // Placeholder para o caso de a imagem não carregar
        const thumbnailHtml = `
            <div class="card-thumbnail">
                <img src="${project.thumbnail || 'assets/images/placeholder_16x10.png'}" 
                     alt="Thumbnail do projeto: ${project.titulo}" 
                     loading="lazy"
                     onerror="this.onerror=null;this.src='https://placehold.co/600x400/e0e0e0/757575?text=Imagem+Indispon%C3%ADvel';">
            </div>`;
        
        card.innerHTML = `
            ${thumbnailHtml}
            <div class="card-content">
                <span class="card-category">${project.categoria}</span>
                <h3>${project.titulo}</h3>
                <p>${project.descricao_curta}</p>
                <span class="card-link">Ver Projeto &rarr;</span>
            </div>
        `;
        grid.appendChild(card);
    });
}

/**
 * Filtra os projetos visíveis na grid com base na categoria selecionada.
 * @param {string} filter - A categoria para filtrar ("all", "Automação", etc.).
 */
function filterProjects(filter) {
    const cards = document.querySelectorAll('.project-card');
    const noResults = document.getElementById('no-results');
    let hasVisibleProjects = false;

    cards.forEach(card => {
        const isVisible = filter === 'all' || card.dataset.category === filter;
        card.classList.toggle('hidden', !isVisible);
        if (isVisible) hasVisibleProjects = true;
    });

    noResults.classList.toggle('hidden', hasVisibleProjects);
}


/**
 * Inicializa a página de case de estudo (case.html).
 */
async function initCasePage() {
    const contentContainer = document.getElementById('case-study-content');
    if (!contentContainer) return;

    const params = new URLSearchParams(window.location.search);
    const projectSlug = params.get('p');

    if (!projectSlug) {
        contentContainer.innerHTML = '<p class="status-indicator">Projeto não encontrado. Volte para o <a href="/">portfólio</a>.</p>';
        return;
    }

    try {
        const projects = await fetchProjects();
        const project = projects.find(p => p.slug === projectSlug);

        if (project) {
            renderCaseStudy(project);
        } else {
            contentContainer.innerHTML = '<p class="status-indicator">Projeto não encontrado. Volte para o <a href="/">portfólio</a>.</p>';
        }
    } catch (error) {
        console.error("Falha ao carregar o projeto:", error);
        contentContainer.innerHTML = '<p class="status-indicator">Erro ao carregar os detalhes do projeto.</p>';
    }
}

/**
 * Renderiza o conteúdo detalhado de um case de estudo na página.
 * @param {object} project - O objeto do projeto a ser renderizado.
 */
function renderCaseStudy(project) {
    const container = document.getElementById('case-study-content');

    // --- SEO e Metadados Dinâmicos ---
    const pageTitle = `${project.titulo} | Portfólio | Gabriel Alves da Cruz`;
    document.title = pageTitle;
    const canonicalUrl = `${window.location.origin}${window.location.pathname}?p=${project.slug}`;
    const imageUrl = `${window.location.origin}/${project.thumbnail}`;

    updateMetaTag('name', 'description', project.descricao_curta);
    updateMetaTag('property', 'og:title', pageTitle);
    updateMetaTag('property', 'og:description', project.descricao_curta);
    updateMetaTag('property', 'og:image', imageUrl);
    updateMetaTag('property', 'og:url', canonicalUrl);
    updateMetaTag('property', 'og:type', 'article');
    // Adicionar <link rel="canonical">
    let canonicalLink = document.querySelector("link[rel='canonical']");
    if(!canonicalLink){
        canonicalLink = document.createElement('link');
        canonicalLink.setAttribute('rel', 'canonical');
        document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

    // --- Schema JSON-LD para SEO avançado ---
    const schema = {
      "@context": "https://schema.org",
      "@type": "CaseStudy",
      "name": project.titulo,
      "headline": project.titulo,
      "description": project.descricao_detalhada,
      "datePublished": project.data_conclusao,
      "author": { "@type": "Person", "name": "Gabriel Alves da Cruz" },
      "image": imageUrl,
      "url": canonicalUrl
    };
    // Remover schema antigo e adicionar o novo
    const oldSchema = document.getElementById('schema-json-ld');
    if(oldSchema) oldSchema.remove();
    const script = document.createElement('script');
    script.id = 'schema-json-ld';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    // --- Geração do HTML do Conteúdo ---
    const date = new Date(project.data_conclusao + 'T12:00:00Z'); // Adiciona tempo para evitar problemas de fuso
    const formattedDate = date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' });

    container.innerHTML = `
        <header class="case-study-header">
            <p class="category">${project.categoria} ${project.subcategoria ? ` / ${project.subcategoria}` : ''}</p>
            <h1>${project.titulo}</h1>
            <p class="date">Concluído em: ${formattedDate}</p>
        </header>

        <section class="case-study-section" aria-labelledby="contexto-desafio">
            <h2 id="contexto-desafio">Contexto e Desafio</h2>
            <p>${project.descricao_detalhada.replace(/\n/g, '<br>')}</p>
        </section>

        <section class="case-study-section" aria-labelledby="tecnologias">
            <h2 id="tecnologias">Tecnologias Utilizadas</h2>
            <ul class="tech-list">
                ${project.tecnologias.map(tech => `<li>${tech}</li>`).join('')}
            </ul>
        </section>

        <section class="case-study-section" aria-labelledby="resultados">
            <h2 id="resultados">Resultados</h2>
            <ul class="results-list">
                ${project.resultados.map(result => `<li>${result}</li>`).join('')}
            </ul>
        </section>

        ${(project.imagens && project.imagens.length > 0) ? `
        <section class="case-study-section" aria-labelledby="galeria">
            <h2 id="galeria">Galeria</h2>
            <div class="case-gallery">
                ${project.imagens.map(img => `
                    <img src="${img}" 
                         alt="Imagem do projeto ${project.titulo}" 
                         loading="lazy"
                         onerror="this.onerror=null;this.src='https://placehold.co/800x600/e0e0e0/757575?text=Imagem+Indispon%C3%ADvel';">
                `).join('')}
            </div>
        </section>
        ` : ''}
        
        ${project.video_embed ? `
        <section class="case-study-section" aria-labelledby="video-projeto">
            <h2 id="video-projeto">Vídeo do Projeto</h2>
            <div class="case-video-embed">
                <iframe src="${project.video_embed}" 
                        title="Vídeo do projeto ${project.titulo}"
                        frameborder="0" 
                        allow="autoplay; fullscreen; picture-in-picture" 
                        allowfullscreen></iframe>
            </div>
        </section>
        ` : ''}
        
        <section class="case-study-section cta-section">
            <a href="/#portfolio" class="cta-button">&larr; Voltar ao Portfólio</a>
        </section>
    `;
}

/**
 * Função utilitária para buscar e fazer cache dos projetos do JSON.
 * Evita múltiplas requisições de rede.
 */
let projectsCache = null;
async function fetchProjects() {
    if (projectsCache) {
        return projectsCache;
    }
    const response = await fetch('projetos.json');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const projects = await response.json();
    projectsCache = projects;
    return projects;
}

/**
 * Função utilitária para adicionar ou atualizar uma meta tag no <head>.
 * @param {string} attr - O atributo principal da tag (ex: 'name', 'property').
 * @param {string} value - O valor do atributo principal (ex: 'description', 'og:title').
 * @param {string} content - O conteúdo da tag.
 */
function updateMetaTag(attr, value, content) {
    let element = document.querySelector(`meta[${attr}="${value}"]`);
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attr, value);
        document.head.appendChild(element);
    }
    element.setAttribute('content', content || '');
}

/**
 * Função utilitária para atualizar o ano no rodapé.
 */
function updateCopyrightYear() {
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }
}
