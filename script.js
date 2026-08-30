
const year = document.getElementById('year');
if (year) year.textContent = new Date().getFullYear();

const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.getElementById('mobile-menu');

function closeMenu(){
  if(!menuButton || !mobileMenu) return;
  menuButton.classList.remove('active');
  menuButton.setAttribute('aria-expanded','false');
  menuButton.setAttribute('aria-label','Menu openen');
  mobileMenu.hidden = true;
  document.body.classList.remove('menu-open');
}

if(menuButton && mobileMenu){
  menuButton.addEventListener('click',()=>{
    const open = mobileMenu.hidden;
    mobileMenu.hidden = !open;
    menuButton.classList.toggle('active',open);
    menuButton.setAttribute('aria-expanded',String(open));
    menuButton.setAttribute('aria-label',open ? 'Menu sluiten' : 'Menu openen');
    document.body.classList.toggle('menu-open',open);
  });

  mobileMenu.querySelectorAll('a').forEach(a=>a.addEventListener('click',closeMenu));
  document.addEventListener('keydown',e=>{ if(e.key === 'Escape') closeMenu(); });
  window.addEventListener('resize',()=>{ if(window.innerWidth > 980) closeMenu(); });
}

const observer = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      entry.target.classList.add('visible');
      observer.unobserve(entry.target);
    }
  });
},{threshold:.08});

document.querySelectorAll('.reveal').forEach(el=>observer.observe(el));

document.querySelectorAll('.faq-list details').forEach(item=>{
  item.addEventListener('toggle',()=>{
    if(item.open){
      document.querySelectorAll('.faq-list details').forEach(other=>{
        if(other !== item) other.open = false;
      });
    }
  });
});

const form = document.getElementById('contact-form');
if(form){
  form.addEventListener('submit',e=>{
    e.preventDefault();
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

// Canonical host: redirect www to apex once both Vercel domains are connected.
if(location.hostname === 'www.voidworks.eu'){
  location.replace(`https://voidworks.eu${location.pathname}${location.search}${location.hash}`);
}
