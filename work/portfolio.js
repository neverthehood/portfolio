document.querySelectorAll('.work-card').forEach(card => {
  const slides = card.querySelector('.work-card-slides');
  const dotsContainer = card.querySelector('.slide-dots');
  const allSlides = card.querySelectorAll('.slide');
  const total = allSlides.length;
  let current = 0;

  // Захватываем первый кадр видео через canvas для блюр-фона
  function setBehansBg(sourceEl) {
    const behanceSlide = card.querySelector('.behance-slide');
    if (!behanceSlide) return;

    // Удаляем старый bg если есть
    const oldBg = behanceSlide.querySelector('.behance-slide-bg');
    if (oldBg) oldBg.remove();

    const bg = document.createElement('div');
    bg.className = 'behance-slide-bg';

    if (sourceEl.tagName === 'IMG') {
      bg.style.backgroundImage = `url(${sourceEl.src})`;
      behanceSlide.insertBefore(bg, behanceSlide.firstChild);
    } else if (sourceEl.tagName === 'VIDEO') {
      // Если видео уже загружено — захватываем кадр сразу
      const capture = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = sourceEl.videoWidth || 640;
          canvas.height = sourceEl.videoHeight || 360;
          canvas.getContext('2d').drawImage(sourceEl, 0, 0, canvas.width, canvas.height);
          bg.style.backgroundImage = `url(${canvas.toDataURL()})`;
        } catch (e) {
          // CORS или другая ошибка — оставляем тёмный фон
        }
        behanceSlide.insertBefore(bg, behanceSlide.firstChild);
      };

      if (sourceEl.readyState >= 2) {
        capture();
      } else {
        sourceEl.addEventListener('loadeddata', capture, { once: true });
      }
    }
  }

  // Инициализируем блюр с первого слайда
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

    // Перезапускаем все видео: играем только активное
    card.querySelectorAll('.slide video').forEach((video, i) => {
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

    if (current === total - 1) {
      goTo(0);
    } else {
      goTo(current + 1);
    }
  });
});