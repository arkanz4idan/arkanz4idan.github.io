// Copy buttons
document.querySelectorAll('.copy-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const cmd = btn.dataset.cmd;
    navigator.clipboard.writeText(cmd).then(() => {
      btn.textContent = 'copied!';
      btn.classList.add('copied');
      setTimeout(() => {
        btn.textContent = 'copy';
        btn.classList.remove('copied');
      }, 2000);
    });
  });
});

// wget toggles
document.querySelectorAll('.wget-toggle').forEach(link => {
  link.addEventListener('click', () => {
    const card = link.closest('.arch-card');
    const wget = card.querySelector('.wget-block');
    wget.classList.toggle('show');
    link.textContent = wget.classList.contains('show') ? 'curl' : 'wget';
  });
});

// Fade in on scroll
const fades = document.querySelectorAll('.fade');
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('in');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.1 });

fades.forEach((el, i) => {
  el.style.transitionDelay = (i * 0.1) + 's';
  observer.observe(el);
});
