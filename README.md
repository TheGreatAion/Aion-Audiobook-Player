# Aion Audiobook Player

Aion is a local-first Electron audiobook player for Windows with a cover-focused library, metadata-based importing, chapter-aware playback, and persistent listening progress.

## Features

- Visual library grid with large animated cover tiles
- Multi-library import and rescan for single-file `.m4b` books, multi-part `.m4b` folders, and chapter-based `.mp3` folders
- Custom collections with dedicated pages for grouped series or shelves
- Embedded cover extraction plus `cover.jpg` / `folder.jpg` detection
- Placeholder cover generation when artwork is missing
- Dedicated player view with blurred artwork backdrop
- Play, pause, scrub, skip 30 seconds, and per-book speed memory
- Last-position resume for every audiobook
- Chapter sidebar for `.m4b` chapters and multi-file `.mp3` books
- Local JSON library database for fast startup

## Install Dependencies

From the project root:

```bash
npm.cmd install
```

## Run the App

Start the desktop app in development mode:

```bash
npm.cmd start
```

Or double-click `start-aion.bat` in the project root.

On first launch, click `Add Library` and select a folder that contains audiobooks. Repeat that for any additional folders you want merged into the same library view. `Rescan` refreshes all imported library folders.

To create a collection:

1. Click `New Collection`
2. Select the audiobooks you want grouped together
3. Click `Create Collection`
4. Enter a collection name and optional description

Click a collection card to open its dedicated page. From there you can review grouped books and use `Edit Collection Books` to change membership.

## Package a Windows Executable

Build the Windows NSIS installer:

```bash
npm.cmd run dist:win
```

Build output is written to `dist/`.

Typical artifact:

- `Aion Audiobook Player Setup 1.0.0.exe`

## Project Structure

- `main.js`: Electron entry point and IPC registration
- `preload.js`: secure bridge between main and renderer
- `src/main/library-store.js`: persisted JSON database for library and playback state
- `src/main/library-scanner.js`: audiobook detection, metadata parsing, chapter mapping, and cover extraction
- `src/renderer/index.html`: app shell markup
- `src/renderer/styles.css`: dark theme, layout, and motion
- `src/renderer/app.js`: renderer state management and UI wiring
- `src/renderer/audio-player.js`: Howler-based playback controller
- `src/renderer/virtual-grid.js`: virtualized cover grid for smooth scrolling

## Storage Notes

- Library and playback data are stored in Electron's `userData` directory in `library-db.json`
- Collections are stored in the same `library-db.json` file alongside imported library metadata
- Embedded artwork extracted from audio files is cached in `userData/covers/`
