document.querySelectorAll('.work-card').forEach(card => {
  const slides = card.querySelector('.work-card-slides');
  const dotsContainer = card.querySelector('.slide-dots');
  const allSlides = card.querySelectorAll('.slide');
  const total = allSlides.length;
  let current = 0;

  // Берём предпоследний слайд как блюр-фон для behance-slide
  const behanceSlide = card.querySelector('.behance-slide');
  if (behanceSlide) {
    const prevSlide = allSlides[total - 2];
    let bgUrl = null;
    if (prevSlide && prevSlide.tagName === 'IMG') {
      bgUrl = prevSlide.src;
    } else if (prevSlide && prevSlide.tagName === 'VIDEO') {
      bgUrl = prevSlide.getAttribute('poster') || null;
    }
    if (bgUrl) {
      const bg = document.createElement('div');
      bg.className = 'behance-slide-bg';
      bg.style.backgroundImage = `url(${bgUrl})`;
      behanceSlide.insertBefore(bg, behanceSlide.firstChild);
    }
  }

  // create dots
  for (let i = 0; i < total; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dotsContainer.appendChild(dot);
  }

  function goTo(index) {
    current = index;
    slides.style.transform = `translateX(-${current * 100}%)`;
    card.querySelectorAll('.dot').forEach((d, i) => {
      d.classList.toggle('active', i === current);
    });
  }

  card.querySelector('.work-card-media').addEventListener('click', () => {
    const next = (current + 1) % total;
    goTo(next);
  });
});