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
document.addEventListener('DOMContentLoaded', () => {
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
});

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
        slidesPerView: 'auto',
        spaceBetween: 30,
        navigation: { nextEl: '.swiper-next', prevEl: '.swiper-prev' },
        breakpoints: {
            320: { spaceBetween: 16, slidesOffsetAfter: 20 },
            1024: { spaceBetween: 30, slidesOffsetAfter: 500 }
        },
        on: {
            init: function () {
                updateCounter(this);
            },
            slideChange: function () {
                updateCounter(this);
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
    initServices();
});


async function initPortfolio() {
    const portfolioUrl = './assets/data/portfolio.json';
    const list = document.getElementById('portfolio-list');

    // Проверка наличия контейнера для карточек[cite: 2]
    if (!list) {
        console.error("Ошибка: Элемент #portfolio-list не найден в HTML");
        return;
    }

    function renderPortfolioSlider() {
        if (!pData || pData.length === 0) {
            console.warn("Данные портфолио пусты");
            list.innerHTML = "<p>Projects coming soon</p>";
            return;
        }

        const copies = 5;
        const centerCopyIndex = 2;
        const n = pData.length;
        const slidesData = Array.from({ length: n * copies }, (_, i) => pData[i % n]);

        list.innerHTML = slidesData.map(item => `
            <div class="swiper-slide">
                <div class="portfolio-card" onclick="openCase('${item.id}')" style="cursor: pointer;">
                    <div class="portfolio-card__img-box">
                        <img src="assets/portfolio/${item.storyImg}" alt="" aria-hidden="true" class="p-img p-img--narrow" loading="lazy">
                        <img src="assets/portfolio/${item.wideImg}" alt="${item.title}" class="p-img p-img--wide" loading="lazy">
                    </div>
                    <div class="portfolio-card__meta">
                        <h3 class="p-title">${item.title}</h3>
                        <span class="p-client">Client: ${item.client}</span>
                        <div class="p-desc-wrap">
                            <p class="p-desc">
                                <span class="p-desc-text">${item.desc || ''}</span>
                            </p>
                        </div>
                        <div class="p-tags">
                            ${item.tags ? item.tags.map(t => `<span>${t}</span>`).join('') : ''}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');

        const sliderEl = document.querySelector('.portfolio-slider');
        if (!sliderEl) return;

        if (sliderEl.swiper) sliderEl.swiper.destroy(true, true);

        const initialRealIndex = 0;
        const initialSlide = n > 0 ? (centerCopyIndex * n) + initialRealIndex : 0;

        const swiper = new Swiper(sliderEl, {
            slidesPerView: 'auto',
            centeredSlides: true,
            loop: false,
            slidesPerGroup: 1,
            spaceBetween: 30,
            grabCursor: true,
            watchSlidesProgress: true,
            slideToClickedSlide: true,
            initialSlide,
            speed: 900,
            roundLengths: true,

            navigation: {
                nextEl: '.portfolio-next',
                prevEl: '.portfolio-prev',
            },

            breakpoints: {
                0: { slidesOffsetBefore: 0, slidesOffsetAfter: 0 },
                1024: { slidesOffsetBefore: 0, slidesOffsetAfter: 0 }
            },

            on: {
                init: function() {
                    requestAnimationFrame(() => sliderEl.classList.add('is-ready'));
                },
                slideChangeTransitionEnd: function() {
                    if (n <= 1) return;

                    const activeIndex = this.activeIndex;
                    const leftThreshold = n;
                    const rightThreshold = (n * copies) - n;

                    if (activeIndex >= leftThreshold && activeIndex < rightThreshold) return;

                    const realIndex = ((activeIndex % n) + n) % n;
                    const targetIndex = (centerCopyIndex * n) + realIndex;

                    sliderEl.classList.add('is-jump');
                    this.setTransition(0);
                    this.slideTo(targetIndex, 0, false);
                    this.updateSlidesClasses();
                    this.updateProgress();
                    this.setTransition(this.params.speed);

                    requestAnimationFrame(() => {
                        requestAnimationFrame(() => sliderEl.classList.remove('is-jump'));
                    });
                }
            }
        });
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

document.addEventListener('DOMContentLoaded', initPortfolio);

/**
 * Функция инициализации отзывов.
 * Документирована для понимания процесса загрузки данных.
 */
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
document.addEventListener('DOMContentLoaded', initTestimonials);
