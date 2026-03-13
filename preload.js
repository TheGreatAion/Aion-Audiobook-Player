// preload.js exposes the small, audited API surface the renderer is allowed to call.
const { contextBridge, ipcRenderer } = require("electron");

// The bridge stays intentionally thin so validation and side effects remain centralized in the main process.
contextBridge.exposeInMainWorld("aionAPI", {
  getLibraryState: () => ipcRenderer.invoke("library:get-state"),
  addLibraryFolder: () => ipcRenderer.invoke("library:add-folder"),
  rescanLibrary: () => ipcRenderer.invoke("library:rescan"),
  refreshLibraryMetadata: () => ipcRenderer.invoke("metadata:refresh-library"),
  refreshBookMetadata: (bookId) => ipcRenderer.invoke("metadata:refresh-book", bookId),
  createCollection: (collection) => ipcRenderer.invoke("collections:create", collection),
  updateCollection: (collectionId, changes) =>
    ipcRenderer.invoke("collections:update", collectionId, changes),
  updateUiPreferences: (changes) => ipcRenderer.invoke("ui:update-preferences", changes),
  getWindowState: () => ipcRenderer.invoke("window:get-state"),
  toggleAlwaysOnTopWindow: () => ipcRenderer.invoke("window:toggle-always-on-top"),
  minimizeWindow: () => ipcRenderer.invoke("window:minimize"),
  toggleMaximizeWindow: () => ipcRenderer.invoke("window:toggle-maximize"),
  toggleFullscreenWindow: () => ipcRenderer.invoke("window:toggle-fullscreen"),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  extractCoverPalette: (imageSrc) => ipcRenderer.invoke("visuals:extract-cover-palette", imageSrc),
  onWindowStateChange: (callback) => {
    const listener = (_event, payload) => callback(payload);
    ipcRenderer.on("window:state-changed", listener);
    return () => ipcRenderer.removeListener("window:state-changed", listener);
  },
  getPlaybackState: (bookId) => ipcRenderer.invoke("playback:get-state", bookId),
  savePlaybackState: (bookId, playbackState) =>
    ipcRenderer.invoke("playback:save-state", bookId, playbackState),
  clearPlaybackState: (bookId) => ipcRenderer.invoke("playback:clear-state", bookId)
});
