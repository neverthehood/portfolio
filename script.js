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

    title.innerText = project.title;
    client.innerText = `Client: ${project.client}`;
    desc.innerText = project.desc || "";
    tags.innerHTML = project.tags ? project.tags.map(t => `<span>${t}</span>`).join('') : "";

    stack.innerHTML = "";
    if (project.gallery && project.gallery.length > 0) {
        project.gallery.forEach(imgName => {
            const img = document.createElement('img');
            img.src = `assets/portfolio/${imgName}`;
            img.loading = "lazy";
            stack.appendChild(img);
        });
    } else {
        const img = document.createElement('img');
        img.src = `assets/portfolio/${project.wideImg || project.storyImg}`;
        stack.appendChild(img);
    }

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

    title.innerText = project.title;
    client.innerText = `Client: ${project.client}`;
    desc.innerText = project.desc || "";
    tags.innerHTML = project.tags ? project.tags.map(t => `<span>${t}</span>`).join('') : "";

    stack.innerHTML = "";
    if (project.gallery && project.gallery.length > 0) {
        project.gallery.forEach(imgName => {
            const img = document.createElement('img');
            img.src = `assets/portfolio/${imgName}`;
            img.loading = "lazy";
            stack.appendChild(img);
        });
    } else {
        const img = document.createElement('img');
        img.src = `assets/portfolio/${project.wideImg || project.storyImg}`;
        stack.appendChild(img);
    }

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

    title.innerText = project.title;
    client.innerText = `Client: ${project.client}`;
    desc.innerText = project.desc || "";
    tags.innerHTML = project.tags ? project.tags.map(t => `<span>${t}</span>`).join('') : "";

    stack.innerHTML = "";
    if (project.gallery && project.gallery.length > 0) {
        project.gallery.forEach(imgName => {
            const img = document.createElement('img');
            img.src = `assets/portfolio/${imgName}`;
            img.loading = "lazy";
            stack.appendChild(img);
        });
    } else {
        const img = document.createElement('img');
        img.src = `assets/portfolio/${project.wideImg || project.storyImg}`;
        stack.appendChild(img);
    }

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
        const skillItems = card.querySelectorAll('.skill-item'); // Список пунктов
        const nextBtn = card.querySelector('.next');
        const prevBtn = card.querySelector('.prev');

        if (!mediaContainer) return;

        // ==========================================
        // 1. ЛОГИКА АККОРДЕОНА (ДОБАВЛЕНО)
        // ==========================================
        skillItems.forEach(item => {
            item.addEventListener('click', (e) => {
                // Если кликнули по уже активному — ничего не делаем
                if (item.classList.contains('active')) return;

                // Убираем active у всех соседей в этой карточке
                skillItems.forEach(si => si.classList.remove('active'));
                
                // Добавляем active текущему
                item.classList.add('active');
            });
        });

        let isHovered = false;
                let autoPlayTimeout;

                const stopAutoPlay = () => clearTimeout(autoPlayTimeout);

                // Функция запуска таймера (только для картинок)
                const scheduleNext = () => {
                    stopAutoPlay();
                    if (isHovered) return;

                    const len = dataForSlider[cat]?.length || 0;
                    if (len <= 1) return;

                    autoPlayTimeout = setTimeout(() => {
                        currentIndex = (currentIndex + 1) % len;
                        updateInnerContent();
                    }, 5000);
                };

                // Функция перелистывания на следующий слайд
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
                    
                    const oldMedia = mediaContainer.querySelector('.render-img, .render-video');
                    if (oldMedia) oldMedia.classList.add('is-switching');

                    // Останавливаем таймер перед сменой контента
                    stopAutoPlay();

                    setTimeout(() => {
                        mediaContainer.innerHTML = ''; 

                        const fileName = data.img;
                        const isVideo = fileName.toLowerCase().endsWith('.mp4');
                        const fullPath = fileName.includes('assets') ? fileName : rendersPath + fileName;

                        let newMedia;
                        if (isVideo) {
                            newMedia = document.createElement('video');
                            newMedia.src = fullPath;
                            newMedia.className = 'render-video is-switching';
                            newMedia.muted = true;
                            newMedia.autoplay = true;
                            newMedia.setAttribute('playsinline', '');
                            
                            // ВАЖНО: Убираем нативный loop, чтобы сработало событие onended
                            newMedia.loop = false; 
                            
                            // Как только видео доиграло до конца — листаем дальше или пускаем на повтор
                            newMedia.onended = () => {
                                if (!isHovered) {
                                    goNext(); // Листаем на следующий навык, если мышка ушла
                                } else {
                                    // Если пользователь держит курсор на карточке — крутим видео заново
                                    newMedia.currentTime = 0;
                                    newMedia.play().catch(e => console.log('Video loop retry error:', e));
                                }
                            };

                            newMedia.play().catch(e => {
                                console.log('Video play error:', e);
                                scheduleNext(); // Если видео заблокировалось браузером, включаем обычный таймер
                            });
                        } else {
                            newMedia = document.createElement('img');
                            newMedia.src = fullPath;
                            newMedia.className = 'render-img is-switching';
                            
                            // Если это картинка — запускаем стандартные 5 секунд отсчета
                            scheduleNext();
                        }

                        mediaContainer.appendChild(newMedia);

                        if (titleEl) titleEl.innerText = data.title || 'Untitled';
                        if (tagsEl && data.tags) {
                            tagsEl.innerHTML = data.tags.map(tag => `<span>${tag}</span>`).join('');
                        }

                        setTimeout(() => newMedia.classList.remove('is-switching'), 50);
                    }, 500);
                }

                // Обработка наведения мышки (пауза)
                card.addEventListener('mouseenter', () => {
                    isHovered = true;
                    stopAutoPlay();
                });
                
                card.addEventListener('mouseleave', () => {
                    isHovered = false;
                    const currentVideo = mediaContainer.querySelector('video');
                    if (currentVideo) {
                        // Если пока мы держали мышку, видео уже успело закончиться — листаем сейчас
                        if (currentVideo.ended) {
                            goNext();
                        }
                        // Иначе просто ждем — оно само перелистнется по событию onended
                    } else {
                        scheduleNext(); // Для картинок запускаем таймер заново
                    }
                });

                // Кнопки вперед/назад
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

                // Первичный запуск при загрузке
                updateInnerContent();

        updateInnerContent();
    });

    // Главный слайдер
    const servicesSwiper = new Swiper('.services-slider-wrap', {
        // Базовые настройки (применяются для мобильных устройств)
        slidesPerView: 'auto', 
        spaceBetween: 20,      // На мобилках поменьше, чтобы лучше смотрелось
        centeredSlides: true,  // Чтобы слайд был ровно по центру
        
        breakpoints: {
            // Когда ширина экрана >= 768px
            768: {
                slidesPerView: 1.4,
                spaceBetween: 30,
                centeredSlides: false // На десктопе обычно удобнее прижать к краю
            },
            // Когда ширина экрана >= 1320px
            1320: {
                slidesPerView: 1.2, 
                spaceBetween: 60,
                centeredSlides: false
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

// Запускаем всё одним вызовом
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
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

    // Проверка наличия контейнера для карточек[cite: 2]
    if (!list) {
        console.error("Ошибка: Элемент #portfolio-list не найден в HTML");
        return;
    }

    let portfolioLoop;

    function renderPortfolioSlider() {
        if (!pData || pData.length === 0) {
            console.warn("Данные портфолио пусты");
            list.innerHTML = "<p>Projects coming soon</p>";
            return;
        }

        // Рендерим слайды. Текст теперь внутри portfolio-card__meta, который будет наложен поверх.
        const renderSlide = (item) => `
            <div class="portfolio-slide">
                <div class="portfolio-card" data-id="${item.id}">
                    <div class="portfolio-card__img-box">
                        <img src="assets/portfolio/${item.wideImg || item.storyImg}" alt="${item.title}" class="portfolio-card__img" loading="lazy">
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

        const gap = 30;
        const narrowWidth = 340;
        const wideWidth = 720;
        const slider = document.querySelector('.portfolio-slider');
        const container = document.getElementById('portfolio-list');
        const originalSlidesCount = pData.length;

        if (!slider || !container || originalSlidesCount === 0) return;

        // Клонируем для бесконечности (3 набора: [клоны][оригиналы][клоны])
        container.innerHTML = [...pData, ...pData, ...pData].map(renderSlide).join('');
        
        const allSlides = gsap.utils.toArray(".portfolio-slide");
        let activeIndex = originalSlidesCount; // Начинаем с первого слайда среднего набора

        function updateSlider(animate = true) {
            const containerWidth = slider.offsetWidth;
            const centerOffset = containerWidth / 2;

            // 1. Всегда ставим активный слайд ровно по центру контейнера
            const activeX = centerOffset - (wideWidth / 2);

            // 2. Расставляем слайды
            allSlides.forEach((slide, i) => {
                const isActive = (i === activeIndex);
                const targetWidth = isActive ? wideWidth : narrowWidth;
                
                // Рассчитываем позицию x:
                // Если слайд активный — activeX
                // Если справа от активного — activeX + wideWidth + gap + (дистанция)
                // Если слева от активного — activeX - gap - narrowWidth - (дистанция)
                let xPos;
                if (i === activeIndex) {
                    xPos = activeX;
                } else if (i > activeIndex) {
                    xPos = activeX + (wideWidth / 2) + gap + (narrowWidth / 2) + ((i - activeIndex - 1) * (narrowWidth + gap));
                } else {
                    xPos = activeX - (narrowWidth / 2) - gap - (narrowWidth / 2) - ((activeIndex - i - 1) * (narrowWidth + gap));
                }

                gsap.to(slide, {
                    x: xPos,
                    width: targetWidth,
                    duration: animate ? 0.7 : 0,
                    ease: "power3.out",
                    overwrite: true,
                    onComplete: () => {
                        if (animate && (activeIndex >= originalSlidesCount * 2 || activeIndex < originalSlidesCount)) {
                             // Логика зацикливания остается прежней
                             if (activeIndex >= originalSlidesCount * 2) activeIndex -= originalSlidesCount;
                             else if (activeIndex < originalSlidesCount) activeIndex += originalSlidesCount;
                             updateSlider(false);
                        }
                    }
                });
                slide.classList.toggle('is-active', isActive);
            });
        }

        // Логика кликов
        allSlides.forEach((slide, i) => {
            slide.addEventListener('click', (e) => {
                if (activeIndex !== i) {
                    // Если слайд не активен - центрируем и делаем активным
                    activeIndex = i;
                    updateSlider();
                } else {
                    // Если уже активен - открываем кейс
                    const id = slide.querySelector('.portfolio-card').getAttribute('data-id');
                    openCase(id);
                }
            });
        });

        // Навигация кнопками
        document.querySelector('.portfolio-next')?.addEventListener('click', () => {
            activeIndex++;
            updateSlider();
        });

        document.querySelector('.portfolio-prev')?.addEventListener('click', () => {
            activeIndex--;
            updateSlider();
        });

        window.addEventListener('resize', () => updateSlider(false));
        updateSlider(false);
        setTimeout(() => slider.classList.add('is-ready'), 100);
    }

    try {
        const res = await fetch(portfolioUrl, { cache: 'no-store' });
        if (!res.ok) throw new Error("Не удалось загрузить portfolio.json");
        pData = await res.json();
        renderPortfolioSlider();
    } catch (e) {
        console.warn("Ошибка загрузки portfolio.json:", e.message);
        pData = [];
        renderPortfolioSlider();
    }
}

async function initTestimonials() {
    // Относительный путь к файлу [source: 2]
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
            company: 'Design Lead, Stellar Apps'
        }
    ];

    if (!list) return;

    try {
        let rData;

        // 1) Приоритет: данные из localStorage (по аналогии с другими секциями)
        const localReviews = localStorage.getItem('testimonials_db');
        if (localReviews) {
            rData = JSON.parse(localReviews);
        } else {
            // 2) Основной источник: JSON-файл проекта
            const res = await fetch(reviewsUrl);
            if (!res.ok) {
                throw new Error(`Не удалось найти файл по пути: ${reviewsUrl}`);
            }
            rData = await res.json();
        }

        // 3) Защита от пустых/битых данных
        if (!Array.isArray(rData) || rData.length === 0) {
            throw new Error('Массив отзывов пуст или имеет неверный формат');
        }

        // Очищаем и наполняем контейнер
        list.innerHTML = rData.map(item => `
            <div class="swiper-slide">
                <div class="review-item">
                    <p class="review-text">${item.text}</p>
                    <div class="review-author">${item.author}</div>
                    <div class="review-company">${item.company}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {
        // Если файл недоступен (например, file://), отображаем рабочий fallback
        console.warn('Ошибка загрузки testimonials.json, использую fallback:', e.message);
        list.innerHTML = fallbackTestimonials.map(item => `
            <div class="swiper-slide">
                <div class="review-item">
                    <p class="review-text">${item.text}</p>
                    <div class="review-author">${item.author}</div>
                    <div class="review-company">${item.company}</div>
                </div>
            </div>
        `).join('');
    }

    // Инициализируем слайдер после вставки HTML
    const swiperReviews = new Swiper('.reviews-swiper', {
        slidesPerView: 1,
        spaceBetween: 30,
        loop: true,
        speed: 800,
        autoplay: {
            delay: 5000,
            disableOnInteraction: false,
        },
        navigation: {
            nextEl: '.reviews-next',
            prevEl: '.reviews-prev',
        },
    });
}


// Запуск при загрузке страницы [source: 2]
