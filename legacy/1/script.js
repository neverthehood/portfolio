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

    // если success — всегда домой
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
        showSuccess();   // ← success экран
      } else {
        alert(raw || 'Something went wrong. Please try again.');
      }

    } catch (err) {
      console.error('[contact] network error:', err);
      alert('Network error. Please try again.');
    }
  });
}

// стартовое состояние
setMode('home');


// ===============================
// Canvas Background Animation
// ===============================

const canvas = document.querySelector('.bg__canvas');

if (canvas){

  const ctx = canvas.getContext('2d');
  let w, h;
  let time = 0;

  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  window.addEventListener('resize', resize);
  resize();

  function draw(){
    ctx.clearRect(0,0,w,h);

    const cx =
      w * 0.5 +
      Math.sin(time * 0.35) * w * 0.25 +
      Math.sin(time * 0.9) * 40;

    const cy =
      h * 0.5 +
      Math.cos(time * 0.28) * h * 0.22 +
      Math.cos(time * 0.7) * 30;

    const radius = Math.min(w,h) * 0.7;

    const r2 = 255;
    const g2 = 90 + Math.sin(time * 0.3) * 20;
    const b2 = 220 + Math.cos(time * 0.2) * 15;

    const gradient = ctx.createRadialGradient(
      cx, cy, radius * 0.2,
      cx, cy, radius
    );

    gradient.addColorStop(0.35, `rgba(${r2},${g2},${b2},0.35)`);
    gradient.addColorStop(0.7, `rgba(${r2},${g2},${b2},0.15)`);
    gradient.addColorStop(1, 'rgba(255,255,255,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();

    time += 0.015;
    requestAnimationFrame(draw);
  }

  draw();
}
