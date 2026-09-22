
        // --- PHOTO MANAGEMENT LOGIC ---
        const mainPhoto = document.getElementById('main-photo');
        const fileInput = document.getElementById('file-input');
        const toggleUrlBtn = document.getElementById('toggle-url-btn');
        const urlInputContainer = document.getElementById('url-input-container');
        const urlInput = document.getElementById('url-input');
        const applyUrlBtn = document.getElementById('apply-url-btn');
        const resetPhotoBtn = document.getElementById('reset-photo-btn');
        const photoStatus = document.getElementById('photo-status');
        const presetBtns = document.querySelectorAll('.preset-btn');
        const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80';

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
            if (!src || !src.trim()) {
                setPhotoStatus('URL foto tidak boleh kosong.', 'error');
                return;
            }

            const image = new Image();
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

        // Handle File Upload from device
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                setPhotoStatus('File yang dipilih harus berupa gambar.', 'error');
                return;
            }

            if (file.size > 5 * 1024 * 1024) {
                setPhotoStatus('Ukuran foto terlalu besar. Maksimal 5MB.', 'error');
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

        // Toggle URL Input Box
        toggleUrlBtn.addEventListener('click', () => {
            const isHidden = urlInputContainer.classList.toggle('hidden');
            toggleUrlBtn.innerHTML = isHidden
                ? '<i class="fa-solid fa-link"></i> Gunakan URL'
                : '<i class="fa-solid fa-eye-slash"></i> Tutup URL';
            if (!isHidden) {
                urlInput.focus();
            }
        });

        // Apply Image URL
        applyUrlBtn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            const isValidUrl = /^https?:\/\//i.test(url) || /^data:image\//i.test(url);

            if (!url) {
                setPhotoStatus('Kolom URL masih kosong.', 'error');
                return;
            }

            if (!isValidUrl) {
                setPhotoStatus('Masukkan URL foto yang valid (http/https atau data URL).', 'error');
                return;
            }

            updatePhoto(url, 'URL foto');
        });

        resetPhotoBtn.addEventListener('click', () => {
            urlInput.value = '';
            urlInputContainer.classList.add('hidden');
            toggleUrlBtn.innerHTML = '<i class="fa-solid fa-link"></i> Gunakan URL';
            updatePhoto(DEFAULT_PHOTO, 'Foto default');
        });

        // Preset Thumbnails Selector
        presetBtns.forEach(btn => {
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

        // --- PAGE NAVIGATION ---
        const pages = document.querySelectorAll('.page');
        const pageNavButtons = document.querySelectorAll('.page-nav-btn');

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

            window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        document.querySelectorAll('[data-page]').forEach((button) => {
            button.addEventListener('click', () => showPage(button.dataset.page));
        });

        // --- SECRET MESSAGE ---
        const revealSecretBtn = document.getElementById('reveal-secret-btn');
        const secretMessage = document.getElementById('secret-message');

        revealSecretBtn.addEventListener('click', () => {
            const isRevealed = secretMessage.classList.toggle('is-revealed');
            revealSecretBtn.textContent = isRevealed ? '💙 Pesan Sudah Terbuka' : '🔒 Buka Pesan Rahasia';
            revealSecretBtn.setAttribute('aria-expanded', String(isRevealed));

            if (isRevealed) {
                launchConfetti();
            }
        });

        // --- MEMORY PHOTO UPLOAD ---
        const memoryGrid = document.getElementById('memory-grid');
        const memoryUpload = document.getElementById('memory-upload');
        const memoryStatus = document.getElementById('memory-status');

        memoryUpload.addEventListener('change', (event) => {
            const files = Array.from(event.target.files || []);
            const imageFiles = files.filter((file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024);

            if (!files.length) return;
            if (!imageFiles.length) {
                memoryStatus.textContent = 'Pilih file gambar dengan ukuran maksimal 5MB.';
                memoryStatus.className = 'text-center text-[11px] text-red-600 mt-2';
                return;
            }

            imageFiles.forEach((file) => {
                const reader = new FileReader();
                reader.onload = (readerEvent) => {
                    const figure = document.createElement('figure');
                    figure.className = 'memory-card bg-white p-2.5 pb-3 rounded-xl shadow-lg';
                    figure.style.setProperty('--tilt', `${Math.random() > 0.5 ? 2 : -2}deg`);
                    figure.innerHTML = `
                        <img src="${readerEvent.target.result}" alt="Foto kenangan yang ditambahkan" class="w-full aspect-square object-cover rounded-lg">
                        <figcaption class="text-center text-xs font-semibold text-[#5b7aa8] mt-2">Kenangan baru 💖</figcaption>
                    `;
                    memoryGrid.appendChild(figure);
                };
                reader.readAsDataURL(file);
            });

            memoryStatus.textContent = `${imageFiles.length} foto berhasil ditambahkan ke galeri.`;
            memoryStatus.className = 'text-center text-[11px] text-green-700 mt-2';
            memoryUpload.value = '';
        });

        // --- WEB AUDIO SYNTHESIZER (NO EXTERNAL AUDIO DEPENDENCY) ---
        let audioCtx = null;
        let isPlaying = false;
        let currentNoteTimeout = null;

        const musicBtn = document.getElementById('music-btn');
        const musicIcon = document.getElementById('music-icon');
        const musicText = document.getElementById('music-text');

        // Happy Birthday Notes & Frequencies (in Hz)
        const notes = [
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

        const noteFrequencies = {
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23,
            'G4': 392.00, 'A4': 440.00, 'A#4': 466.16, 'C5': 523.25
        };

        function playTone(freq, duration) {
            if (!audioCtx) return;
            try {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

                gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + (duration / 1000));

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start();
                osc.stop(audioCtx.currentTime + (duration / 1000));
            } catch(e) { console.log(e); }
        }

        function playBirthdayMelody(index = 0) {
            if (!isPlaying) return;

            if (index >= notes.length) {
                // Loop melody after completion
                currentNoteTimeout = setTimeout(() => playBirthdayMelody(0), 1000);
                return;
            }

            const current = notes[index];
            const freq = noteFrequencies[current.note];

            if (freq) {
                playTone(freq, current.duration);
            }

            currentNoteTimeout = setTimeout(() => {
                playBirthdayMelody(index + 1);
            }, current.duration + 40);
        }

        function toggleMusic() {
            if (!audioCtx) {
                const AudioContext = window.AudioContext || window.webkitAudioContext;
                audioCtx = new AudioContext();
            }

            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }

            if (isPlaying) {
                isPlaying = false;
                clearTimeout(currentNoteTimeout);
                musicText.textContent = 'Putar Lagu 🎵';
                musicIcon.className = 'fa-solid fa-music text-[#6fb6f5]';
            } else {
                isPlaying = true;
                musicText.textContent = 'Matikan Musik 🔊';
                musicIcon.className = 'fa-solid fa-volume-high text-[#6fb6f5]';
                playBirthdayMelody(0);
            }
        }

        musicBtn.addEventListener('click', toggleMusic);

        // --- CONFETTI LAUNCHER ---
        function launchConfetti() {
            const duration = 3000;
            const animationEnd = Date.now() + duration;

            (function frame() {
                confetti({
                    particleCount: 6,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#9dcfff', '#ffb6d5', '#ffffff', '#6fb6f5']
                });
                confetti({
                    particleCount: 6,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#9dcfff', '#ffb6d5', '#ffffff', '#6fb6f5']
                });

                if (Date.now() < animationEnd) {
                    requestAnimationFrame(frame);
                }
            }());
        }

        document.getElementById('celebrate-btn').addEventListener('click', launchConfetti);

        // --- CAKE & CANDLE BLOWOUT LOGIC ---
        const flame = document.getElementById('flame');
        const smoke = document.getElementById('smoke');
        const cakeInstruction = document.getElementById('cake-instruction');
        let isCandleOut = false;

        flame.addEventListener('click', () => {
            if (!isCandleOut) {
                flame.style.display = 'none';
                smoke.style.opacity = '1';
                setTimeout(() => { smoke.style.opacity = '0'; }, 2000);

                cakeInstruction.innerHTML = '✨ <span class="text-[#6fb6f5] font-bold">Lilin telah ditiup! Make a wish!</span> ✨';
                isCandleOut = true;

                launchConfetti();

                if (!isPlaying) {
                    toggleMusic();
                }
            }
        });

        // --- WISH CAROUSEL SLIDER ---
        const slides = document.querySelectorAll('.slide-item');
        const dots = document.querySelectorAll('.dot');
        const prevBtn = document.getElementById('prev-btn');
        const nextBtn = document.getElementById('next-btn');
        let currentSlide = 0;
        let slideInterval;

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
                    dot.classList.replace('bg-[#cfe6ff]', 'bg-[#6fb6f5]');
                } else {
                    dot.classList.replace('bg-[#6fb6f5]', 'bg-[#cfe6ff]');
                }
            });

            currentSlide = index;
        }

        function nextSlide() {
            showSlide((currentSlide + 1) % slides.length);
        }

        function prevSlide() {
            showSlide((currentSlide - 1 + slides.length) % slides.length);
        }

        function startAutoSlide() {
            stopAutoSlide();
            slideInterval = setInterval(nextSlide, 5000);
        }

        function stopAutoSlide() {
            if (slideInterval) clearInterval(slideInterval);
        }

        nextBtn.addEventListener('click', () => { nextSlide(); startAutoSlide(); });
        prevBtn.addEventListener('click', () => { prevSlide(); startAutoSlide(); });

        dots.forEach(dot => {
            dot.addEventListener('click', (e) => {
                showSlide(parseInt(e.target.dataset.index));
                startAutoSlide();
            });
        });

        startAutoSlide();

        // Belum login: jeda carousel agar tidak berjalan di balik layar kunci
        stopAutoSlide();

        // Initial burst on load
        window.onload = () => {
            setTimeout(() => {
                confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
            }, 600);
        };

        // --- LOGIN GATE (PROTEKSI HALAMAN) ---
        const VALID_USERNAME = 'liaa';
        const VALID_PASSWORD = '071008';

        const loginGate = document.getElementById('login-gate');
        const mainContent = document.getElementById('main-content');
        const loginForm = document.getElementById('login-form');
        const loginUsername = document.getElementById('login-username');
        const loginPassword = document.getElementById('login-password');
        const loginError = document.getElementById('login-error');
        const togglePasswordBtn = document.getElementById('toggle-password');
        const togglePasswordIcon = document.getElementById('toggle-password-icon');
        const loginCard = loginGate.querySelector('.glass-panel');

        function showLoginError(message) {
            loginError.textContent = message;
            loginError.classList.remove('hidden');
            loginCard.classList.remove('gate-shake');
            void loginCard.offsetWidth; // restart animasi getar
            loginCard.classList.add('gate-shake');
        }

        function unlockPage() {
            loginGate.classList.add('is-hidden');
            mainContent.classList.remove('is-locked');
            startAutoSlide();
            setTimeout(() => {
                confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 });
            }, 300);
        }

        togglePasswordBtn.addEventListener('click', () => {
            const showPassword = loginPassword.type === 'password';
            loginPassword.type = showPassword ? 'text' : 'password';
            togglePasswordIcon.className = showPassword ? 'fa-solid fa-eye-slash text-sm' : 'fa-solid fa-eye text-sm';
        });

        loginForm.addEventListener('submit', (event) => {
            event.preventDefault();

            const username = loginUsername.value.trim();
            const password = loginPassword.value;

            if (username.toLowerCase() === VALID_USERNAME && password === VALID_PASSWORD) {
                loginError.classList.add('hidden');
                loginForm.reset();
                loginPassword.type = 'password';
                togglePasswordIcon.className = 'fa-solid fa-eye text-sm';
                unlockPage();
            } else {
                showLoginError('Username atau password salah. Coba lagi ya! 💙');
                loginPassword.value = '';
                loginPassword.focus();
            }
        });

        // Fokus ke kolom username saat halaman pertama dibuka
        loginUsername.focus();
    