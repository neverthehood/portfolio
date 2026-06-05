document.querySelectorAll('.work-card').forEach(card => {
  const slides = card.querySelector('.work-card-slides');
  const dotsContainer = card.querySelector('.slide-dots');
  // FIX 2: Only count visible slides (exclude hide-mobile on mobile)
  const allSlides = Array.from(card.querySelectorAll('.slide')).filter(s => {
    return getComputedStyle(s).display !== 'none';
  });
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

  // FIX 2: Build index map from visible slides to their real DOM position
  const allDomSlides = Array.from(card.querySelectorAll('.slide'));
  const visibleIndices = allSlides.map(s => allDomSlides.indexOf(s));

  for (let i = 0; i < total; i++) {
    const dot = document.createElement('div');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dotsContainer.appendChild(dot);
  }

  function goTo(index) {
    current = index;
    // Translate based on real DOM index of the visible slide
    const domIndex = visibleIndices[current];
    slides.style.transform = `translateX(-${domIndex * 100}%)`;
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

  // Click (only fires if not a drag)
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

  // FIX 1: Mouse drag — track on document to handle out-of-bounds mouseup
  let mouseStartX = 0;
  let dragActive = false;

  media.addEventListener('mousedown', (e) => {
    mouseStartX = e.clientX;
    isDragging = false;
    dragActive = true;
    e.preventDefault(); // prevent text selection during drag
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragActive) return;
    if (Math.abs(e.clientX - mouseStartX) > 5) isDragging = true;
  });

  document.addEventListener('mouseup', (e) => {
    if (!dragActive) return;
    dragActive = false;
    const diff = mouseStartX - e.clientX;
    if (isDragging && Math.abs(diff) >= 30) {
      if (diff > 0) {
        goTo((current + 1) % total);
      } else {
        goTo((current - 1 + total) % total);
      }
    }
    // Reset isDragging after click handler has a chance to check it
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