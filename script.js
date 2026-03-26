/* Парикмахерская лендинг:
   - раскрытие мобильного меню
   - появление блоков при прокрутке (IntersectionObserver)
   - кнопка "Наверх"
   - простая модалка записи
*/

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const SUPABASE_URL = "https://ecyklezuaezyjwutwfzt.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjeWtsZXp1YWV6eWp3dXR3Znp0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1Mjg3MDUsImV4cCI6MjA5MDEwNDcwNX0.O_JObhgX92JSfQanCWOUObHgH-r06U9iWH9rkIHddjM";
  const REQUEST_TIMEOUT_MS = 8000;

  const sendBooking = async ({ name, phone, service }) => {
    const endpoint = `${SUPABASE_URL}/rest/v1/bookings`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      signal: controller.signal,
      body: JSON.stringify([{ name, phone, service }]),
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Supabase error: ${response.status}`);
    }
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
    bookForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const submitBtn = bookForm.querySelector('button[type="submit"]');
      const initialBtnText = submitBtn ? submitBtn.textContent : "";
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Отправка...";
      }

      const data = new FormData(bookForm);
      const name = String(data.get("name") || "");
      const phone = String(data.get("phone") || "");
      const service = String(data.get("service") || "");

      try {
        await sendBooking({ name, phone, service });
        alert("Заявка принята");
        closeModal();
        bookForm.reset();
      } catch {
        alert("Не удалось отправить заявку (тайм-аут/сеть). Попробуйте еще раз.");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = initialBtnText || "Отправить заявку";
        }
      }
    });
  }
})();

