import { db } from '../lib/db.js';
import { id } from '@instantdb/core';

export function initMemeFeed(container, userId, profileId, onPostClick) {
  const query = {
    memes: {
      $: {
        order: { createdAt: 'desc' },
      },
      author: { $user: {} },
      votes: { $user: {} },
    },
  };

  db.subscribeQuery(query, (resp) => {
    if (resp.error) {
      container.innerHTML = `<div class="feed-error">Error: ${resp.error.message}</div>`;
      return;
    }
    if (resp.data) {
      renderFeed(container, resp.data.memes, userId, onPostClick);
    }
  });
}

function renderFeed(container, memes, userId, onPostClick) {
  const memesList = Array.isArray(memes) ? memes : [];
  container.innerHTML = `
    <div class="feed-header">
      <h2 class="feed-heading">Meme Feed</h2>
      <button type="button" id="post-meme-btn" class="auth-btn">Create Meme</button>
    </div>
    <div class="feed-grid" id="feedGrid">
      ${memesList.map((meme) => renderMemeCard(meme, userId)).join('')}
    </div>
    ${memesList.length === 0 ? '<p class="feed-empty">No memes yet. Create one!</p>' : ''}
  `;

  const grid = container.querySelector('#feedGrid');
  if (!grid) return;

  memesList.forEach((meme) => {
    const card = grid.querySelector(`[data-meme-id="${meme.id}"]`);
    if (!card) return;
    const voteBtn = card.querySelector('.vote-btn');
    const hasVoted = meme.votes?.some((v) => v.$user?.id === userId) ?? false;
    voteBtn.textContent = hasVoted ? 'Unvote' : 'Upvote';
    voteBtn.dataset.voted = hasVoted ? 'true' : 'false';
    voteBtn.addEventListener('click', () => handleVote(meme, hasVoted, userId));
  });

  container.querySelector('#post-meme-btn')?.addEventListener('click', onPostClick);
}

function renderMemeCard(meme, userId) {
  const voteCount = meme.votes?.length ?? 0;
  const hasVoted = meme.votes?.some((v) => v.$user?.id === userId) ?? false;
  const authorEmail = meme.author?.$user?.email ?? meme.author?.id ?? 'Anonymous';
  const imageUrl = meme.imageUrl ?? meme.$file?.url ?? '';
  const imgHtml = imageUrl
    ? `<img src="${escapeHtml(imageUrl)}" alt="Meme" class="meme-card-img" loading="lazy" />`
    : '<div class="meme-card-img meme-card-img-placeholder">Image loading...</div>';
  return `
    <article class="meme-card" data-meme-id="${meme.id}">
      ${imgHtml}
      ${meme.topText ? `<p class="meme-card-top">${escapeHtml(meme.topText)}</p>` : ''}
      ${meme.bottomText ? `<p class="meme-card-bottom">${escapeHtml(meme.bottomText)}</p>` : ''}
      <div class="meme-card-meta">
        <span class="meme-card-author">${escapeHtml(authorEmail)}</span>
        <div class="meme-card-actions">
          <button type="button" class="vote-btn" data-voted="${hasVoted}">${hasVoted ? 'Unvote' : 'Upvote'}</button>
          <span class="vote-count">${voteCount}</span>
        </div>
      </div>
    </article>
  `;
}

function handleVote(meme, hasVoted, userId) {
  if (hasVoted) {
    const vote = meme.votes?.find((v) => v.$user?.id === userId);
    if (vote) {
      db.transact(db.tx.votes[vote.id].delete());
    }
  } else {
    db.transact(
      db.tx.votes[id()].update({}).link({ meme: meme.id, $user: userId })
    );
  }
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export async function postMeme(getMemeBlob, getMemeDataUrl, getMemeData, userId, profileId) {
  const imageUrl = getMemeDataUrl?.();
  if (!imageUrl) {
    alert('Please add an image to your meme first.');
    return;
  }
  const { topText, bottomText } = getMemeData();

  try {
    await db.transact(
      db.tx.memes[id()]
        .update({
          imageUrl,
          topText: topText || '',
          bottomText: bottomText || '',
          createdAt: Date.now(),
        })
        .link({ author: profileId })
    );
  } catch (err) {
    console.error('Failed to post meme:', err);
    alert('Failed to post meme: ' + (err.message ?? 'Unknown error'));
  }
}
