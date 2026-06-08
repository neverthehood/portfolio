// ===============================
// UI logic
// ===============================

const body = document.body;
const toggleBtns = Array.from(document.querySelectorAll('[data-action="toggle-form"]'));
const ctaText = document.querySelector('[data-cta-text]');
const chips = Array.from(document.querySelectorAll('button.chip'));
const form = document.querySelector('[data-contact-form]');
const hint = document.querySelector('[data-form-hint]');
const restartBtn = document.querySelector('[data-action="restart"]');
const navLinks = Array.from(document.querySelectorAll('.site-nav__link'));

// Mobile menu toggle
function initMobileMenu() {
  const menuToggle = document.querySelector('[data-action="toggle-menu"]');
  const siteNav = document.querySelector('.site-nav');

  if (menuToggle && siteNav) {
    menuToggle.addEventListener('click', (e) => {
      e.preventDefault();
      menuToggle.classList.toggle('is-active');
      siteNav.classList.toggle('site-nav--active');
      
      if (siteNav.classList.contains('site-nav--active')) {
        body.style.overflow = 'hidden';
      } else {
        body.style.overflow = '';
      }
    });

    // Close menu on link click
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        menuToggle.classList.remove('is-active');
        siteNav.classList.remove('site-nav--active');
        body.style.overflow = '';
      });
    });

    // Connect button in mobile menu
    const mobileConnectBtn = siteNav.querySelector('.cta');
    if (mobileConnectBtn) {
      mobileConnectBtn.addEventListener('click', () => {
        menuToggle.classList.remove('is-active');
        siteNav.classList.remove('site-nav--active');
        body.style.overflow = '';
        setMode('form');
      });
    }
  }
}

let activeInterest = [];
let pData = [];

// ===============================
// MODE SWITCHING
// ===============================

function setMode(mode){
  body.classList.remove('mode-home', 'mode-form', 'mode-success');
  body.classList.add(`mode-${mode}`);

  if (mode === 'form'){
    toggleBtns.forEach(btn => btn.setAttribute('aria-expanded', 'true'));
    if (ctaText) ctaText.textContent = 'Back to home';
  }

  if (mode === 'home'){
    toggleBtns.forEach(btn => btn.setAttribute('aria-expanded', 'false'));
    if (ctaText) ctaText.textContent = "Let's connect";
  }
}

function goHome(){
  activeInterest = [];
  chips.forEach(c => c.classList.remove('is-active'));
  setMode('home');

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'smooth'
  });
}

function showSuccess(){
  setMode('success');

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}

function resetUI(){
  if (form) form.reset();
  goHome();
}


// ===============================
// EVENTS
// ===============================

toggleBtns.forEach((toggleBtn) => {
  toggleBtn.addEventListener('click', () => {
    if (body.classList.contains('mode-success')){
      goHome();
      return;
    }

    const isForm = body.classList.contains('mode-form');

    if (isForm){
      goHome();
    } else {
      setMode('form');
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // GA4: form opened
      if (typeof gtag === 'function') {
        gtag('event', 'form_open', {
          event_category: 'engagement'
        });
      }
    }
  });
});

chips.forEach((btn) => {
  btn.addEventListener('click', () => {
    if (!body.classList.contains('mode-form')) setMode('form');
    toggleInterest(btn);
  });
});

if (restartBtn){
  restartBtn.addEventListener('click', resetUI);
}

const homeBtns = document.querySelectorAll('[data-action="go-home"]');

homeBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    goHome();
  });
});

navLinks.forEach((link) => {
  link.addEventListener('click', () => {
    navLinks.forEach(item => item.classList.remove('site-nav__link--active'));
    link.classList.add('site-nav__link--active');
  });
});

const navSections = navLinks
  .map((link) => document.querySelector(link.getAttribute('href')))
  .filter(Boolean);

if ('IntersectionObserver' in window && navSections.length){
  const sectionObserver = new IntersectionObserver((entries) => {
    const visible = entries
      .filter(entry => entry.isIntersecting)
      .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

    if (!visible) return;

    const activeLink = navLinks.find(link => link.getAttribute('href') === `#${visible.target.id}`);
    if (!activeLink) return;

    navLinks.forEach(link => link.classList.remove('site-nav__link--active'));
    activeLink.classList.add('site-nav__link--active');
  }, {
    rootMargin: '-35% 0px -55% 0px',
    threshold: [0, .2, .5, .8]
  });

  navSections.forEach(section => sectionObserver.observe(section));
}


// ===============================
// INTEREST LOGIC
// ===============================

function toggleInterest(btn){
  const val = btn.getAttribute('data-interest') || btn.textContent.trim();
  const isActive = btn.classList.contains('is-active');

  btn.classList.toggle('is-active');

  if (isActive){
    activeInterest = activeInterest.filter(i => i !== val);
  } else {
    activeInterest.push(val);
  }
}

// ===============================
// CASE VIEWER (LIGHTBOX)
// ===============================

function openCase(id) {
    const project = pData.find(p => p.id === id);
    if (!project) return;

    const viewer = document.getElementById('case-viewer');
    const title = document.getElementById('case-title');
    const client = document.getElementById('case-client');
    const desc = document.getElementById('case-desc');
    const tags = document.getElementById('case-tags');
    const stack = document.getElementById('case-images-stack');

    if (!viewer) return;

    // Заполняем текст до того, как покажем viewer
    title.innerText = project.title;
    client.innerText = `Client: ${project.client}`;
    desc.innerText = project.desc || "";
    tags.innerHTML = project.tags ? project.tags.map(t => `<span>${t}</span>`).join('') : "";

    // Reset scroll position
    viewer.scrollTop = 0;

    // Строим изображения (сначала пустой контейнер, чтобы не прыгало)
    stack.innerHTML = '<div class="case-images-stack__loader" style="height:1px;"></div>';

    // Создаём первое изображение с уже установленной шириной/высотой
    const images = project.gallery && project.gallery.length > 0 ? project.gallery : [project.wideImg || project.storyImg];
    
    // Предзагружаем первое изображение
    const preloadImg = new Image();
    preloadImg.onload = () => {
        // Когда первое изображение загружено — показываем viewer и вставляем картинки
        stack.innerHTML = '';
        images.forEach(imgName => {
            const img = document.createElement('img');
            img.src = `assets/portfolio/${imgName}`;
            img.loading = "lazy";
            img.style.width = '100%';
            img.style.display = 'block';
            img.style.height = 'auto';
            stack.appendChild(img);
        });
    };
    preloadImg.src = `assets/portfolio/${images[0]}`;

    // Показываем viewer (с плавным появлением через CSS opacity transition)
    viewer.classList.add('is-active');
    document.body.style.overflow = 'hidden';
}

function closeCase() {
    const viewer = document.getElementById('case-viewer');
    if (viewer) {
        viewer.classList.remove('is-active');
        document.body.style.overflow = '';
    }
}


// ===============================
// FORM SUBMIT
// ===============================

if (form){
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const data = new FormData(form);
    const payload = Object.fromEntries(data.entries());
    payload.interest = activeInterest;

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const raw = await res.text();
      console.log('[contact] status:', res.status, raw);

      if (res.ok){

        // GA4: successful lead
        if (typeof gtag === 'function') {
          gtag('event', 'generate_lead', {
            event_category: 'contact',
            event_label: 'contact_form'
          });
        }

        showSuccess();
      } else {
        alert(raw || 'Something went wrong. Please try again.');
      }

    } catch (err) {
      console.error('[contact] network error:', err);
      alert('Network error. Please try again.');
    }
  });
}


// ===============================
// COOKIE CONSENT + GA LOAD
// ===============================

(function(){

  const cookieBanner = document.getElementById('cookieBanner');
  if (!cookieBanner) return;

  const cookieAccept = document.getElementById('cookieAccept');
  const cookieDecline = document.getElementById('cookieDecline');

  function loadGA(){
    const script = document.createElement('script');
    script.src = "https://www.googletagmanager.com/gtag/js?id=G-NX7RHVLFQX";
    script.async = true;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    window.gtag = function(){dataLayer.push(arguments);};

    gtag('js', new Date());
    gtag('config', 'G-NX7RHVLFQX');
  }

  const consent = localStorage.getItem('cookieConsent');

  if (consent === 'true') {
    loadGA();
    return;
  }

  if (consent === 'declined') {
    return;
  }

  const EU = [
    "AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR",
    "HU","IE","IT","LV","LT","LU","MT","NL","PL","PT","RO",
    "SK","SI","ES","SE","IS","LI","NO","GB","CH"
  ];

  const country = document
    .querySelector('meta[name="user-country"]')
    ?.content;

  const shouldShowBanner = !country || EU.includes(country);
  if (shouldShowBanner) {
    cookieBanner.style.display = 'flex';
  } else {
    loadGA();
  }

  cookieAccept?.addEventListener('click', () => {
    localStorage.setItem('cookieConsent','true');
    cookieBanner.style.display = 'none';
    loadGA();
  });

  cookieDecline?.addEventListener('click', () => {
    localStorage.setItem('cookieConsent','declined');
    cookieBanner.style.display = 'none';
  });

})();


// ===============================
// CONTACT CLICK TRACKING
// ===============================

const waLinks = document.querySelectorAll('a[href*="wa.me"]');
waLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (typeof gtag === 'function') {
      gtag('event', 'contact_click', {
        event_category: 'engagement',
        event_label: 'whatsapp'
      });
    }
  });
});

const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
emailLinks.forEach(link => {
  link.addEventListener('click', () => {
    if (typeof gtag === 'function') {
      gtag('event', 'contact_click', {
        event_category: 'engagement',
        event_label: 'email'
      });
    }
  });
});



setMode('home');


// ===============================
// SERVICES DATA & LOGIC
// ===============================

const servicesContent = {
    graphic: [{ img: 'Render_3.png', title: 'Skinz Visual System', tags: ['Branding', 'UI'] }],
    web: [{ img: 'Render_2.png', title: 'Roger United', tags: ['Deck design', 'Marketing Assets'] }],
    threeD: [{ img: 'Render_1.png', title: 'Dog Paradise', tags: ['3D Assets'] }],
    motion: [{ img: 'Render_4.png', title: 'Mushroom Genetics', tags: ['Branding', 'Packaging'] }]
};

async function initServices() {
    const rendersPath = 'assets/renders/';
    const dataUrl = './assets/data/services.json';
    let dataForSlider;

    try {
        const localData = localStorage.getItem('onemotion_db');
        if (localData) {
            dataForSlider = JSON.parse(localData);
        } else {
            const response = await fetch(dataUrl);
            if (!response.ok) throw new Error('File not found');
            dataForSlider = await response.json();
        }
    } catch (err) {
        console.warn("Using fallback services data:", err);
        dataForSlider = servicesContent;
    }

    document.querySelectorAll('.service-card').forEach(card => {
        const cat = card.dataset.cat;
        let currentIndex = 0;
        
        const mediaContainer = card.querySelector('.render-media-container');
        const titleEl = card.querySelector('[data-project-title]');
        const tagsEl = card.querySelector('[data-project-tags]');
        const skillItems = card.querySelectorAll('.skill-item'); // List of items
        const nextBtn = card.querySelector('.next');
        const prevBtn = card.querySelector('.prev');

        if (!mediaContainer) return;

        // Создаём flex-контейнер для всех слайдов (как в work/portfolio.js)
        let slidesWrap = mediaContainer.querySelector('.render-slides-wrap');
        if (!slidesWrap) {
            slidesWrap = document.createElement('div');
            slidesWrap.className = 'render-slides-wrap';
            mediaContainer.appendChild(slidesWrap);
        }

        // Заполняем все слайды из данных
        const categoryData = dataForSlider[cat];
        if (categoryData && categoryData.length > 0) {
            slidesWrap.innerHTML = '';
            categoryData.forEach((item, idx) => {
                const fileName = item.img;
                const isVideo = fileName.toLowerCase().endsWith('.mp4');
                const fullPath = fileName.includes('assets') ? fileName : rendersPath + fileName;
                
                let el;
                if (isVideo) {
                    el = document.createElement('video');
                    el.src = fullPath;
                    el.muted = true;
                    el.loop = true;
                    el.autoplay = idx === 0;
                    el.setAttribute('playsinline', '');
                    el.className = 'render-slide';
                    // Если не первый слайд — ставим на паузу сразу после создания
                    if (idx !== 0) {
                        el.pause();
                    }
                } else {
                    el = document.createElement('img');
                    el.src = fullPath;
                    el.className = 'render-slide';
                    el.loading = 'lazy';
                }
                slidesWrap.appendChild(el);
            });
            // Устанавливаем начальную позицию
            slidesWrap.style.transform = 'translateX(0)';
            
            // Явно запускаем первое видео, если оно есть
            const firstVideo = slidesWrap.querySelector('video');
            if (firstVideo) {
                firstVideo.play().catch(e => console.log('Initial video play error:', e));
            }
        }

        // ==========================================
        // 1. ACCORDION LOGIC
        // ==========================================
        skillItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // If already active — do nothing
                if (item.classList.contains('active')) return;

                // Remove active from all siblings in this card
                skillItems.forEach(si => si.classList.remove('active'));
                
                // Add active to current
                item.classList.add('active');
            });
        });

        let isHovered = false;
                let autoPlayTimeout;

                const stopAutoPlay = () => clearTimeout(autoPlayTimeout);

                // Start timer function (for images only)
                const scheduleNext = () => {
                    stopAutoPlay();
                    if (isHovered) return;

                    const len = dataForSlider[cat]?.length || 0;
                    if (len <= 1) return;

                    autoPlayTimeout = setTimeout(() => {
                        currentIndex = (currentIndex + 1) % len;
                        updateInnerContent();
                    }, 6000);
                };

                // Go to next slide function
                const goNext = () => {
                    const len = dataForSlider[cat]?.length || 0;
                    if (len > 1) {
                        currentIndex = (currentIndex + 1) % len;
                        updateInnerContent();
                    }
                };

                function updateInnerContent() {
                    const categoryData = dataForSlider[cat];
                    if (!categoryData || categoryData.length === 0) return;

                    const data = categoryData[currentIndex];
                    
                    // Stop timer before changing content
                    stopAutoPlay();

                    // Сдвигаем весь контейнер со слайдами
                    if (slidesWrap) {
                        slidesWrap.style.transform = `translateX(-${currentIndex * 100}%)`;
                    }

                    if (titleEl) titleEl.innerText = data.title || 'Untitled';
                    if (tagsEl && data.tags) {
                        tagsEl.innerHTML = data.tags.map(tag => `<span>${tag}</span>`).join('');
                    }

                    // Показываем/скрываем автоплей видео
                    const allSlides = slidesWrap?.children;
                    if (allSlides) {
                        const slides = Array.from(allSlides);
                        slides.forEach((slide, i) => {
                            if (slide.tagName === 'VIDEO') {
                                if (i === currentIndex) {
                                    slide.play().catch(() => {});
                                } else {
                                    slide.pause();
                                }
                            }
                        });
                    }

                    // Если изображение — запускаем таймер
                    const fileName = data.img;
                    const isVideo = fileName.toLowerCase().endsWith('.mp4');
                    if (!isVideo) {
                        scheduleNext();
                    }
                }

                // Mouse hover handling (pause)
                card.addEventListener('mouseenter', () => {
                    isHovered = true;
                    stopAutoPlay();
                });
                
                card.addEventListener('mouseleave', () => {
                    isHovered = false;
                    const currentVideo = mediaContainer.querySelector('video');
                    if (currentVideo) {
                        // If video ended while mouse was over — go next now
                        if (currentVideo.ended) {
                            goNext();
                        }
                        // Otherwise just wait — it will flip on onended event
                    } else {
                        scheduleNext(); // For images start timer again
                    }
                });

                // Клик по медиа-контенту → следующий слайд
                mediaContainer.addEventListener('click', (e) => {
                    // Не срабатывать, если клик по кнопкам
                    if (e.target.closest('.nav-btn')) return;
                    e.stopPropagation();
                    goNext();
                });

                // Next/Prev buttons
                nextBtn?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    goNext();
                });

                prevBtn?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const len = dataForSlider[cat]?.length || 1;
                    currentIndex = (currentIndex - 1 + len) % len;
                    updateInnerContent();
                });

                // Initial run on load
                updateInnerContent();

        updateInnerContent();
    });

    // Main slider
    const servicesSwiper = new Swiper('.services-slider-wrap', {
        // Base settings (apply to mobile devices)
        slidesPerView: 'auto', 
        spaceBetween: 20,      // Smaller on mobile for better look
        centeredSlides: true,  // To center the slide exactly
        
        navigation: {
            nextEl: '.swiper-next',
            prevEl: '.swiper-prev',
        },

        on: {
            init: function (swiper) {
                const counter = document.getElementById('services-counter');
                if (counter) {
                    counter.textContent = `1/${swiper.slides.length}`;
                }
            },
            slideChange: function (swiper) {
                const counter = document.getElementById('services-counter');
                if (counter) {
                    counter.textContent = `${swiper.realIndex + 1}/${swiper.slides.length}`;
                }
            }
        },
        
        breakpoints: {
            // Screen width >= 768px
            768: {
                slidesPerView: 'auto',
                spaceBetween: 30,
                centeredSlides: false, // Desktop usually better aligned to edge
                slidesOffsetAfter: 100 // Add offset after last slide on tablets
            },
            // Screen width >= 1320px
            1320: {
                slidesPerView: 'auto', 
                spaceBetween: 30, // Tighter gap
                centeredSlides: false,
                slidesOffsetAfter: 200 // Right padding for last slide so it doesn't touch screen edge
            }
        }
    });

    function updateCounter(swiper) {
        const counterEl = document.getElementById('services-counter');
        if (counterEl) {
            const current = swiper.realIndex + 1;
            const total = swiper.slides.length;
            counterEl.innerText = `${current}/${total}`;
        }
    }
}

function initHeaderScroll() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  let lastScrollY = window.scrollY;
  const scrollThreshold = 120; // Distance to scroll down before hiding

  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    // 1. BACKGROUND CONTROL: Glass effect when scrolled > 10px
    if (currentScrollY > 10) {
      topbar.classList.add('topbar--scrolled');
    } else {
      topbar.classList.remove('topbar--scrolled');
    }

    // 2. HIDE/SHOW LOGIC
    // Don't hide header if mobile menu is open
    const isMenuOpen = document.querySelector('.site-nav--active');
    
    if (!isMenuOpen) {
      if (currentScrollY > lastScrollY && currentScrollY > scrollThreshold) {
        // Scrolling DOWN
        topbar.classList.add('topbar--hidden');
      } else if (currentScrollY < lastScrollY) {
        // Scrolling UP
        topbar.classList.remove('topbar--hidden');
      }
    }

    lastScrollY = currentScrollY;
  }, { passive: true });
}

// Start everything with one call
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initHeaderScroll();
    initServices();
    initPortfolio();
    initTestimonials();

    // Lightbox management: Close events
    document.getElementById('case-close')?.addEventListener('click', closeCase);
    document.getElementById('case-viewer')?.addEventListener('click', (e) => {
        if (e.target.id === 'case-viewer') closeCase();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeCase();
    });
});


async function initPortfolio() {
    const portfolioUrl = './assets/data/portfolio.json';
    const list = document.getElementById('portfolio-list');

    // Check for card container presence
    if (!list) {
        console.error("Error: Element #portfolio-list not found in HTML");
        return;
    }

    let portfolioLoop;

    function renderPortfolioSlider() {
        if (!pData || pData.length === 0) {
            console.warn("Portfolio data is empty");
            list.innerHTML = "<p>Projects coming soon</p>";
            return;
        }

        // Render slides. Text is now inside portfolio-card__meta, which will be overlaid.
        const renderSlide = (item, idx) => {
            // First slide of middle set (index === originalSlidesCount) starts as active → use wideImg
            // All other slides start as storyImg (narrow)
            const isActiveSlide = idx === originalSlidesCount;
            const initialImg = isActiveSlide ? (item.wideImg || item.storyImg) : (item.storyImg || item.wideImg);
            
            return `
                <div class="portfolio-slide">
                    <div class="portfolio-card" data-id="${item.id}">
                        <div class="portfolio-card__img-box">
                            <img src="assets/portfolio/${initialImg}" alt="${item.title}" class="portfolio-card__img" loading="lazy">
                        </div>
                        <div class="portfolio-card__meta">
                            <span class="p-client">${item.client}</span>
                            <h3 class="p-title">${item.title}</h3>
                            <p class="p-desc">${item.desc || ''}</p>
                            <div class="p-tags">
                                ${item.tags ? item.tags.map(t => `<span>${t}</span>`).join('') : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;
        };

        const isMobile = window.innerWidth <= 900;
        const gap = isMobile ? 16 : 30;
        const narrowWidth = isMobile ? 280 : 340;
        const wideWidth = isMobile ? 320 : 720;
        const slider = document.querySelector('.portfolio-slider');
        const container = document.getElementById('portfolio-list');
        const originalSlidesCount = pData.length;

        if (!slider || !container || originalSlidesCount === 0) return;

        // Clone for infinity (3 sets: [clones][originals][clones])
        container.innerHTML = [...pData, ...pData, ...pData].map((item, idx) => renderSlide(item, idx)).join('');
        
        const allSlides = gsap.utils.toArray(".portfolio-slide");
        
        // Remove any duplicate images left from previous crossfade logic
        document.querySelectorAll('.portfolio-card__img-box').forEach(box => {
            const imgs = box.querySelectorAll('.portfolio-card__img');
            if (imgs.length > 1) {
                // Keep only the last one (should be the correct one)
                for (let i = 0; i < imgs.length - 1; i++) {
                    imgs[i].remove();
                }
            }
        });
        
        // Force-clear any stale inline width so GSAP can set it fresh
        allSlides.forEach(s => {
            s.style.width = '';
        });
        let activeIndex = originalSlidesCount; // Start with first slide of middle set
        let isAnimating = false;
        let touchHandled = false;

        /**
         * Crossfade image inside a card's img-box.
         * If `fade` is true → fade-out, swap, fade-in (used for active slide).
         * If `fade` is false → instant swap with no visual transition (used for inactive slides).
         */
        function crossfadeCardImage(imgBox, newSrc, fade = false) {
            if (!imgBox) return;
            let img = imgBox.querySelector('.portfolio-card__img');
            if (!img) return;

            const currentSrc = img.src.split('/').pop();
            if (currentSrc === newSrc) return;

            if (fade) {
                // Fade-out → swap → fade-in (used for active slide)
                img.style.transition = 'opacity 0.2s ease';
                img.style.opacity = '0';
                setTimeout(() => {
                    img.src = `assets/portfolio/${newSrc}`;
                    img.style.opacity = '1';
                    setTimeout(() => { img.style.transition = ''; }, 250);
                }, 200);
            } else {
                // Instant swap with NO fade (used for inactive slides)
                const prevTransition = img.style.transition;
                img.style.transition = 'none';
                img.src = `assets/portfolio/${newSrc}`;
                // Force reflow so the src change applies immediately
                void img.offsetHeight;
                img.style.transition = prevTransition;
            }
        }

        function updateSlider(animate = true) {
            // Prevent overlapping updates during animation
            if (isAnimating && animate) return;
            
            const isMobileNow = window.innerWidth <= 900;
            const currentWideWidth = isMobileNow ? 320 : 720;
            const currentNarrowWidth = isMobileNow ? 280 : 340;
            const currentGap = isMobileNow ? 16 : 30;

            const sliderRect = slider.getBoundingClientRect();
            const sliderWidth = sliderRect.width;
            const centerOffset = sliderWidth / 2;

            // 1. Center active slide exactly
            const activeX = centerOffset - (currentWideWidth / 2);

            // 2. Position function
            const animateTo = (el, xPos, width) => {
                if (animate) {
                    gsap.to(el, { 
                        x: xPos, 
                        width: width, 
                        duration: 0.9, 
                        ease: "power4.out", 
                        overwrite: 'auto'
                    });
                } else {
                    gsap.set(el, { x: xPos, width: width });
                }
            };

            if (animate) isAnimating = true;

            // 3. Active slide animation
            animateTo(allSlides[activeIndex], activeX, currentWideWidth);
            allSlides[activeIndex].classList.add('is-active');

            // Crossfade image for active slide — swap WITH fade (smooth glow-up)
            const activeSlide = allSlides[activeIndex];
            const activeImgBox = activeSlide.querySelector('.portfolio-card__img-box');
            const activeProject = pData.find(p => p.id === activeSlide.querySelector('.portfolio-card').dataset.id);
            if (activeProject) {
                const targetSrc = isMobileNow ? (activeProject.storyImg || activeProject.wideImg) : (activeProject.wideImg || activeProject.storyImg);
                crossfadeCardImage(activeImgBox, targetSrc, true);
            }

            // 4. Position neighbors to the left — swap to storyImg INSTANTLY (no fade, no blink)
            let leftX = activeX - currentGap - currentNarrowWidth;
            for (let i = activeIndex - 1; i >= 0; i--) {
                animateTo(allSlides[i], leftX, currentNarrowWidth);
                allSlides[i].classList.remove('is-active');
                
                const lProject = pData.find(p => p.id === allSlides[i].querySelector('.portfolio-card').dataset.id);
                if (lProject) {
                    const targetSrc = lProject.storyImg || lProject.wideImg;
                    const lImgBox = allSlides[i].querySelector('.portfolio-card__img-box');
                    crossfadeCardImage(lImgBox, targetSrc, false);
                }
                
                leftX -= (currentNarrowWidth + currentGap);
            }

            // 5. Position neighbors to the right — swap to storyImg INSTANTLY (no fade, no blink)
            let rightX = activeX + currentWideWidth + currentGap;
            for (let i = activeIndex + 1; i < allSlides.length; i++) {
                animateTo(allSlides[i], rightX, currentNarrowWidth);
                allSlides[i].classList.remove('is-active');

                const rProject = pData.find(p => p.id === allSlides[i].querySelector('.portfolio-card').dataset.id);
                if (rProject) {
                    const targetSrc = rProject.storyImg || rProject.wideImg;
                    const rImgBox = allSlides[i].querySelector('.portfolio-card__img-box');
                    crossfadeCardImage(rImgBox, targetSrc, false);
                }

                rightX += (currentNarrowWidth + currentGap);
            }

            // 6. Seamless looping — reset BEFORE the next animation starts
            if (animate) {
                const animDuration = 900;
                setTimeout(() => { isAnimating = false; }, animDuration);
                
                if (activeIndex >= originalSlidesCount * 2 - 1) {
                    setTimeout(() => { 
                        activeIndex -= originalSlidesCount; 
                        updateSlider(false); 
                    }, animDuration);
                } else if (activeIndex <= 1 && activeIndex < originalSlidesCount) {
                    setTimeout(() => { 
                        activeIndex += originalSlidesCount; 
                        updateSlider(false); 
                    }, animDuration);
                }
            } else {
                isAnimating = false;
            }
        }

        // Click logic
        allSlides.forEach((slide, i) => {
            slide.addEventListener('click', (e) => {
                if (isAnimating) return;
                if (activeIndex !== i) {
                    // If slide is not active - center and make active
                    activeIndex = i;
                    updateSlider();
                } else {
                    // If already active - open case
                    const id = slide.querySelector('.portfolio-card').getAttribute('data-id');
                    openCase(id);
                }
            });
        });

        // Button navigation
        document.querySelector('.portfolio-next')?.addEventListener('click', () => {
            if (isAnimating) return;
            activeIndex++;
            updateSlider();
        });

        document.querySelector('.portfolio-prev')?.addEventListener('click', () => {
            if (isAnimating) return;
            activeIndex--;
            updateSlider();
        });

        // Swipe support on mobile
        let touchStartX = 0;
        let touchEndX = 0;

        slider.addEventListener('touchstart', e => {
            touchStartX = e.changedTouches[0].screenX;
            touchHandled = false;
        }, { passive: true });

        slider.addEventListener('touchend', e => {
            if (touchHandled || isAnimating) return;
            touchEndX = e.changedTouches[0].screenX;
            const diff = touchStartX - touchEndX;
            const threshold = 50;

            if (Math.abs(diff) > threshold) {
                touchHandled = true;
                if (diff > 0) {
                    // Swipe left -> next slide
                    activeIndex++;
                } else { 
                    // Swipe right -> prev slide
                    activeIndex--;
                }
                updateSlider();
            }
        }, { passive: true });

        // Debounced resize to avoid rapid recalculations
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => updateSlider(false), 150);
        });
        
        updateSlider(false);
        setTimeout(() => slider.classList.add('is-ready'), 100);
    }

    try {
        const res = await fetch(portfolioUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error("Failed to load portfolio.json");
        pData = await res.json();
        renderPortfolioSlider();
    } catch (e) {
        console.warn("Error loading portfolio.json:", e.message);
        pData = [];
        renderPortfolioSlider();
    }
}

async function initTestimonials() {
    // Relative path to file
    const reviewsUrl = './assets/data/testimonials.json';
    const list = document.getElementById('reviews-list');
    const fallbackTestimonials = [
        {
            text: 'One Motion delivered a system that scaled across our entire product in weeks, not months. Their attention to technical detail is unmatched.',
            author: 'Sarah Jenkins',
            company: 'CEO, Nexus Tech'
        },
        {
            text: "The 3D assets and web experience they created helped us close our Series A funding. They don't just design; they understand the business.",
            author: 'Michael Vance',
            company: 'Founder, AeroMotion'
        },
        {
            text: 'Clean code, structured process, and a very clear communication. It is rare to find a studio that handles both high-end design and complex dev so smoothly.',
            author: 'Elena Rodriguez',
            company: 'Product Manager, FinFlow'
        },
        {
            text: 'Working with One Motion felt like an extension of our own team. They took our vague ideas and turned them into a sharp, functional digital identity.',
            author: 'David Chen',
            company: 'Design Lead, Bloom'
        }
    ];

    async function loadReviews() {
        try {
            // 1) Priority: data from localStorage (similar to other sections)
            const localData = localStorage.getItem('onemotion_reviews');
            let reviewsData;

            if (localData) {
                reviewsData = JSON.parse(localData);
            } else {
                // 2) Main source: project JSON file
                const res = await fetch(reviewsUrl);
                if (!res.ok) {
                    throw new Error(`Could not find file at path: ${reviewsUrl}`);
                }
                reviewsData = await res.json();
            }

            // 3) Protection against empty/broken data
            if (!Array.isArray(reviewsData) || reviewsData.length === 0) {
                throw new Error('Reviews array is empty or has invalid format');
            }

            // Clear and fill container
            renderReviews(reviewsData);

        } catch (e) {
            // If file is unavailable (e.g., file://), show working fallback
            console.warn('Error loading testimonials.json, using fallback:', e.message);
            renderReviews(fallbackTestimonials);
        }
    }

    function renderReviews(data) {
        if (!list) return;
        list.innerHTML = data.map(item => `
            <div class="swiper-slide">
                <div class="review-item">
                    <p class="review-text">"${item.text}"</p>
                    <p class="review-author">${item.author}</p>
                    <p class="review-company">${item.company}</p>
                </div>
            </div>
        `).join('');

        // Initialize slider after inserting HTML
        new Swiper('.reviews-swiper', {
            slidesPerView: 1,
            spaceBetween: 30,
            loop: true,
            pagination: {
                el: '.reviews-pagination',
                clickable: true
            },
            navigation: {
                nextEl: '.reviews-next',
                prevEl: '.reviews-prev',
            },
            autoplay: {
                delay: 6000,
                disableOnInteraction: false
            }
        });
    }

    loadReviews();
}

// Start on page load
