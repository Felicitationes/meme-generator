import { db } from '../lib/db.js';
import { id } from '@instantdb/core';
import { renderLogin, renderSignedInHeader } from './auth.js';
import { initMemeEditor } from './meme-editor.js';
import { initMemeFeed, postMeme } from './meme-feed.js';

const APP_ID = 'app';

function showError(msg) {
  const app = document.getElementById(APP_ID);
  if (app && !app.querySelector('.app-error')) {
    app.innerHTML = `
      <div class="app-loading app-error">
        <p style="color: #f87171;">${msg}</p>
      </div>
    `;
  }
}

window.addEventListener('error', (e) => showError('Error: ' + e.message));
window.addEventListener('unhandledrejection', (e) => showError('Error: ' + (e.reason?.message ?? String(e.reason))));

function ensureProfile(userId) {
  return new Promise((resolve) => {
    let created = false;
    const query = {
      profiles: {
        $: { where: { '$user.id': userId } },
        $user: {},
      },
    };
    const unsub = db.subscribeQuery(query, (resp) => {
      if (resp.error) {
        unsub?.();
        resolve(null);
        return;
      }
      const profiles = resp.data?.profiles ?? [];
      if (profiles.length > 0) {
        unsub?.();
        resolve(profiles[0].id);
        return;
      }
      if (!created) {
        created = true;
        db.transact(
          db.tx.profiles[id()]
            .update({})
            .link({ $user: userId })
        );
      }
    });
  });
}

function renderApp(auth) {
  const app = document.getElementById(APP_ID);
  if (!app) return;

  if (!auth.user) {
    app.innerHTML = `
      <div class="app">
        <header>
          <h1>Meme Generator</h1>
        </header>
        <div id="auth-container" class="auth-container"></div>
      </div>
    `;
    renderLogin(app.querySelector('#auth-container'));
    return;
  }

  const userId = auth.user.id;
  ensureProfile(userId).then((profileId) => {
    if (profileId) {
      renderMainApp(app, userId, profileId, auth.user);
    }
  });
}

function renderMainApp(app, userId, profileId, user) {
  app.innerHTML = `
    <div class="app">
      <header class="app-header">
        <h1>Meme Generator</h1>
        <div id="nav-user" class="nav-user"></div>
      </header>
      <nav class="app-nav">
        <button type="button" id="nav-create" class="nav-tab nav-tab-active">Create Meme</button>
        <button type="button" id="nav-feed" class="nav-tab">Feed</button>
      </nav>
      <div id="create-section" class="app-section">
        <section class="templates-section" id="templatesSection">
          <h2 class="templates-heading">Choose a template</h2>
          <div class="templates-grid" id="templatesGrid">
            <button type="button" class="template-thumb" data-src="/drake.jpg" aria-label="Use Drake meme template">
              <img src="/drake.jpg" alt="Drake meme template">
              <span>Drake</span>
            </button>
            <button type="button" class="template-thumb" data-src="/gru.jpg" aria-label="Use Gru meme template">
              <img src="/gru.jpg" alt="Gru meme template">
              <span>Gru</span>
            </button>
            <button type="button" class="template-thumb" data-src="/this%20is%20fine.jpg" aria-label="Use This is fine meme template">
              <img src="/this%20is%20fine.jpg" alt="This is fine meme template">
              <span>This is fine</span>
            </button>
            <button type="button" class="template-thumb" data-src="/two%20buttons.jpg" aria-label="Use Two buttons meme template">
              <img src="/two%20buttons.jpg" alt="Two buttons meme template">
              <span>Two buttons</span>
            </button>
          </div>
        </section>
        <div class="upload-divider" id="uploadDivider">
          <span>or upload your own</span>
        </div>
        <div class="upload-area" id="uploadArea">
          <input type="file" id="fileInput" accept="image/*" hidden>
          <p class="upload-placeholder" id="uploadPlaceholder">Upload an image</p>
          <p class="upload-hint">or drag and drop an image here</p>
        </div>
        <div class="canvas-container" id="canvasContainer" hidden>
          <canvas id="memeCanvas" width="600" height="600"></canvas>
        </div>
        <div class="controls" id="controls" hidden>
          <button type="button" class="change-image-btn" id="changeImageBtn">Change image</button>
          <label class="control-group">
            <span>Top text <small>(Shift+Enter for line break)</small></span>
            <textarea id="topText" placeholder="Top text" rows="2" maxlength="200"></textarea>
          </label>
          <label class="control-group">
            <span>Bottom text <small>(Shift+Enter for line break)</small></span>
            <textarea id="bottomText" placeholder="Bottom text" rows="2" maxlength="200"></textarea>
          </label>
          <label class="control-group">
            <span>Text size: <output id="fontSizeValue">48</output>px</span>
            <input type="range" id="fontSize" min="12" max="120" value="48">
          </label>
          <label class="control-group">
            <span>Text color</span>
            <input type="color" id="textColor" value="#ffffff">
          </label>
          <div class="controls-actions">
            <button type="button" id="downloadBtn">Download Meme</button>
            <button type="button" id="postBtn" class="auth-btn">Post Meme</button>
          </div>
        </div>
      </div>
      <div id="feed-section" class="app-section app-section-hidden">
        <div id="feed-container" class="feed-container"></div>
      </div>
    </div>
  `;

  renderSignedInHeader(user ?? { email: '' }, app.querySelector('#nav-user'));

  const createSection = app.querySelector('#create-section');
  const feedSection = app.querySelector('#feed-section');
  const navCreate = app.querySelector('#nav-create');
  const navFeed = app.querySelector('#nav-feed');

  const editor = initMemeEditor(createSection);
  if (editor) {
    app.querySelector('#postBtn').addEventListener('click', async () => {
      await postMeme(editor.getMemeBlob, editor.getMemeDataUrl, editor.getMemeData, userId, profileId);
      navFeed.click();
    });
  }

  const feedContainer = app.querySelector('#feed-container');
  initMemeFeed(feedContainer, userId, profileId, () => {
    navCreate.click();
  });

  function showCreate() {
    createSection.classList.remove('app-section-hidden');
    feedSection.classList.add('app-section-hidden');
    navCreate.classList.add('nav-tab-active');
    navFeed.classList.remove('nav-tab-active');
  }

  function showFeed() {
    createSection.classList.add('app-section-hidden');
    feedSection.classList.remove('app-section-hidden');
    navCreate.classList.remove('nav-tab-active');
    navFeed.classList.add('nav-tab-active');
  }

  navCreate.addEventListener('click', showCreate);
  navFeed.addEventListener('click', showFeed);
}

db.subscribeAuth((auth) => {
  const app = document.getElementById(APP_ID);
  if (!app) return;
  if (auth?.isLoading) {
    app.innerHTML = '<div class="app-loading"><p>Connecting...</p></div>';
    return;
  }
  if (auth?.error) {
    app.innerHTML = `
      <div class="app-loading">
        <p style="color: #f87171;">Connection error: ${auth.error.message}</p>
      </div>
    `;
    return;
  }
  renderApp(auth);
});
