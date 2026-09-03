const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function setupRevealAnimations() {
  const revealItems = document.querySelectorAll('.reveal');

  if (!revealItems.length) return;

  if (prefersReducedMotion()) {
    revealItems.forEach((item) => item.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold: 0.18,
      rootMargin: '0px 0px -30px 0px'
    }
  );

  revealItems.forEach((item) => observer.observe(item));
}

function setupBackgroundAnimation() {
  const canvas = document.getElementById('particles-canvas');
  if (!canvas) return;

  if (prefersReducedMotion()) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }

  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let dpr = window.devicePixelRatio || 1;
  let particles = [];

  function setCanvasSize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildParticles();
  }

  function buildParticles() {
    const count = window.innerWidth < 700 ? 28 : 52;
    particles = [];

    for (let i = 0; i < count; i += 1) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.42,
        vy: (Math.random() - 0.5) * 0.42,
        r: Math.random() * 2.1 + 1.2,
        alpha: Math.random() * 0.65 + 0.2
      });
    }
  }

  function draw() {
    ctx.fillStyle = 'rgba(8, 9, 11, 0.17)';
    ctx.fillRect(0, 0, width, height);

    for (let i = 0; i < particles.length; i += 1) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -10) p.x = width + 10;
      if (p.x > width + 10) p.x = -10;
      if (p.y < -10) p.y = height + 10;
      if (p.y > height + 10) p.y = -10;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(167, 173, 255, ${p.alpha})`;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j += 1) {
        const other = particles[j];
        const dx = p.x - other.x;
        const dy = p.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 110) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(other.x, other.y);
          ctx.strokeStyle = `rgba(109, 124, 255, ${0.16 * (1 - distance / 110)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    requestAnimationFrame(draw);
  }

  setCanvasSize();
  draw();

  window.addEventListener('resize', setCanvasSize);
}

function setupNavbarState() {
  const topbar = document.querySelector('.topbar');
  if (!topbar) return;

  const updateState = () => {
    if (window.scrollY > 18) {
      topbar.classList.add('scrolled');
    } else {
      topbar.classList.remove('scrolled');
    }
  };

  updateState();
  window.addEventListener('scroll', updateState, { passive: true });
}

function init() {
  setupRevealAnimations();
  setupBackgroundAnimation();
  setupNavbarState();
}

document.addEventListener('DOMContentLoaded', init);
