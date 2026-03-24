import { db } from '../lib/db.js';

let sentEmail = '';

export function renderLogin(container) {
  if (!sentEmail) {
    renderEmailStep(container);
  } else {
    renderCodeStep(container);
  }
}

function renderEmailStep(container) {
  container.innerHTML = `
    <div class="auth-card">
      <h2 class="auth-heading">Let's log you in</h2>
      <p class="auth-text">
        Enter your email, and we'll send you a verification code.
        We'll create an account for you too if you don't already have one.
      </p>
      <form id="email-form" class="auth-form">
        <input
          id="email-input"
          type="email"
          placeholder="Enter your email"
          required
          class="auth-input"
          autocomplete="email"
        />
        <button type="submit" class="auth-btn">Send Code</button>
      </form>
    </div>
  `;
  container.querySelector('#email-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = container.querySelector('#email-input').value;
    sentEmail = email;
    renderLogin(container);
    db.auth.sendMagicCode({ email }).catch((err) => {
      alert('Uh oh: ' + (err.body?.message ?? err.message));
      sentEmail = '';
      renderLogin(container);
    });
  });
}

function renderCodeStep(container) {
  container.innerHTML = `
    <div class="auth-card">
      <h2 class="auth-heading">Enter your code</h2>
      <p class="auth-text">
        We sent an email to <strong>${escapeHtml(sentEmail)}</strong>.
        Check your email, and paste the code you see.
      </p>
      <form id="code-form" class="auth-form">
        <input
          id="code-input"
          type="text"
          placeholder="123456..."
          required
          class="auth-input"
          autocomplete="one-time-code"
        />
        <button type="submit" class="auth-btn">Verify Code</button>
      </form>
    </div>
  `;
  container.querySelector('#code-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const codeInput = container.querySelector('#code-input');
    const code = codeInput.value;
    db.auth.signInWithMagicCode({ email: sentEmail, code }).catch((err) => {
      alert('Uh oh: ' + (err.body?.message ?? err.message));
      codeInput.value = '';
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function renderSignedInHeader(user, container) {
  container.innerHTML = `
    <div class="nav-user">
      <span class="nav-user-email">${escapeHtml(user.email)}</span>
      <button type="button" id="sign-out-btn" class="auth-btn auth-btn-outline">Sign out</button>
    </div>
  `;
  container.querySelector('#sign-out-btn').addEventListener('click', () => {
    db.auth.signOut();
  });
}
