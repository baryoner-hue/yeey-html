/**
 * Unit-testable extraction of the logic embedded in index.html's inline script.
 *
 * index.html itself is left untouched: it still contains its own inline copy of
 * this same logic. This module mirrors that logic so it can be exercised under
 * Jest + jsdom. Pure helpers are exported for isolated testing; each feature is
 * exposed as a "create...Controller" factory that takes a document/window, so
 * tests can inject a jsdom DOM and fake timers/audio without touching globals.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const DEFAULT_PHOTO =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// Happens to also guard against protocol-relative URLs ("//host").
const HTTP_URL_PATTERN = /^https?:\/\//i;
const DATA_URL_PATTERN = /^data:image\//i;

// Happy Birthday melody: note names + durations (ms).
export const notes = [
  { note: 'C4', duration: 350 }, { note: 'C4', duration: 150 },
  { note: 'D4', duration: 500 }, { note: 'C4', duration: 500 },
  { note: 'F4', duration: 500 }, { note: 'E4', duration: 1000 },

  { note: 'C4', duration: 350 }, { note: 'C4', duration: 150 },
  { note: 'D4', duration: 500 }, { note: 'C4', duration: 500 },
  { note: 'G4', duration: 500 }, { note: 'F4', duration: 1000 },

  { note: 'C4', duration: 350 }, { note: 'C4', duration: 150 },
  { note: 'C5', duration: 500 }, { note: 'A4', duration: 500 },
  { note: 'F4', duration: 500 }, { note: 'E4', duration: 500 },
  { note: 'D4', duration: 800 },

  { note: 'A#4', duration: 350 }, { note: 'A#4', duration: 150 },
  { note: 'A4', duration: 500 }, { note: 'F4', duration: 500 },
  { note: 'G4', duration: 500 }, { note: 'F4', duration: 1200 }
];

export const noteFrequencies = {
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23,
  G4: 392.0, A4: 440.0, 'A#4': 466.16, C5: 523.25
};

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/** True when a value is a string containing at least one non-whitespace char. */
export function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Validates an image URL value.
 * @returns {{valid: boolean, reason: 'empty'|'invalid'|'ok', message: string}}
 */
export function validateImageUrl(url) {
  if (!isNonEmptyString(url)) {
    return { valid: false, reason: 'empty', message: 'Kolom URL masih kosong.' };
  }
  const trimmed = url.trim();
  const valid = HTTP_URL_PATTERN.test(trimmed) || DATA_URL_PATTERN.test(trimmed);
  return {
    valid,
    reason: valid ? 'ok' : 'invalid',
    message: valid
      ? ''
      : 'Masukkan URL foto yang valid (http/https atau data URL).'
  };
}

/**
 * Validates a single uploaded photo file.
 * @returns {{valid: boolean, reason: 'no-file'|'not-image'|'too-large'|'ok', message: string|null}}
 */
export function validateImageFile(file) {
  if (!file) {
    return { valid: false, reason: 'no-file', message: null };
  }
  if (!file.type || !file.type.startsWith('image/')) {
    return {
      valid: false,
      reason: 'not-image',
      message: 'File yang dipilih harus berupa gambar.'
    };
  }
  if (file.size > MAX_FILE_SIZE) {
    return {
      valid: false,
      reason: 'too-large',
      message: 'Ukuran foto terlalu besar. Maksimal 5MB.'
    };
  }
  return { valid: true, reason: 'ok', message: null };
}

/** Filters a list of files to those usable for the memory grid. */
export function filterMemoryFiles(files) {
  const list = Array.from(files || []);
  return list.filter(
    (file) =>
      file.type && file.type.startsWith('image/') && file.size <= MAX_FILE_SIZE
  );
}

/**
 * Computes the next carousel index, wrapping in both directions.
 * Handles negative deltas and empty carousels safely.
 */
export function getSlideIndex(current, delta, total) {
  if (!Number.isFinite(total) || total <= 0) return 0;
  const result = ((current + delta) % total + total) % total;
  return Number.isFinite(result) ? result : 0;
}

/** Random tilt for memory cards, always "2deg" or "-2deg". */
export function randomTilt(random = Math.random) {
  return `${random() > 0.5 ? 2 : -2}deg`;
}

// ---------------------------------------------------------------------------
// DOM controllers
// ---------------------------------------------------------------------------

/**
 * Photo management: upload, URL apply, reset, presets, status messaging.
 * @returns {{setPhotoStatus: Function, activatePreset: Function, updatePhoto: Function}}
 */
export function createPhotoController(doc, imageFactory = () => new Image()) {
  const mainPhoto = doc.getElementById('main-photo');
  const fileInput = doc.getElementById('file-input');
  const toggleUrlBtn = doc.getElementById('toggle-url-btn');
  const urlInputContainer = doc.getElementById('url-input-container');
  const urlInput = doc.getElementById('url-input');
  const applyUrlBtn = doc.getElementById('apply-url-btn');
  const resetPhotoBtn = doc.getElementById('reset-photo-btn');
  const photoStatus = doc.getElementById('photo-status');
  const presetBtns = doc.querySelectorAll('.preset-btn');

  function setPhotoStatus(message, type = 'success') {
    photoStatus.textContent = message;
    photoStatus.className = `photo-status show ${type}`;
  }

  function activatePreset(url) {
    presetBtns.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.url === url);
    });
  }

  function updatePhoto(src, sourceLabel = 'Foto') {
    if (!isNonEmptyString(src)) {
      setPhotoStatus('URL foto tidak boleh kosong.', 'error');
      return;
    }

    const image = imageFactory();
    image.onload = () => {
      mainPhoto.src = src;
      activatePreset(src);
      setPhotoStatus(`${sourceLabel} berhasil diterapkan.`, 'success');
    };
    image.onerror = () => {
      mainPhoto.src = DEFAULT_PHOTO;
      activatePreset(DEFAULT_PHOTO);
      setPhotoStatus('Foto gagal dimuat, kembali ke foto default.', 'error');
    };
    image.src = src;
  }

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    const result = validateImageFile(file);
    if (result.reason === 'no-file') return;
    if (!result.valid) {
      setPhotoStatus(result.message, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      updatePhoto(event.target.result, 'Upload foto');
    };
    reader.onerror = () => {
      setPhotoStatus('Tidak dapat membaca file foto.', 'error');
    };
    reader.readAsDataURL(file);
  });

  toggleUrlBtn.addEventListener('click', () => {
    const isHidden = urlInputContainer.classList.toggle('hidden');
    toggleUrlBtn.innerHTML = isHidden
      ? '<i class="fa-solid fa-link"></i> Gunakan URL'
      : '<i class="fa-solid fa-eye-slash"></i> Tutup URL';
    if (!isHidden) {
      urlInput.focus();
    }
  });

  applyUrlBtn.addEventListener('click', () => {
    const { valid, message } = validateImageUrl(urlInput.value);
    if (!valid) {
      setPhotoStatus(message, 'error');
      return;
    }
    updatePhoto(urlInput.value.trim(), 'URL foto');
  });

  resetPhotoBtn.addEventListener('click', () => {
    urlInput.value = '';
    urlInputContainer.classList.add('hidden');
    toggleUrlBtn.innerHTML = '<i class="fa-solid fa-link"></i> Gunakan URL';
    updatePhoto(DEFAULT_PHOTO, 'Foto default');
  });

  presetBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url;
      if (url) {
        updatePhoto(url, 'Foto preset');
      }
    });
  });

  mainPhoto.onerror = () => {
    mainPhoto.src = DEFAULT_PHOTO;
    setPhotoStatus('Gambar tidak tersedia, menggunakan foto default.', 'error');
  };

  return { setPhotoStatus, activatePreset, updatePhoto };
}

/**
 * Page navigation between #page-1/2/3, toggling active classes and aria state.
 */
export function createPageNavController(doc, scrollTo) {
  const pages = doc.querySelectorAll('.page');
  const pageNavButtons = doc.querySelectorAll('.page-nav-btn');
  const safeScrollTo = scrollTo || (() => {});

  function showPage(pageId) {
    pages.forEach((page) => {
      const isActive = page.id === pageId;
      page.classList.toggle('is-active', isActive);
      page.setAttribute('aria-hidden', String(!isActive));
    });

    pageNavButtons.forEach((button) => {
      const isActive = button.dataset.page === pageId;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-current', isActive ? 'page' : 'false');
    });

    safeScrollTo({ top: 0, behavior: 'smooth' });
  }

  doc.querySelectorAll('[data-page]').forEach((button) => {
    button.addEventListener('click', () => showPage(button.dataset.page));
  });

  return { showPage };
}

/** Secret-message reveal toggle. */
export function createSecretController(doc, launchConfetti = () => {}) {
  const revealSecretBtn = doc.getElementById('reveal-secret-btn');
  const secretMessage = doc.getElementById('secret-message');

  revealSecretBtn.addEventListener('click', () => {
    const isRevealed = secretMessage.classList.toggle('is-revealed');
    revealSecretBtn.textContent = isRevealed
      ? '💖 Pesan Sudah Terbuka'
      : '🔐 Buka Pesan Rahasia';
    revealSecretBtn.setAttribute('aria-expanded', String(isRevealed));
    if (isRevealed) {
      launchConfetti();
    }
  });

  return { revealSecretBtn, secretMessage };
}

/** Memory-grid multi-upload. */
export function createMemoryController(doc, random = Math.random) {
  const memoryGrid = doc.getElementById('memory-grid');
  const memoryUpload = doc.getElementById('memory-upload');
  const memoryStatus = doc.getElementById('memory-status');

  memoryUpload.addEventListener('change', (event) => {
    const files = Array.from(event.target.files || []);
    const imageFiles = filterMemoryFiles(files);

    if (!files.length) return;
    if (!imageFiles.length) {
      memoryStatus.textContent = 'Pilih file gambar dengan ukuran maksimal 5MB.';
      memoryStatus.className = 'text-center text-[11px] text-red-600 mt-2';
      return;
    }

    imageFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (readerEvent) => {
        const figure = doc.createElement('figure');
        figure.className = 'memory-card bg-white p-2.5 pb-3 rounded-xl shadow-lg';
        figure.style.setProperty('--tilt', randomTilt(random));
        figure.innerHTML = `
          <img src="${readerEvent.target.result}" alt="Foto kenangan yang ditambahkan" class="w-full aspect-square object-cover rounded-lg">
          <figcaption class="text-center text-xs font-semibold text-gray-600 mt-2">Kenangan baru 💖</figcaption>
        `;
        memoryGrid.appendChild(figure);
      };
      reader.readAsDataURL(file);
    });

    memoryStatus.textContent = `${imageFiles.length} foto berhasil ditambahkan ke galeri.`;
    memoryStatus.className = 'text-center text-[11px] text-green-700 mt-2';
    memoryUpload.value = '';
  });

  return { memoryGrid, memoryUpload, memoryStatus };
}

/**
 * Web Audio "Happy Birthday" synthesizer.
 * @param {object} deps - {setTimeout, clearTimeout, audioContext} for testing.
 */
export function createAudioController(doc, win, deps = {}) {
  const setTimeoutFn = deps.setTimeout;
  const clearTimeoutFn = deps.clearTimeout;
  let audioCtx = deps.audioContext || null;
  let isPlaying = false;
  let currentNoteTimeout = null;

  const musicBtn = doc.getElementById('music-btn');
  const musicIcon = doc.getElementById('music-icon');
  const musicText = doc.getElementById('music-text');

  function playTone(freq, duration) {
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioCtx.currentTime + duration / 1000
      );

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.start();
      osc.stop(audioCtx.currentTime + duration / 1000);
    } catch (e) {
      // Swallow audio errors (matches original behaviour).
    }
  }

  function playBirthdayMelody(index = 0) {
    if (!isPlaying) return;

    if (index >= notes.length) {
      currentNoteTimeout = setTimeoutFn(() => playBirthdayMelody(0), 1000);
      return;
    }

    const current = notes[index];
    const freq = noteFrequencies[current.note];

    if (freq) {
      playTone(freq, current.duration);
    }

    currentNoteTimeout = setTimeoutFn(() => {
      playBirthdayMelody(index + 1);
    }, current.duration + 40);
  }

  function toggleMusic() {
    if (!audioCtx) {
      const AudioContextClass = win.AudioContext || win.webkitAudioContext;
      audioCtx = new AudioContextClass();
    }

    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    if (isPlaying) {
      isPlaying = false;
      clearTimeoutFn(currentNoteTimeout);
      musicText.textContent = 'Putar Lagu 🎵';
      musicIcon.className = 'fa-solid fa-music text-pink-500';
    } else {
      isPlaying = true;
      musicText.textContent = 'Matikan Musik 🔊';
      musicIcon.className = 'fa-solid fa-volume-high text-pink-500';
      playBirthdayMelody(0);
    }
  }

  musicBtn.addEventListener('click', toggleMusic);

  return {
    toggleMusic,
    playTone,
    playBirthdayMelody,
    isPlaying: () => isPlaying,
    getAudioContext: () => audioCtx
  };
}

/** Wish carousel slides + dots + autoplay. */
export function createCarouselController(doc, win, deps = {}) {
  const setIntervalFn = deps.setInterval;
  const clearIntervalFn = deps.clearInterval;
  const intervalMs = deps.intervalMs || 5000;

  const slides = doc.querySelectorAll('.slide-item');
  const dots = doc.querySelectorAll('.dot');
  const prevBtn = doc.getElementById('prev-btn');
  const nextBtn = doc.getElementById('next-btn');
  let currentSlide = 0;
  let slideInterval = null;

  function showSlide(index) {
    slides.forEach((slide, i) => {
      if (i === index) {
        slide.classList.remove('opacity-0', 'translate-x-8', 'pointer-events-none');
        slide.classList.add('opacity-100', 'translate-x-0');
      } else {
        slide.classList.remove('opacity-100', 'translate-x-0');
        slide.classList.add('opacity-0', 'translate-x-8', 'pointer-events-none');
      }
    });

    dots.forEach((dot, i) => {
      if (i === index) {
        dot.classList.replace('bg-purple-200', 'bg-purple-600');
      } else {
        dot.classList.replace('bg-purple-600', 'bg-purple-200');
      }
    });

    currentSlide = index;
  }

  function nextSlide() {
    showSlide(getSlideIndex(currentSlide, 1, slides.length));
  }

  function prevSlide() {
    showSlide(getSlideIndex(currentSlide, -1, slides.length));
  }

  function startAutoSlide() {
    stopAutoSlide();
    slideInterval = setIntervalFn(nextSlide, intervalMs);
  }

  function stopAutoSlide() {
    if (slideInterval) clearIntervalFn(slideInterval);
    slideInterval = null;
  }

  nextBtn.addEventListener('click', () => {
    nextSlide();
    startAutoSlide();
  });
  prevBtn.addEventListener('click', () => {
    prevSlide();
    startAutoSlide();
  });

  dots.forEach((dot) => {
    dot.addEventListener('click', (e) => {
      showSlide(parseInt(e.currentTarget.dataset.index, 10));
      startAutoSlide();
    });
  });

  return {
    showSlide,
    nextSlide,
    prevSlide,
    startAutoSlide,
    stopAutoSlide,
    currentSlide: () => currentSlide
  };
}

/** Cake candle blowout. */
export function createCakeController(doc, deps = {}) {
  const setTimeoutFn = deps.setTimeout;
  const launchConfetti = deps.launchConfetti || (() => {});
  const toggleMusic = deps.toggleMusic || (() => {});
  const isMusicPlaying = deps.isMusicPlaying || (() => false);

  const flame = doc.getElementById('flame');
  const smoke = doc.getElementById('smoke');
  const cakeInstruction = doc.getElementById('cake-instruction');
  let isCandleOut = false;

  flame.addEventListener('click', () => {
    if (isCandleOut) return;

    flame.style.display = 'none';
    smoke.style.opacity = '1';
    setTimeoutFn(() => {
      smoke.style.opacity = '0';
    }, 2000);

    cakeInstruction.innerHTML =
      '✨ <span class="text-pink-600 font-bold">Lilin telah ditiup! Make a wish!</span> ✨';
    isCandleOut = true;

    launchConfetti();

    if (!isMusicPlaying()) {
      toggleMusic();
    }
  });

  return { flame, smoke, cakeInstruction, isCandleOut: () => isCandleOut };
}

/** Confetti launcher that runs for `duration` ms via requestAnimationFrame. */
export function createConfettiLauncher(win, deps = {}) {
  const confettiFn = deps.confetti || (win && win.confetti) || (() => {});
  const requestAnimationFrameFn =
    deps.requestAnimationFrame || ((cb) => win.requestAnimationFrame(cb));
  const dateNow = deps.dateNow || Date.now;
  const duration = deps.duration || 3000;

  function launchConfetti() {
    const animationEnd = dateNow() + duration;

    (function frame() {
      confettiFn({
        particleCount: 6,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ['#ec4899', '#8b5cf6', '#f59e0b', '#06b6d4']
      });
      confettiFn({
        particleCount: 6,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ['#ec4899', '#8b5cf6', '#f59e0b', '#06b6d4']
      });

      if (dateNow() < animationEnd) {
        requestAnimationFrameFn(frame);
      }
    })();
  }

  return { launchConfetti };
}
