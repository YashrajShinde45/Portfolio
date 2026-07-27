(function () {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');
  const progressBar = document.getElementById('progressBar');

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('portfolio-theme', theme);
    if (themeToggle) {
      const icon = themeToggle.querySelector('.theme-icon');
      if (icon) icon.textContent = theme === 'dark' ? '🌙' : '☀️';
    }
  }

  function initTheme() {
    const savedTheme = localStorage.getItem('portfolio-theme');
    const initialTheme = savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initialTheme);
  }

  function toggleNav() {
    if (!navToggle || !navMenu) return;
    const isOpen = navMenu.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  }

  function closeNavOnResize() {
    if (!navMenu || window.innerWidth > 760) {
      navMenu?.classList.remove('is-open');
      navToggle?.setAttribute('aria-expanded', 'false');
    }
  }

  function updateScrollProgress() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = docHeight > 0 ? scrollTop / docHeight : 0;
    if (progressBar) {
      progressBar.style.transform = `scaleX(${Math.min(progress, 1)})`;
    }
  }

  function populateProjectDetails() {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get('id');
    if (!slug) return;

    const project = (window.portfolioData?.projects || []).find((entry) => entry.name === slug);
    if (!project) return;

    document.title = `${project.name} | Portfolio`;
    document.getElementById('projectTitle').textContent = project.name;
    document.getElementById('projectTypeTag').textContent = project.type;
    document.getElementById('projectMeta').textContent = `${project.year} • ${project.technologies.join(' • ')}`;
    document.getElementById('heroImage').src = project.image;
    document.getElementById('heroImage').alt = `${project.name} preview`;
    document.getElementById('problemStatement').textContent = project.problemStatement;
    document.getElementById('fullDescription').textContent = project.fullDescription;
    document.getElementById('highlightsList').innerHTML = project.highlights.map((item) => `<li>${item}</li>`).join('');
    document.getElementById('detailTechChips').innerHTML = project.technologies.map((tech) => `<span class="chip">${tech}</span>`).join('');
    document.getElementById('skillsList').innerHTML = project.skills.map((skill) => `<li>${skill}</li>`).join('');
    document.getElementById('challengesText').textContent = project.challenges;
    document.getElementById('solutionText').textContent = project.solution;
    document.getElementById('galleryGrid').innerHTML = project.gallery.map((image) => `<img src="${image}" alt="${project.name} gallery" loading="lazy" />`).join('');

    const githubLink = document.getElementById('githubLink');
    const liveLink = document.getElementById('liveLink');
    const playStoreLink = document.getElementById('playStoreLink');
    const copyLinkBtn = document.getElementById('copyLinkBtn');
    const shareProjectBtn = document.getElementById('shareProjectBtn');

    if (githubLink) {
      githubLink.href = project.github || '#';
      githubLink.style.display = project.github ? 'inline-flex' : 'none';
    }

    if (liveLink) {
      liveLink.href = project.liveLink || '#';
      liveLink.style.display = project.liveLink ? 'inline-flex' : 'none';
    }

    if (playStoreLink) {
      playStoreLink.href = project.playStore || '#';
      playStoreLink.style.display = project.playStore ? 'inline-flex' : 'none';
    }

    copyLinkBtn?.addEventListener('click', async () => {
      await navigator.clipboard.writeText(project.github || window.location.href);
      copyLinkBtn.textContent = 'Copied';
      setTimeout(() => {
        copyLinkBtn.textContent = 'Copy GitHub';
      }, 1200);
    });

    shareProjectBtn?.addEventListener('click', async () => {
      if (navigator.share) {
        await navigator.share({
          title: project.name,
          text: project.description,
          url: window.location.href
        });
      } else {
        window.prompt('Copy this link to share:', window.location.href);
      }
    });
  }

  function attachGlobalHandlers() {
    themeToggle?.addEventListener('click', () => {
      const current = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      setTheme(current);
    });

    navToggle?.addEventListener('click', toggleNav);
    window.addEventListener('resize', closeNavOnResize);
    window.addEventListener('scroll', updateScrollProgress, { passive: true });
    document.addEventListener('click', (event) => {
      if (!navMenu?.contains(event.target) && !navToggle?.contains(event.target)) {
        navMenu?.classList.remove('is-open');
        navToggle?.setAttribute('aria-expanded', 'false');
      }
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    attachGlobalHandlers();
    closeNavOnResize();
    updateScrollProgress();
    populateProjectDetails();
  });
})();
