// ===============================
// UI logic
// ===============================

const body = document.body;
const toggleBtn = document.querySelector('[data-action="toggle-form"]');
const ctaText = document.querySelector('[data-cta-text]');
const chips = Array.from(document.querySelectorAll('.chip'));
const form = document.querySelector('[data-contact-form]');
const hint = document.querySelector('[data-form-hint]');
const restartBtn = document.querySelector('[data-action="restart"]');

let activeInterest = [];

// ===============================
// MODE SWITCHING
// ===============================

function setMode(mode){
  body.classList.remove('mode-home', 'mode-form', 'mode-success');
  body.classList.add(`mode-${mode}`);

  if (mode === 'form'){
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'true');
    if (ctaText) ctaText.textContent = 'Back to home';
  }

  if (mode === 'home'){
    if (toggleBtn) toggleBtn.setAttribute('aria-expanded', 'false');
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

if (toggleBtn){
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
}

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

  if (!country) {
    cookieBanner.style.display = 'flex';
    return;
  }

  if (EU.includes(country)) {

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


