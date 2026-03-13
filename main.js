// main.js owns the Electron window lifecycle and the IPC boundary between renderer requests and local services.
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("node:fs");
const path = require("node:path");
const { Vibrant } = require("node-vibrant/node");
const { enrichBookMetadata } = require("./src/main/book-metadata");
const { createLibraryStore } = require("./src/main/library-store");
const { scanLibrary } = require("./src/main/library-scanner");

let mainWindow;
let store;

/** Returns the native window state payload consumed by the renderer chrome and player UI. */
function getWindowStatePayload(window = mainWindow) {
  return {
    isMaximized: window?.isMaximized() || false,
    isAlwaysOnTop: window?.isAlwaysOnTop() || false,
    isFullScreen: window?.isFullScreen() || false
  };
}

/**
 * Creates the single app window and wires native window state changes back to the renderer.
 *
 * The custom title bar in the renderer needs native maximize and always-on-top state to stay in sync,
 * so those events are forwarded here rather than duplicated in UI logic.
 *
 * @returns {BrowserWindow} The newly created Electron window.
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1480,
    height: 920,
    minWidth: 1120,
    minHeight: 720,
    frame: false,
    autoHideMenuBar: true,
    title: "Aion Audiobook Player",
    backgroundColor: "#111214",
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  if (typeof mainWindow.removeMenu === "function") {
    mainWindow.removeMenu();
  }

  const sendWindowState = () => {
    if (mainWindow?.isDestroyed()) {
      return;
    }

    mainWindow.webContents.send("window:state-changed", getWindowStatePayload(mainWindow));
  };

  mainWindow.on("maximize", sendWindowState);
  mainWindow.on("unmaximize", sendWindowState);
  mainWindow.on("enter-full-screen", sendWindowState);
  mainWindow.on("leave-full-screen", sendWindowState);
  mainWindow.on("always-on-top-changed", sendWindowState);

  mainWindow.loadFile(path.join(__dirname, "src", "renderer", "index.html"));
  return mainWindow;
}

/**
 * Scans one library folder and persists the refreshed result.
 *
 * @param {string} rootFolder - Absolute path to the library root selected by the user.
 * @returns {Promise<object>} The latest merged library state after the scan completes.
 */
async function performLibraryScan(rootFolder) {
  const library = await scanLibrary(rootFolder, store.getAssetPaths());
  store.upsertLibrary(library);
  return store.getState();
}

/**
 * Rescans every known library root that is still available on disk.
 *
 * Missing folders are skipped so a disconnected drive does not erase its cached library contents.
 *
 * @returns {Promise<object>} The latest merged library state.
 */
async function rescanAllLibraries() {
  const libraryRoots = store.getLibraryRoots();
  if (libraryRoots.length === 0) {
    return store.getState();
  }

  for (const rootFolder of libraryRoots) {
    if (!rootFolder || !fs.existsSync(rootFolder)) {
      continue;
    }

    await performLibraryScan(rootFolder);
  }

  return store.getState();
}

/**
 * Refreshes external metadata for a single book and persists the result.
 *
 * @param {string} bookId - Identifier of the book to enrich.
 * @returns {Promise<object>} A summary payload with the updated library state and match counts.
 */
async function refreshBookMetadata(bookId) {
  const book = store.getState().books.find((entry) => entry.id === bookId);
  if (!book) {
    return {
      library: store.getState(),
      refreshedCount: 0,
      matchedCount: 0
    };
  }

  const metadata = await enrichBookMetadata(book);
  store.updateBookMetadata(book.id, metadata);

  return {
    library: store.getState(),
    refreshedCount: 1,
    matchedCount: metadata.status === "matched" ? 1 : 0
  };
}

/**
 * Refreshes external metadata for every scanned book.
 *
 * Matching is done sequentially on top of the provider helpers so the store stays consistent even if
 * one provider fails for a subset of books.
 *
 * @returns {Promise<object>} A summary payload with the updated library state and match counts.
 */
async function refreshLibraryMetadata() {
  const books = store.getState().books;
  if (books.length === 0) {
    return {
      library: store.getState(),
      refreshedCount: 0,
      matchedCount: 0
    };
  }

  const entries = [];
  let matchedCount = 0;

  for (const book of books) {
    const metadata = await enrichBookMetadata(book);
    if (metadata.status === "matched") {
      matchedCount += 1;
    }

    entries.push({
      bookId: book.id,
      metadata
    });
  }

  store.updateManyBookMetadata(entries);

  return {
    library: store.getState(),
    refreshedCount: books.length,
    matchedCount
  };
}

/**
 * Extracts a compact swatch map from a cover image for fullscreen background rendering.
 *
 * @param {string} imageSrc - Local cover image path or URL.
 * @returns {Promise<object|null>} Plain swatch map keyed by Vibrant swatch name.
 */
async function extractCoverPalette(imageSrc) {
  if (typeof imageSrc !== "string" || !imageSrc) {
    return null;
  }

  try {
    const palette = await Vibrant.from(imageSrc).getPalette();
    return Object.fromEntries(
      Object.entries(palette)
        .filter(([, swatch]) => swatch?.hex)
        .map(([name, swatch]) => [name, swatch.hex])
    );
  } catch {
    return null;
  }
}

/**
 * Registers all renderer-facing IPC handlers.
 *
 * Keeping the handlers in one place makes it easier to audit which filesystem and window operations are
 * intentionally exposed through the preload bridge.
 */
function registerIpcHandlers() {
  ipcMain.handle("library:get-state", () => {
    return store.getState();
  });

  ipcMain.handle("library:add-folder", async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Add Audiobook Library",
      properties: ["openDirectory"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true, library: store.getState() };
    }

    const rootFolder = result.filePaths[0];
    const library = await performLibraryScan(rootFolder);
    return { canceled: false, library };
  });

  ipcMain.handle("library:rescan", async () => {
    return rescanAllLibraries();
  });

  ipcMain.handle("metadata:refresh-library", async () => {
    return refreshLibraryMetadata();
  });

  ipcMain.handle("metadata:refresh-book", async (_event, bookId) => {
    return refreshBookMetadata(bookId);
  });

  ipcMain.handle("visuals:extract-cover-palette", async (_event, imageSrc) => {
    return extractCoverPalette(imageSrc);
  });

  ipcMain.handle("collections:create", (_event, collection) => {
    store.createCollection(collection);
    return store.getState();
  });

  ipcMain.handle("collections:update", (_event, collectionId, changes) => {
    store.updateCollection(collectionId, changes);
    return store.getState();
  });

  ipcMain.handle("ui:update-preferences", (_event, changes) => {
    store.updateUiPreferences(changes);
    return store.getState();
  });

  ipcMain.handle("window:get-state", () => {
    return getWindowStatePayload(mainWindow);
  });

  ipcMain.handle("window:toggle-always-on-top", () => {
    if (!mainWindow) {
      return getWindowStatePayload();
    }

    const nextAlwaysOnTop = !mainWindow.isAlwaysOnTop();
    mainWindow.setAlwaysOnTop(nextAlwaysOnTop);

    if (!mainWindow.isMinimized()) {
      if (typeof mainWindow.moveTop === "function") {
        mainWindow.moveTop();
      }
      mainWindow.show();
      mainWindow.focus();
    }

    return getWindowStatePayload(mainWindow);
  });

  ipcMain.handle("window:minimize", () => {
    mainWindow?.minimize();
  });

  ipcMain.handle("window:toggle-maximize", () => {
    if (!mainWindow) {
      return getWindowStatePayload();
    }

    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }

    return getWindowStatePayload(mainWindow);
  });

  ipcMain.handle("window:toggle-fullscreen", () => {
    if (!mainWindow) {
      return getWindowStatePayload();
    }

    mainWindow.setFullScreen(!mainWindow.isFullScreen());
    return getWindowStatePayload(mainWindow);
  });

  ipcMain.handle("window:close", () => {
    mainWindow?.close();
  });

  ipcMain.handle("playback:get-state", (_event, bookId) => {
    return store.getPlaybackState(bookId);
  });

  ipcMain.handle("playback:save-state", (_event, bookId, playbackState) => {
    store.updatePlaybackState(bookId, playbackState);
    return store.getPlaybackState(bookId);
  });

  ipcMain.handle("playback:clear-state", (_event, bookId) => {
    store.clearPlaybackState(bookId);
    return store.getState();
  });
}

app.whenReady().then(() => {
  app.setAppUserModelId("com.aion.audiobookplayer");
  store = createLibraryStore(app);
  registerIpcHandlers();
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
