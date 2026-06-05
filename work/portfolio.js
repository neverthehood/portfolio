document.querySelectorAll('.work-card').forEach(card => {
  const slides = card.querySelector('.work-card-slides');
  const dotsContainer = card.querySelector('.slide-dots');
  const allSlides = card.querySelectorAll('.slide');
  const total = allSlides.length;
  let current = 0;
  let isDragging = false;

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

  if (total <= 1) return;

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

  const media = card.querySelector('.work-card-media');

  // Click
  media.addEventListener('click', (e) => {
    if (isDragging) return;
    if (e.target.closest('.behance-btn')) return;
    const isBehance = allSlides[current].classList.contains('behance-slide');
    goTo(isBehance ? 0 : (current + 1) % total);
  });

  // Touch swipe
  let touchStartX = 0;

  media.addEventListener('touchstart', (e) => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  media.addEventListener('touchend', (e) => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 30) return;
    if (diff > 0) {
      goTo((current + 1) % total);
    } else {
      goTo((current - 1 + total) % total);
    }
  });

  // Mouse drag
  let mouseStartX = 0;

  media.addEventListener('mousedown', (e) => {
    mouseStartX = e.clientX;
    isDragging = false;
  });

  media.addEventListener('mousemove', (e) => {
    if (e.buttons === 0) return;
    if (Math.abs(e.clientX - mouseStartX) > 5) isDragging = true;
  });

  media.addEventListener('mouseup', (e) => {
    const diff = mouseStartX - e.clientX;
    if (isDragging && Math.abs(diff) >= 30) {
      if (diff > 0) {
        goTo((current + 1) % total);
      } else {
        goTo((current - 1 + total) % total);
      }
    }
    setTimeout(() => { isDragging = false; }, 0);
  });

});

// Lazy load non-first videos after page load
window.addEventListener('load', () => {
  document.querySelectorAll('video[data-src]').forEach(video => {
    video.src = video.dataset.src;
    video.removeAttribute('data-src');
  });
});