document.querySelectorAll('.work-card').forEach(card => {
  const slides = card.querySelector('.work-card-slides');
  const dotsContainer = card.querySelector('.slide-dots');
  const allSlides = card.querySelectorAll('.slide');
  const total = allSlides.length;
  let current = 0;

  function setBehansBg(sourceEl) {
    const behanceSlide = card.querySelector('.behance-slide');
    if (!behanceSlide) return;

    const oldBg = behanceSlide.querySelector('.behance-slide-bg');
    if (oldBg) oldBg.remove();

    const bg = document.createElement('div');
    bg.className = 'behance-slide-bg';

    if (sourceEl.tagName === 'IMG') {
      bg.style.backgroundImage = `url(${sourceEl.src})`;
      behanceSlide.insertBefore(bg, behanceSlide.firstChild);

    } else if (sourceEl.tagName === 'VIDEO') {
      const capture = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = sourceEl.videoWidth || 640;
          canvas.height = sourceEl.videoHeight || 360;
          canvas.getContext('2d').drawImage(sourceEl, 0, 0, canvas.width, canvas.height);
          bg.style.backgroundImage = `url(${canvas.toDataURL()})`;
        } catch (e) {}
        behanceSlide.insertBefore(bg, behanceSlide.firstChild);
      };

      if (sourceEl.readyState >= 3 && sourceEl.currentTime > 0) {
        capture();
      } else {
        sourceEl.addEventListener('timeupdate', capture, { once: true });
      }
    }
  }

  setBehansBg(allSlides[0]);

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

    allSlides.forEach((slide, i) => {
      const video = slide.tagName === 'VIDEO' ? slide : slide.querySelector('video');
      if (!video) return;
      if (i === current) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }

  card.querySelector('.work-card-media').addEventListener('click', (e) => {
    if (e.target.closest('.behance-btn')) return;
    // Если текущий слайд — behance-slide, возвращаемся к первому
    // Иначе просто идём дальше по кругу
    const isBehance = allSlides[current].classList.contains('behance-slide');
    goTo(isBehance ? 0 : (current + 1) % total);
  });
});