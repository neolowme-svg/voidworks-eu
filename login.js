
const tabs = document.querySelectorAll('.auth-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const authTitle = document.getElementById('auth-title');

tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    const mode = tab.dataset.tab;
    tabs.forEach(item => {
      const active = item === tab;
      item.classList.toggle('active', active);
      item.setAttribute('aria-selected', String(active));
    });

    const register = mode === 'register';
    loginForm.hidden = register;
    registerForm.hidden = !register;
    authTitle.textContent = register ? 'Maak een account.' : 'Welkom terug.';
  });
});

document.querySelectorAll('.toggle-password').forEach(button => {
  button.addEventListener('click', () => {
    const input = document.getElementById(button.dataset.target);
    if (!input) return;

    const showing = input.type === 'text';
    input.type = showing ? 'password' : 'text';
    button.textContent = showing ? 'Tonen' : 'Verbergen';
  });
});

const password = document.getElementById('register-password');
const confirmPassword = document.getElementById('confirm-password');
const strength = document.getElementById('password-strength');
const strengthText = document.getElementById('strength-text');

const rules = {
  length: value => value.length >= 12,
  lower: value => /[a-z]/.test(value),
  upper: value => /[A-Z]/.test(value),
  number: value => /\d/.test(value),
  symbol: value => /[^A-Za-z0-9\s]/.test(value),
  spaces: value => value === value.trim()
};

function passwordState(value) {
  const matches = Object.fromEntries(
    Object.entries(rules).map(([name, check]) => [name, check(value)])
  );

  document.querySelectorAll('.password-rules li').forEach(item => {
    item.classList.toggle('valid', Boolean(matches[item.dataset.rule]));
  });

  if (!value) {
    strength.dataset.level = '0';
    strengthText.textContent = 'Nog geen wachtwoord';
    return { level: 0, matches };
  }

  let score = 0;
  if (matches.length) score++;
  if (matches.lower && matches.upper) score++;
  if (matches.number) score++;
  if (matches.symbol) score++;
  if (value.length >= 16) score++;

  let level;
  let label;
  if (score <= 1) {
    level = 1;
    label = 'Zwak';
  } else if (score === 2) {
    level = 2;
    label = 'Redelijk';
  } else if (score === 3) {
    level = 3;
    label = 'Goed';
  } else {
    level = 4;
    label = 'Sterk';
  }

  strength.dataset.level = String(level);
  strengthText.textContent = label;
  return { level, matches };
}

password.addEventListener('input', () => {
  passwordState(password.value);

  if (confirmPassword.value) {
    confirmPassword.setCustomValidity(
      password.value === confirmPassword.value ? '' : 'De wachtwoorden komen niet overeen.'
    );
  }
});

confirmPassword.addEventListener('input', () => {
  confirmPassword.setCustomValidity(
    password.value === confirmPassword.value ? '' : 'De wachtwoorden komen niet overeen.'
  );
});

loginForm.addEventListener('submit', event => {
  event.preventDefault();
  const status = document.getElementById('login-status');

  if (!loginForm.reportValidity()) {
    status.textContent = 'Controleer de ingevulde gegevens.';
    status.className = 'auth-status error';
    return;
  }

  status.textContent = 'De login-interface is klaar, maar er is nog geen authentication-backend gekoppeld.';
  status.className = 'auth-status';
});

registerForm.addEventListener('submit', event => {
  event.preventDefault();
  const status = document.getElementById('register-status');
  const state = passwordState(password.value);

  const requiredRules = Object.values(state.matches).every(Boolean);
  const passwordsMatch = password.value === confirmPassword.value;

  confirmPassword.setCustomValidity(passwordsMatch ? '' : 'De wachtwoorden komen niet overeen.');

  if (!registerForm.reportValidity()) {
    status.textContent = 'Controleer de gemarkeerde velden.';
    status.className = 'auth-status error';
    return;
  }

  if (!requiredRules || state.level < 3) {
    status.textContent = 'Kies een sterker wachtwoord dat aan alle eisen voldoet.';
    status.className = 'auth-status error';
    password.focus();
    return;
  }

  if (!passwordsMatch) {
    status.textContent = 'De wachtwoorden komen niet overeen.';
    status.className = 'auth-status error';
    confirmPassword.focus();
    return;
  }

  status.textContent = 'Registratie-interface gecontroleerd. Koppel nu een backend om accounts echt aan te maken.';
  status.className = 'auth-status success';
});

document.querySelectorAll('.demo-action').forEach(button => {
  button.addEventListener('click', () => {
    const status = document.getElementById('login-status');
    status.textContent = 'Wachtwoordherstel kan worden geactiveerd zodra de authentication-backend is gekoppeld.';
    status.className = 'auth-status';
  });
});
