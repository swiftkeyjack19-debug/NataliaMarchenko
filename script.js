/* Парикмахерская лендинг:
   - раскрытие мобильного меню
   - появление блоков при прокрутке (IntersectionObserver)
   - кнопка "Наверх"
   - простая модалка записи
*/

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const BOOKINGS_KEY = "beautyStudioBookings";

  const loadBookings = () => {
    try {
      const raw = localStorage.getItem(BOOKINGS_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const saveBookings = (bookings) => {
    localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookings, null, 2));
  };

  const downloadBookingsFile = (bookings) => {
    const content = JSON.stringify(bookings, null, 2);
    const blob = new Blob([content], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bookings-data.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Year
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Mobile menu toggle
  const menuToggle = $('[data-menu-toggle]');
  const nav = $("#nav");

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    // Close menu on nav link click (mobile)
    $$("#nav a.nav-link, #nav a.btn, #nav a[href^='#']").forEach((link) => {
      link.addEventListener("click", () => {
        nav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Reveal animation on scroll
  const revealEls = $$(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Back to top button
  const toTopBtn = $('[data-to-top]');
  const onScroll = () => {
    if (!toTopBtn) return;
    const show = window.scrollY > 650;
    toTopBtn.classList.toggle("is-visible", show);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (toTopBtn) {
    toTopBtn.addEventListener("click", () => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Modal booking
  const modal = $('[data-modal]');
  const backdrop = $('[data-modal-backdrop]');
  const closeBtn = $('[data-modal-close]');
  const openButtons = $$('[data-open-modal], [data-online-book], [data-book-now]');
  const bookForm = $('[data-book-form]');

  const openModal = () => {
    if (!modal) return;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    const firstInput = modal.querySelector("input, select, button");
    if (firstInput) firstInput.focus();
  };

  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  };

  openButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      // Если ссылка ведет на #contacts, не мешаем, но открываем модалку тоже.
      e.preventDefault();
      openModal();
    });
  });

  if (backdrop) backdrop.addEventListener("click", closeModal);
  if (closeBtn) closeBtn.addEventListener("click", closeModal);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeModal();
  });

  if (bookForm) {
    bookForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const data = new FormData(bookForm);
      const name = String(data.get("name") || "");
      const phone = String(data.get("phone") || "");
      const service = String(data.get("service") || "");

      const booking = {
        id: Date.now(),
        createdAt: new Date().toISOString(),
        createdAtLocal: new Date().toLocaleString("ru-RU"),
        name,
        phone,
        service,
      };

      const bookings = loadBookings();
      bookings.push(booking);
      saveBookings(bookings);
      downloadBookingsFile(bookings);

      alert("Заявка сохранена. Файл bookings-data.json скачан — его можно передать администратору.");
      closeModal();
      bookForm.reset();
    });
  }
})();

