document.querySelectorAll('.work-card').forEach(card => {
  const slides = card.querySelector('.work-card-slides');
  const dotsContainer = card.querySelector('.slide-dots');
  const total = card.querySelectorAll('.slide').length;
  let current = 0;

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