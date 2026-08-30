
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.getElementById('mobile-menu');

function closeMenu() {
  if (!menuButton || !mobileMenu) return;
  menuButton.classList.remove('active');
  menuButton.setAttribute('aria-expanded', 'false');
  menuButton.setAttribute('aria-label', 'Menu openen');
  mobileMenu.hidden = true;
  document.body.classList.remove('menu-open');
}

if (menuButton && mobileMenu) {
  menuButton.addEventListener('click', () => {
    const opening = mobileMenu.hidden;
    mobileMenu.hidden = !opening;
    menuButton.classList.toggle('active', opening);
    menuButton.setAttribute('aria-expanded', String(opening));
    menuButton.setAttribute('aria-label', opening ? 'Menu sluiten' : 'Menu openen');
    document.body.classList.toggle('menu-open', opening);
  });

  mobileMenu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeMenu();
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 980) closeMenu();
  });
}

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
} else {
  document.querySelectorAll('.reveal').forEach(element => element.classList.add('visible'));
}

document.querySelectorAll('.faq-list details').forEach(item => {
  item.addEventListener('toggle', () => {
    if (!item.open) return;
    document.querySelectorAll('.faq-list details').forEach(other => {
      if (other !== item) other.open = false;
    });
  });
});

const form = document.getElementById('contact-form');
if (form) {
  form.addEventListener('submit', event => {
    event.preventDefault();

    const data = new FormData(form);
    const subject = encodeURIComponent(`Nieuw Voidworks project — ${data.get('type')}`);
    const body = encodeURIComponent(
`Naam: ${data.get('name')}
E-mail: ${data.get('email')}
Type project: ${data.get('type')}

Project:
${data.get('message')}`
    );

    window.location.href = `mailto:info@voidworks.eu?subject=${subject}&body=${body}`;
  });
}

if (location.hostname === 'www.voidworks.eu') {
  location.replace(`https://voidworks.eu${location.pathname}${location.search}${location.hash}`);
}
