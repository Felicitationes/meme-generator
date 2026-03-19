# Meme Generator

A simple web app to create memes: upload an image, add top and bottom text (white with black border), resize the text, and download the result as a PNG.

## How to run

1. Open `index.html` in a browser (double-click the file or use **File → Open**).
2. Or run a local server from this folder, for example:
   - **Python 3:** `python3 -m http.server 8000` then visit http://localhost:8000
   - **Node (npx):** `npx serve` then open the URL shown in the terminal

## Features

- **Image template** — Click the upload area or drag and drop an image.
- **Top & bottom text** — Classic meme layout; text is white with a black outline.
- **Text size** — Use the slider (12–120px) to resize the text.
- **Download** — Click "Download Meme" to save the canvas as a PNG file.

No build step or server is required; the app runs entirely in the browser.
