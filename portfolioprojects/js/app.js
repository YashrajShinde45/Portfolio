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

  // --- Lightbox Gallery Module ---
  const Lightbox = (function () {
    let modal, overlay, stageImg, captionCounter, captionTitle, closeBtn, prevBtn, nextBtn;
    let currentImages = [];
    let currentIndex = 0;
    let currentProjectName = '';

    function createModal() {
      if (document.getElementById('lightboxModal')) return;

      modal = document.createElement('div');
      modal.id = 'lightboxModal';
      modal.className = 'lightbox-modal';
      modal.setAttribute('aria-hidden', 'true');
      modal.setAttribute('role', 'dialog');
      modal.innerHTML = `
        <div class="lightbox-overlay" id="lightboxOverlay"></div>
        <div class="lightbox-content">
          <button class="lightbox-close" id="lightboxClose" aria-label="Close modal">✕</button>
          <button class="lightbox-nav lightbox-prev" id="lightboxPrev" aria-label="Previous image">‹</button>
          <div class="lightbox-stage">
            <img id="lightboxImage" src="" alt="Gallery preview" />
            <div class="lightbox-caption">
              <span id="lightboxCounter">1 / 1</span>
              <p id="lightboxTitle"></p>
            </div>
          </div>
          <button class="lightbox-nav lightbox-next" id="lightboxNext" aria-label="Next image">›</button>
        </div>
      `;
      document.body.appendChild(modal);

      overlay = document.getElementById('lightboxOverlay');
      stageImg = document.getElementById('lightboxImage');
      captionCounter = document.getElementById('lightboxCounter');
      captionTitle = document.getElementById('lightboxTitle');
      closeBtn = document.getElementById('lightboxClose');
      prevBtn = document.getElementById('lightboxPrev');
      nextBtn = document.getElementById('lightboxNext');

      closeBtn.addEventListener('click', close);
      overlay.addEventListener('click', close);
      prevBtn.addEventListener('click', prev);
      nextBtn.addEventListener('click', next);

      document.addEventListener('keydown', (e) => {
        if (!modal.classList.contains('is-active')) return;
        if (e.key === 'Escape') close();
        if (e.key === 'ArrowLeft') prev();
        if (e.key === 'ArrowRight') next();
      });
    }

    function update() {
      if (!currentImages.length) return;
      stageImg.style.opacity = '0.5';
      stageImg.src = currentImages[currentIndex];
      stageImg.onload = () => { stageImg.style.opacity = '1'; };
      stageImg.onerror = () => { stageImg.src = 'assets/images/placeholder.svg'; stageImg.style.opacity = '1'; };
      
      captionCounter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
      captionTitle.textContent = currentProjectName ? `${currentProjectName} (${currentIndex === 0 ? 'Cover Image' : 'Screenshot ' + currentIndex})` : '';

      prevBtn.style.display = currentImages.length > 1 ? 'flex' : 'none';
      nextBtn.style.display = currentImages.length > 1 ? 'flex' : 'none';
    }

    function open(images, index = 0, projectName = '') {
      createModal();
      currentImages = Array.isArray(images) ? images.filter(Boolean) : [images];
      if (!currentImages.length) return;
      currentIndex = (index >= 0 && index < currentImages.length) ? index : 0;
      currentProjectName = projectName;

      update();
      modal.classList.add('is-active');
      modal.setAttribute('aria-hidden', 'false');
      document.body.classList.add('lightbox-open');
    }

    function close() {
      if (!modal) return;
      modal.classList.remove('is-active');
      modal.setAttribute('aria-hidden', 'true');
      document.body.classList.remove('lightbox-open');
    }

    function prev() {
      if (currentImages.length <= 1) return;
      currentIndex = (currentIndex - 1 + currentImages.length) % currentImages.length;
      update();
    }

    function next() {
      if (currentImages.length <= 1) return;
      currentIndex = (currentIndex + 1) % currentImages.length;
      update();
    }

    return { open, close, prev, next };
  })();

  window.PortfolioLightbox = Lightbox;

  function populateProjectDetails() {
    const searchStr = window.location.search;
    const params = new URLSearchParams(searchStr);
    let slug = params.get('id');

    // Fallback: If URL search contains 'id=', extract full value before other params (handles unencoded '&' in name like ?id=AK Tours & Travels)
    if (searchStr.includes('id=')) {
      const match = searchStr.match(/[?&]id=([^&]*)/);
      if (match && match[1]) {
        slug = decodeURIComponent(match[1]);
      }
    }

    if (!slug) return;

    const projects = window.portfolioData?.projects || [];
    const project = projects.find(
      (entry) =>
        entry.name === slug ||
        entry.name.toLowerCase() === slug.toLowerCase() ||
        encodeURIComponent(entry.name) === slug
    );
    if (!project) return;

    document.title = `${project.name} | Portfolio`;
    document.getElementById('projectTitle').textContent = project.name;
    document.getElementById('projectTypeTag').textContent = project.type;
    document.getElementById('projectMeta').textContent = `${project.year} • ${project.technologies.join(' • ')}`;
    
    const allImages = [project.image, ...(project.gallery || [])].filter(Boolean);

    const heroImg = document.getElementById('heroImage');
    if (heroImg) {
      heroImg.src = project.image;
      heroImg.alt = `${project.name} preview`;
      heroImg.title = 'Click to view full screen gallery';
      heroImg.onerror = function() { this.onerror = null; this.src = 'assets/images/placeholder.svg'; };
      heroImg.addEventListener('click', () => {
        window.PortfolioLightbox.open(allImages, 0, project.name);
      });
    }

    document.getElementById('problemStatement').textContent = project.problemStatement;
    document.getElementById('fullDescription').textContent = project.fullDescription;
    document.getElementById('highlightsList').innerHTML = project.highlights.map((item) => `<li>${item}</li>`).join('');
    document.getElementById('detailTechChips').innerHTML = project.technologies.map((tech) => `<span class="chip">${tech}</span>`).join('');
    document.getElementById('skillsList').innerHTML = project.skills.map((skill) => `<li>${skill}</li>`).join('');
    document.getElementById('challengesText').textContent = project.challenges;
    document.getElementById('solutionText').textContent = project.solution;
    
    const galleryGrid = document.getElementById('galleryGrid');
    if (galleryGrid) {
      galleryGrid.innerHTML = (project.gallery || []).map((image, idx) => 
        `<img src="${image}" alt="${project.name} gallery screenshot ${idx + 1}" loading="lazy" data-index="${idx + 1}" title="Click to view full screen" onerror="this.onerror=null; this.src='assets/images/placeholder.svg';" />`
      ).join('');

      galleryGrid.addEventListener('click', (e) => {
        if (e.target.tagName === 'IMG') {
          const index = parseInt(e.target.getAttribute('data-index') || '1', 10);
          window.PortfolioLightbox.open(allImages, index, project.name);
        }
      });
    }

    const liveLink = document.getElementById('liveLink');
    const shareProjectBtn = document.getElementById('shareProjectBtn');

    if (liveLink) {
      liveLink.href = project.liveLink || '#';
      liveLink.style.display = project.liveLink ? 'inline-flex' : 'none';
    }

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
