(() => {
  "use strict";

  const PASSWORD = "lvlv";
  const SESSION_KEY = "lvlv-unlocked";

  const gate = document.getElementById("gate");
  const gateCard = document.getElementById("gateCard");
  const gateForm = document.getElementById("gateForm");
  const gatePassword = document.getElementById("gatePassword");

  const gallery = document.getElementById("gallery");
  const grid = document.getElementById("grid");

  const lightbox = document.getElementById("lightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxClose = document.getElementById("lightboxClose");
  const lightboxPrev = document.getElementById("lightboxPrev");
  const lightboxNext = document.getElementById("lightboxNext");
  const lightboxCounter = document.getElementById("lightboxCounter");

  let manifest = [];
  let currentIndex = -1;
  let gridBuilt = false;

  // -------------------------------------------------------
  // Unlock flow
  // -------------------------------------------------------

  function unlock(animate) {
    if (animate) {
      gate.classList.add("is-leaving");
      gallery.hidden = false;
      gallery.classList.add("is-entering");
      window.setTimeout(() => {
        gate.classList.add("is-hidden");
      }, 650);
    } else {
      gate.classList.add("is-hidden");
      gallery.hidden = false;
      gallery.style.opacity = "1";
      gallery.style.transform = "none";
      gallery.style.filter = "none";
    }

    if (!gridBuilt) {
      buildGrid();
    }
  }

  function tryUnlock(value) {
    const normalized = (value || "").trim().toLowerCase();
    if (normalized === PASSWORD) {
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch (err) {
        /* sessionStorage unavailable; ignore */
      }
      unlock(true);
    } else {
      shakeGate();
    }
  }

  function shakeGate() {
    gateCard.classList.remove("is-shaking");
    // restart animation
    void gateCard.offsetWidth;
    gateCard.classList.add("is-shaking");
    gatePassword.value = "";
    gatePassword.focus();
    window.setTimeout(() => {
      gateCard.classList.remove("is-shaking");
    }, 600);
  }

  gateForm.addEventListener("submit", (e) => {
    e.preventDefault();
    tryUnlock(gatePassword.value);
  });

  // Already unlocked this session?
  try {
    if (sessionStorage.getItem(SESSION_KEY) === "1") {
      unlock(false);
    }
  } catch (err) {
    /* sessionStorage unavailable; ignore */
  }

  // -------------------------------------------------------
  // Grid
  // -------------------------------------------------------

  let observer = null;

  function buildGrid() {
    gridBuilt = true;

    fetch("manifest.json")
      .then((res) => res.json())
      .then((names) => {
        manifest = names;

        observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                entry.target.classList.add("in");
                observer.unobserve(entry.target);
              }
            });
          },
          { rootMargin: "0px 0px -40px 0px", threshold: 0.05 }
        );

        names.forEach((name, index) => {
          const tile = document.createElement("div");
          tile.className = "tile";
          tile.style.transitionDelay = `${Math.min(index % 12, 12) * 40}ms`;

          const img = document.createElement("img");
          img.src = `thumbs/${name}.jpg`;
          img.alt = `${name}`;
          img.loading = "lazy";
          img.decoding = "async";

          tile.appendChild(img);
          tile.addEventListener("click", () => openLightbox(index));

          grid.appendChild(tile);
          observer.observe(tile);
        });
      })
      .catch((err) => {
        console.error("Failed to load manifest.json", err);
      });
  }

  // -------------------------------------------------------
  // Lightbox
  // -------------------------------------------------------

  function preload(index) {
    if (index < 0 || index >= manifest.length) return;
    const img = new Image();
    img.src = `web/${manifest[index]}.jpg`;
  }

  function openLightbox(index) {
    currentIndex = index;
    showCurrent();
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lightbox.hidden = true;
    lightboxImage.classList.remove("is-visible");
    document.body.style.overflow = "";
  }

  function showCurrent() {
    if (currentIndex < 0 || currentIndex >= manifest.length) return;

    const name = manifest[currentIndex];
    lightboxImage.classList.remove("is-visible");

    const src = `web/${name}.jpg`;
    const img = new Image();
    img.onload = () => {
      lightboxImage.src = src;
      lightboxImage.alt = name;
      requestAnimationFrame(() => {
        lightboxImage.classList.add("is-visible");
      });
    };
    img.src = src;

    lightboxCounter.textContent = `${currentIndex + 1} / ${manifest.length}`;

    preload(currentIndex - 1);
    preload(currentIndex + 1);
  }

  function showNext() {
    if (!manifest.length) return;
    currentIndex = (currentIndex + 1) % manifest.length;
    showCurrent();
  }

  function showPrev() {
    if (!manifest.length) return;
    currentIndex = (currentIndex - 1 + manifest.length) % manifest.length;
    showCurrent();
  }

  lightboxClose.addEventListener("click", closeLightbox);
  lightboxNext.addEventListener("click", showNext);
  lightboxPrev.addEventListener("click", showPrev);

  lightbox.querySelector(".lightbox__backdrop").addEventListener("click", closeLightbox);

  document.addEventListener("keydown", (e) => {
    if (lightbox.hidden) return;
    if (e.key === "Escape") closeLightbox();
    else if (e.key === "ArrowRight") showNext();
    else if (e.key === "ArrowLeft") showPrev();
  });

  // Tap-to-close on the image itself, and swipe left/right to navigate
  let touchStartX = 0;
  let touchStartY = 0;
  let touchMoved = false;

  lightbox.addEventListener("touchstart", (e) => {
    if (e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    touchMoved = false;
  }, { passive: true });

  lightbox.addEventListener("touchmove", (e) => {
    if (e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - touchStartX;
    const dy = e.touches[0].clientY - touchStartY;
    if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
      touchMoved = true;
    }
  }, { passive: true });

  lightbox.addEventListener("touchend", (e) => {
    const touch = e.changedTouches[0];
    if (!touch) return;

    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;

    const SWIPE_THRESHOLD = 50;

    if (touchMoved && Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) {
        showNext();
      } else {
        showPrev();
      }
      return;
    }

    if (!touchMoved && e.target === lightboxImage) {
      closeLightbox();
    } else if (!touchMoved && e.target.closest(".lightbox__stage") && e.target !== lightboxImage) {
      closeLightbox();
    }
  });
})();
