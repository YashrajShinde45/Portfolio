(function () {
  const state = {
    type: 'All',
    technology: 'All',
    year: 'All',
    search: '',
    sort: 'newest',
    visibleCount: 999
  };

  function getProjects() {
    return window.portfolioData?.projects || [];
  }

  function sortProjects(list) {
    const sorted = [...list];
    switch (state.sort) {
      case 'oldest':
        return sorted.sort((a, b) => a.year - b.year);
      case 'alphabetical':
        return sorted.sort((a, b) => a.name.localeCompare(b.name));
      case 'live':
        return sorted.sort((a, b) => Number(b.tags.includes('live')) - Number(a.tags.includes('live')));
      case 'freelance':
        return sorted.sort((a, b) => Number(b.type === 'Freelance') - Number(a.type === 'Freelance'));
      case 'newest':
      default:
        return sorted.sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
    }
  }

  function filterProjects(list) {
    const query = state.search.trim().toLowerCase();

    return list.filter((project) => {
      const matchesType = state.type === 'All' || project.type === state.type;
      const matchesTechnology = state.technology === 'All' || project.technologies.includes(state.technology);
      const matchesYear = state.year === 'All' || String(project.year) === state.year;
      const haystack = [project.name, project.description, project.type, project.technologies.join(' '), project.tags.join(' ')]
        .join(' ')
        .toLowerCase();
      const matchesSearch = !query || haystack.includes(query);

      return matchesType && matchesTechnology && matchesYear && matchesSearch;
    });
  }

  function getVisibleProjects() {
    const filtered = filterProjects(getProjects());
    const sorted = sortProjects(filtered);
    return sorted.slice(0, state.visibleCount);
  }

  function renderProjects() {
    const list = getVisibleProjects();
    const grid = document.getElementById('projectsGrid');
    const emptyState = document.getElementById('emptyState');
    const resultCount = document.getElementById('resultCount');
    const showMoreBtn = document.getElementById('showMoreBtn');

    if (!grid) return;

    grid.innerHTML = '';

    if (!list.length) {
      emptyState.hidden = false;
      resultCount.textContent = 'Showing 0 projects';
      showMoreBtn.hidden = true;
      return;
    }

    emptyState.hidden = true;
    const totalResults = filterProjects(getProjects()).length;
    resultCount.textContent = `Showing ${list.length} of ${totalResults} projects`;
    showMoreBtn.hidden = true;

    list.forEach((project, index) => {
      const card = document.createElement('article');
      card.className = 'project-card';
      card.setAttribute('tabindex', '0');
      card.innerHTML = `
        <img loading="lazy" src="${project.image}" alt="${project.name} preview" onerror="this.onerror=null; this.src='assets/images/placeholder.svg';" />
        <div class="project-body">
          <div class="project-meta">
            <span>${project.year}</span>
            <span>•</span>
            <span>${project.type}</span>
          </div>
          <h3>${project.name}</h3>
          <div class="badge-row">
            ${project.technologies.slice(0, 3).map((tech) => `<span class="badge">${tech}</span>`).join('')}
          </div>
          <p>${project.description}</p>
          <div class="project-actions-row">
            <a class="btn btn-primary" href="project.html?id=${encodeURIComponent(project.name)}">Read More</a>
            ${project.liveLink ? `<a class="btn btn-secondary" href="${project.liveLink}" target="_blank" rel="noopener">Live Preview</a>` : ''}
          </div>
        </div>`;

      const cardImg = card.querySelector('img');
      if (cardImg) {
        cardImg.title = 'Click to view full screen gallery';
        cardImg.addEventListener('click', (e) => {
          e.stopPropagation();
          const allImages = [project.image, ...(project.gallery || [])].filter(Boolean);
          if (window.PortfolioLightbox) {
            window.PortfolioLightbox.open(allImages, 0, project.name);
          }
        });
      }

      requestAnimationFrame(() => {
        card.classList.add('is-visible');
      });

      grid.appendChild(card);
      card.style.animationDelay = `${index * 60}ms`;
    });
  }

  function populateFilters() {
    const techSelect = document.getElementById('technologyFilter');
    const yearSelect = document.getElementById('yearFilter');

    if (techSelect) {
      const technologies = [...new Set(getProjects().flatMap((project) => project.technologies))].sort();
      technologies.forEach((tech) => {
        const option = document.createElement('option');
        option.value = tech;
        option.textContent = tech;
        techSelect.appendChild(option);
      });
    }

    if (yearSelect) {
      const years = [...new Set(getProjects().map((project) => String(project.year)))].sort((a, b) => Number(b) - Number(a));
      years.forEach((year) => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
      });
    }
  }

  function bindEvents() {
    const typeFilter = document.getElementById('typeFilter');
    const technologyFilter = document.getElementById('technologyFilter');
    const yearFilter = document.getElementById('yearFilter');
    const searchInput = document.getElementById('searchInput');
    const sortFilter = document.getElementById('sortFilter');
    const showMoreBtn = document.getElementById('showMoreBtn');

    [typeFilter, technologyFilter, yearFilter, sortFilter].forEach((element) => {
      element?.addEventListener('change', (event) => {
        const target = event.target;
        if (target.id === 'typeFilter') state.type = target.value;
        if (target.id === 'technologyFilter') state.technology = target.value;
        if (target.id === 'yearFilter') state.year = target.value;
        if (target.id === 'sortFilter') state.sort = target.value;
        state.visibleCount = 999;
        renderProjects();
      });
    });

    searchInput?.addEventListener('input', (event) => {
      state.search = event.target.value;
      state.visibleCount = 999;
      renderProjects();
    });

    showMoreBtn?.addEventListener('click', () => {
      renderProjects();
    });
  }

  function renderStats() {
    const statsContainer = document.getElementById('statsContainer');
    if (!statsContainer) return;

    const projectsList = getProjects();
    const total = projectsList.length;
    const live = projectsList.filter((project) => project.tags.includes('live')).length;
    const freelance = projectsList.filter((project) => project.type === 'Freelance').length;
    const internship = projectsList.filter((project) => project.type === 'Internship').length;

    const stats = [
      { label: 'Total Projects', value: total },
      { label: 'Live Projects', value: live },
      { label: 'Freelance Projects', value: freelance },
      { label: 'Internship Projects', value: internship }
    ];

    statsContainer.innerHTML = stats.map((item) => `
      <div class="stat-card">
        <span class="stat-value">${item.value}</span>
        <span class="stat-label">${item.label}</span>
      </div>
    `).join('');
  }

  function renderTechChips() {
    const chips = document.getElementById('techChips');
    if (!chips) return;
    chips.innerHTML = window.portfolioData?.techStack?.map((tech) => `<span class="chip">${tech}</span>`).join('');
  }

  function init() {
    populateFilters();
    renderStats();
    renderTechChips();
    bindEvents();
    renderProjects();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
