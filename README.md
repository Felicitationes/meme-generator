# Meme Generator

A fullstack meme app: create memes, post them to a feed, and upvote others' memes. Built with vanilla JS and [InstantDB](https://instantdb.com).

## Features

- **Auth** — Magic code login (email → verification code)
- **Create memes** — Choose a template or upload your own image, add top/bottom text, customize size and color
- **Post memes** — Save memes to the shared feed
- **Feed** — Browse memes from all users, sorted by newest
- **Upvote** — One vote per user per meme; toggle to unvote

## How to run

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure InstantDB** (one-time)
   - Create a `.env` file with:
     ```
     VITE_INSTANT_APP_ID=1817d86b-3637-4bb4-8996-099b553f92bf
     ```
   - Log in to the Instant CLI and push schema/permissions:
     ```bash
     npx instant-cli@latest login
     npx instant-cli@latest push schema
     npx instant-cli@latest push perms
     ```
   - If you change the schema (e.g. add links), run `push schema` and `push perms` again.

3. **Start the dev server**
   ```bash
   npm run dev
   ```
   Then open http://localhost:5173

## Tech stack

- Vanilla JavaScript (ES modules)
- Vite
- [InstantDB](https://instantdb.com) — database, auth, file storage, realtime sync
