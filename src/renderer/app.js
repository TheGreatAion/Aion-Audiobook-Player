// src/renderer/app.js coordinates the library grid, player UI, keyboard shortcuts, and persistence.
import { VirtualBookGrid } from "./virtual-grid.js";
import { AudiobookPlayer } from "./audio-player.js";

const api = window.aionAPI;

const elements = {
  sidebarToggleButton: document.getElementById("sidebar-toggle"),
  customTitlebar: document.getElementById("custom-titlebar"),
  customTitlebarDrag: document.getElementById("custom-titlebar-drag"),
  windowPinButton: document.getElementById("window-pin"),
  windowMinimizeButton: document.getElementById("window-minimize"),
  windowMaximizeButton: document.getElementById("window-maximize"),
  windowCloseButton: document.getElementById("window-close"),
  libraryView: document.getElementById("library-view"),
  libraryNavButton: document.getElementById("nav-library"),
  settingsNavButton: document.getElementById("nav-settings"),
  topbar: document.querySelector(".topbar"),
  chooseLibraryButton: document.getElementById("choose-library"),
  newCollectionButton: document.getElementById("new-collection"),
  cancelCollectionButton: document.getElementById("cancel-collection"),
  refreshMetadataButton: document.getElementById("refresh-metadata"),
  rescanLibraryButton: document.getElementById("rescan-library"),
  bookCount: document.getElementById("book-count"),
  libraryRoot: document.getElementById("library-root"),
  updatedAt: document.getElementById("updated-at"),
  emptyState: document.getElementById("empty-state"),
  gridScroll: document.getElementById("grid-scroll"),
  gridContent: document.getElementById("grid-content"),
  continuePanel: document.getElementById("continue-panel"),
  continueList: document.getElementById("continue-list"),
  collectionsPanel: document.getElementById("collections-panel"),
  collectionsList: document.getElementById("collections-list"),
  libraryGridPanel: document.querySelector(".library-grid-panel"),
  settingsView: document.getElementById("settings-view"),
  settingsAnimationsEnabled: document.getElementById("setting-animations-enabled"),
  settingsSidebarDefault: document.getElementById("setting-sidebar-default"),
  settingsStartView: document.getElementById("setting-start-view"),
  settingsDefaultCoverSize: document.getElementById("setting-default-cover-size"),
  settingsDefaultCoverSizeValue: document.getElementById("setting-default-cover-size-value"),
  settingsRememberCoverSize: document.getElementById("setting-remember-cover-size"),
  settingsShowContinueListening: document.getElementById("setting-show-continue-listening"),
  settingsDefaultPlaybackSpeed: document.getElementById("setting-default-playback-speed"),
  settingsSkipInterval: document.getElementById("setting-skip-interval"),
  settingsResumePosition: document.getElementById("setting-resume-position"),
  settingsShowMiniPlayer: document.getElementById("setting-show-mini-player"),
  settingsAutoRefreshMetadata: document.getElementById("setting-auto-refresh-metadata"),
  settingsShowMetadataSource: document.getElementById("setting-show-metadata-source"),
  resumeBookButton: document.getElementById("resume-book"),
  resumeBookLabel: document.getElementById("resume-book-label"),
  collectionView: document.getElementById("collection-view"),
  collectionHero: document.querySelector(".collection-hero"),
  collectionBooksPanel: document.querySelector(".collection-books-panel"),
  collectionDetailPanel: document.querySelector(".collection-detail-panel"),
  closeCollectionButton: document.getElementById("close-collection"),
  collectionTitle: document.getElementById("collection-title"),
  collectionDescription: document.getElementById("collection-description"),
  collectionBookCount: document.getElementById("collection-book-count"),
  collectionBooks: document.getElementById("collection-books"),
  collectionDetail: document.getElementById("collection-detail"),
  collectionSizeSlider: document.getElementById("collection-size-slider"),
  editCollectionButton: document.getElementById("edit-collection"),
  collectionModal: document.getElementById("collection-modal"),
  collectionModalTitle: document.getElementById("collection-modal-title"),
  collectionNameInput: document.getElementById("collection-name-input"),
  collectionDescriptionInput: document.getElementById("collection-description-input"),
  collectionModalCancel: document.getElementById("collection-modal-cancel"),
  collectionModalSave: document.getElementById("collection-modal-save"),
  playerView: document.getElementById("player-view"),
  playerBackdrop: document.getElementById("player-backdrop"),
  playerCover: document.getElementById("player-cover"),
  playerTitle: document.getElementById("player-title"),
  playerAuthor: document.getElementById("player-author"),
  playerNarrator: document.getElementById("player-narrator"),
  playerMetaExtra: document.getElementById("player-meta-extra"),
  playerMetaSource: document.getElementById("player-meta-source"),
  playerDockTitle: document.getElementById("player-dock-title"),
  playerDockAuthor: document.getElementById("player-dock-author"),
  playerDockChapter: document.getElementById("player-dock-chapter"),
  playerDockChapterBlock: document.getElementById("player-dock-chapter-block"),
  playerSummary: document.getElementById("player-summary"),
  playerSummaryPanel: document.getElementById("player-summary-panel"),
  playerSummaryToggle: document.getElementById("player-summary-toggle"),
  playerCurrentChapter: document.getElementById("player-current-chapter"),
  closePlayerButton: document.getElementById("close-player"),
  playerFullscreenButton: document.getElementById("player-fullscreen"),
  playerDockFullscreenButton: document.getElementById("player-dock-fullscreen"),
  playerChaptersToggle: document.getElementById("player-chapters-toggle"),
  chapterBackButton: document.getElementById("chapter-back"),
  chapterNextButton: document.getElementById("chapter-next"),
  progress: document.getElementById("progress"),
  bookProgressShadowFill: document.getElementById("book-progress-shadow-fill"),
  currentTime: document.getElementById("current-time"),
  totalTime: document.getElementById("total-time"),
  togglePlaybackButton: document.getElementById("toggle-playback"),
  skipBackButton: document.getElementById("skip-back"),
  skipForwardButton: document.getElementById("skip-forward"),
  volumeBubble: document.getElementById("volume-bubble"),
  volumeSlider: document.getElementById("volume-slider"),
  refreshCurrentMetadataButton: document.getElementById("refresh-current-metadata"),
  speedSelect: document.getElementById("speed-select"),
  playerDrawerBackdrop: document.getElementById("player-drawer-backdrop"),
  chapterSidebar: document.getElementById("chapter-sidebar"),
  chapterDrawerCloseButton: document.getElementById("chapter-drawer-close"),
  chapterList: document.getElementById("chapter-list"),
  miniPlayer: document.getElementById("mini-player"),
  miniPlayerCloseButton: document.getElementById("mini-player-close"),
  miniPlayerOpenButton: document.getElementById("mini-player-open"),
  miniPlayerCover: document.getElementById("mini-player-cover"),
  miniPlayerTitle: document.getElementById("mini-player-title"),
  miniPlayerMeta: document.getElementById("mini-player-meta"),
  miniPlayerChapter: document.getElementById("mini-player-chapter"),
  miniPlayerChapterButton: document.getElementById("mini-player-chapter-button"),
  miniPlayerChapterMenu: document.getElementById("mini-player-chapter-menu"),
  miniPlayerChapterList: document.getElementById("mini-player-chapter-list"),
  miniPlayerProgress: document.getElementById("mini-player-progress"),
  miniPlayerCurrentTime: document.getElementById("mini-player-current-time"),
  miniPlayerTotalTime: document.getElementById("mini-player-total-time"),
  miniPlayerVolumeSlider: document.getElementById("mini-player-volume"),
  miniPlayerBackButton: document.getElementById("mini-player-back"),
  miniPlayerSkipBackButton: document.getElementById("mini-player-skip-back"),
  miniPlayerToggleButton: document.getElementById("mini-player-toggle"),
  miniPlayerSkipForwardButton: document.getElementById("mini-player-skip-forward"),
  miniPlayerNextButton: document.getElementById("mini-player-next"),
  miniPlayerExpandButton: document.getElementById("mini-player-expand"),
  loadingOverlay: document.getElementById("loading-overlay"),
  loadingMessage: document.getElementById("loading-message"),
  toast: document.getElementById("toast")
};

const state = {
  library: {
    rootFolder: "",
    rootFolders: [],
    updatedAt: "",
    books: [],
    rootAvailable: false,
    unavailableFolders: [],
    libraries: [],
    collections: [],
    uiPreferences: {
      animationsEnabled: true,
      sidebarCollapsedByDefault: false,
      startView: "library",
      collectionCoverSize: 220,
      defaultCollectionCoverSize: 220,
      rememberCollectionCoverSize: true,
      showContinueListening: true,
      defaultPlaybackSpeed: 1,
      skipIntervalSeconds: 30,
      resumeFromLastPosition: true,
      showMiniPlayerOnMinimize: true,
      miniPlayerDockOpen: false,
      miniPlayerDockBookId: "",
      autoRefreshMetadata: false,
      showMetadataSource: true
    }
  },
  currentBookId: "",
  currentCollectionId: "",
  playerOpen: false,
  playerMinimized: false,
  playerChapterDrawerOpen: false,
  playerSummaryExpanded: false,
  playerFullscreen: false,
  playerHudVisible: true,
  playerReactiveLevel: 0,
  collectionOpen: false,
  playerSnapshot: {
    currentTime: 0,
    duration: 0,
    isPlaying: false,
    rate: 1,
    volume: 1,
    currentChapterIndex: -1,
    isReady: false
  },
  scrubValue: null,
  lastPersistAt: 0,
  lastPersistedPosition: 0,
  lastPersistedSpeed: 1,
  lastChapterBackAt: 0,
  lastChapterBackIndex: -1,
  pausedChapterIndex: -1,
  collectionSelectionMode: "",
  editingCollectionId: "",
  selectedCollectionBookIds: [],
  collectionDetailBookId: "",
  collectionCoverSize: 220,
  collectionCoverSizeSaveTimer: 0,
  playerHudIdleTimer: 0,
  playerReactiveFrame: 0,
  sidebarCollapsed: false,
  miniPlayerScrubValue: null,
  collectionDialogResolver: null,
  isWindowMaximized: false,
  isWindowAlwaysOnTop: false,
  isWindowFullScreen: false,
  toastTimer: 0,
  activeView: "library",
  initialPreferencesApplied: false,
  initialMiniPlayerDockApplied: false,
  lastRenderedChapterBookId: "",
  lastRenderedChapterIndex: -1,
  lastRenderedChaptersRef: null,
  miniPlayerChapterMenuOpen: false,
  lastRenderedMiniPlayerChapterBookId: "",
  lastRenderedMiniPlayerChapterIndex: -1,
  lastRenderedMiniPlayerChaptersRef: null,
  lastPlayerPanelsState: {
    hasChapters: null,
    showDrawer: null,
    showSummary: null
  },
  playerFullscreenPalette: null,
  playerFullscreenPaletteBookId: "",
  playerFullscreenPalettePromise: null
};

const grid = new VirtualBookGrid({
  scroller: elements.gridScroll,
  content: elements.gridContent,
  renderItem: renderBookCard
});

const player = new AudiobookPlayer({
  onUpdate: handlePlayerUpdate,
  onError: showToast,
  onEnd: () => {
    persistPlaybackState(true);
  }
});

const CHAPTER_RESTART_THRESHOLD_SECONDS = 3;
const CHAPTER_DOUBLE_CLICK_WINDOW_MS = 700;
const CHAPTER_BOUNDARY_EPSILON_SECONDS = 0.05;
const DEFAULT_LIBRARY_COVER_RATIO = 0.68;
const DEFAULT_COVER_GLOW = "rgba(255, 255, 255, 0.9)";
const DEFAULT_FULLSCREEN_PALETTE = {
  primary: "rgba(133, 92, 255, 0.42)",
  secondary: "rgba(255, 188, 73, 0.34)",
  tertiary: "rgba(90, 164, 255, 0.28)",
  shadow: "rgba(7, 7, 8, 0.88)"
};
const DEFAULT_COLLECTION_COVER_SIZE = 220;
const MIN_COLLECTION_COVER_SIZE = 150;
const MAX_COLLECTION_COVER_SIZE = 320;
const DEFAULT_PLAYBACK_SPEED = 1;
const DEFAULT_SKIP_INTERVAL_SECONDS = 30;
const MOTION_STAGGER_STEP_MS = 50;
const MOTION_VISIBILITY_HIDE_MS = 420;
const PLAYER_HUD_IDLE_MS = 1800;
const LUCIDE_STROKE_WIDTH = 1.9;
const MOTION_EASE_STANDARD = [0.22, 1, 0.36, 1];
const MOTION_EASE_SCENE = [0.16, 1, 0.3, 1];
const INTERACTIVE_MOTION_SELECTOR = [
  ".button",
  ".back-button",
  ".interactive-pill",
  ".player-inline-button",
  ".sidebar-link",
  ".sidebar-collapse-button",
  ".custom-titlebar__button",
  ".player-icon-button",
  ".transport-button",
  ".chapter-nav-button",
  ".chapter-button",
  ".mini-player__surface",
  ".mini-player__action",
  ".mini-player__control",
  ".continue-card",
  ".collection-card",
  ".book-card",
  ".collection-grid-card"
].join(", ");

const motionSeenKeys = new Set();
const lucideApi = window.lucide;
const motionApi = window.Motion;

function renderLucideIcons() {
  if (!lucideApi?.createIcons || !lucideApi?.icons) {
    return;
  }

  lucideApi.createIcons({
    icons: lucideApi.icons,
    attrs: {
      class: "ui-icon",
      "stroke-width": String(LUCIDE_STROKE_WIDTH)
    }
  });
}

function iconPlaceholder(name) {
  return `<i data-lucide="${name}"></i>`;
}

function iconSlot(name, className = "ui-icon-slot") {
  return `<span class="${className}" aria-hidden="true">${iconPlaceholder(name)}</span>`;
}

function setIconOnlyButtonContent(button, iconName) {
  if (!button) {
    return;
  }

  button.classList.add("ui-control--icon-only");
  button.innerHTML = iconSlot(iconName);
}

function setIconLabelButtonContent(button, iconName, label, { iconAfter = false } = {}) {
  if (!button) {
    return;
  }

  button.classList.add("ui-control--with-icon");
  const icon = iconSlot(iconName);
  const text = `<span class="ui-control__label">${label}</span>`;
  button.innerHTML = iconAfter ? `${text}${icon}` : `${icon}${text}`;
}

function setIconValueButtonContent(button, iconName, value) {
  if (!button) {
    return;
  }

  button.classList.add("ui-control--with-icon");
  button.innerHTML = `${iconSlot(iconName)}<span class="ui-control__value">${value}</span>`;
}

function setSidebarLinkContent(button, iconName, label) {
  if (!button) {
    return;
  }

  button.innerHTML = `${iconSlot(iconName, "sidebar-link__icon")}<span class="sidebar-link__text">${label}</span>`;
}

function ensureResumeButtonIcon() {
  const existing = elements.resumeBookButton.querySelector(".sidebar-link__icon");
  if (existing) {
    existing.innerHTML = iconPlaceholder("history");
    return;
  }

  const slot = document.createElement("span");
  slot.className = "sidebar-link__icon";
  slot.setAttribute("aria-hidden", "true");
  slot.innerHTML = iconPlaceholder("history");
  elements.resumeBookButton.prepend(slot);
}

function ensureLeadingIcon(element, iconName, className = "ui-leading-icon") {
  if (!element) {
    return;
  }

  element.classList.add("ui-control--with-icon");

  let slot = element.querySelector(`.${className}`);
  if (!slot) {
    slot = document.createElement("span");
    slot.className = className;
    slot.setAttribute("aria-hidden", "true");
    element.prepend(slot);
  }

  slot.innerHTML = iconPlaceholder(iconName);
}

function applyStaticControlIcons() {
  setSidebarLinkContent(elements.libraryNavButton, "library-big", "Library");
  setSidebarLinkContent(elements.settingsNavButton, "settings-2", "Settings");
  ensureResumeButtonIcon();
  setIconOnlyButtonContent(elements.closePlayerButton, "chevron-down");
  setIconOnlyButtonContent(elements.playerFullscreenButton, "maximize");
  setIconOnlyButtonContent(elements.playerDockFullscreenButton, "maximize");
  setIconOnlyButtonContent(elements.playerChaptersToggle, "list");
  setIconLabelButtonContent(elements.refreshCurrentMetadataButton, "refresh-cw", "Refresh Metadata");
  setIconOnlyButtonContent(elements.chapterDrawerCloseButton, "x");
  setIconLabelButtonContent(elements.closeCollectionButton, "arrow-left", "Back to library");
  ensureLeadingIcon(elements.editCollectionButton, "square-pen", "meta-pill__icon");
  setIconLabelButtonContent(elements.collectionModalCancel, "x", "Cancel");
  setIconLabelButtonContent(elements.collectionModalSave, "check", "Save Collection");
  setIconOnlyButtonContent(elements.miniPlayerExpandButton, "arrow-up");
  setIconOnlyButtonContent(elements.miniPlayerCloseButton, "x");

  const volumeIcon = document.querySelector(".volume-icon");
  const miniPlayerVolumeIcon = document.querySelector(".mini-player__volume-icon");
  if (volumeIcon) {
    volumeIcon.innerHTML = iconPlaceholder("volume-2");
  }
  if (miniPlayerVolumeIcon) {
    miniPlayerVolumeIcon.innerHTML = iconPlaceholder("volume-2");
  }

  renderLucideIcons();
}

/** Mirrors the OS-level reduced motion preference so reveals can back off automatically. */
function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Returns whether Motion-driven transitions should currently run. */
function shouldUseMotion() {
  return Boolean(motionApi?.animate) && getUiPreferences().animationsEnabled && !prefersReducedMotion();
}

/** Stops the last Motion animation assigned to an element for a specific slot. */
function stopMotionAnimation(element, slot = "__motionAnimation") {
  const controls = element?.[slot];
  if (controls?.stop) {
    controls.stop();
  }
  if (element) {
    element[slot] = null;
  }
}

/**
 * Starts a Motion animation and remembers it on the element so repeated state updates do not fight.
 *
 * @param {HTMLElement} element - Element being animated.
 * @param {object} keyframes - Motion keyframes.
 * @param {object} options - Motion timing options.
 * @param {string} [slot="__motionAnimation"] - Storage slot used to cancel the previous animation.
 * @returns {object|null} Motion animation controls.
 */
function playMotion(element, keyframes, options, slot = "__motionAnimation") {
  if (!element || !motionApi?.animate || !shouldUseMotion()) {
    return null;
  }

  stopMotionAnimation(element, slot);
  const controls = motionApi.animate(element, keyframes, options);
  element[slot] = controls;
  return controls;
}

/** Returns the directional offset used by scene/list reveal animations. */
function getRevealOffset(variant) {
  switch (variant) {
    case "down":
      return { x: 0, y: -16 };
    case "right":
      return { x: -18, y: 0 };
    case "left":
      return { x: 18, y: 0 };
    case "up":
    default:
      return { x: 0, y: 18 };
  }
}

/** Finds the inner surface that should animate alongside a visibility shell such as a modal or dock. */
function getVisibilitySurface(element) {
  if (element === elements.collectionModal) {
    return element.querySelector(".modal-card");
  }
  if (element === elements.loadingOverlay) {
    return element.querySelector(".loading-card");
  }
  if (element === elements.miniPlayer) {
    return element.querySelector(".mini-player__bar");
  }
  return null;
}

/** Returns shared hover/press animation metrics for a given interactive element. */
function getInteractiveMotionMetrics(element) {
  if (
    element.matches(".continue-card, .collection-card, .book-card, .collection-grid-card")
  ) {
    return { y: -4, hoverScale: 1.012, pressScale: 0.988 };
  }

  if (element.matches(".custom-titlebar__button, .player-icon-button, .mini-player__action")) {
    return { y: -1, hoverScale: 1.03, pressScale: 0.94 };
  }

  return { y: -1.5, hoverScale: 1.015, pressScale: 0.97 };
}

/** Animates an interactive control to its current hover/press state. */
function animateInteractiveState(element, { immediate = false } = {}) {
  if (!element) {
    return;
  }

  if (!shouldUseMotion()) {
    stopMotionAnimation(element, "__interactiveMotion");
    return;
  }

  if (element.matches(":disabled") || element.classList.contains("is-disabled")) {
    playMotion(
      element,
      { y: 0, scale: 1 },
      { duration: immediate ? 0.01 : 0.16, ease: MOTION_EASE_STANDARD },
      "__interactiveMotion"
    );
    return;
  }

  const metrics = getInteractiveMotionMetrics(element);
  const isPressed = element.dataset.motionPressed === "true";
  const isHovered = element.dataset.motionHovered === "true";
  const y = isPressed ? 0 : isHovered ? metrics.y : 0;
  const scale = isPressed ? metrics.pressScale : isHovered ? metrics.hoverScale : 1;

  playMotion(
    element,
    { y, scale },
    {
      duration: immediate ? 0.01 : isPressed ? 0.12 : 0.18,
      ease: MOTION_EASE_STANDARD
    },
    "__interactiveMotion"
  );
}

/** Registers Motion hover and press handlers for controls created by the current render pass. */
function bindMotionInteractions(root = document) {
  if (!root?.querySelectorAll || !motionApi?.hover || !motionApi?.press) {
    return;
  }

  const candidates = [];
  if (root.matches?.(INTERACTIVE_MOTION_SELECTOR)) {
    candidates.push(root);
  }
  candidates.push(...root.querySelectorAll(INTERACTIVE_MOTION_SELECTOR));

  candidates.forEach((element) => {
    if (element.dataset.motionBound === "true") {
      return;
    }

    element.dataset.motionBound = "true";
    motionApi.hover(element, () => {
      element.dataset.motionHovered = "true";
      animateInteractiveState(element);

      return () => {
        element.dataset.motionHovered = "false";
        animateInteractiveState(element);
      };
    });

    motionApi.press(element, () => {
      element.dataset.motionPressed = "true";
      animateInteractiveState(element);

      return () => {
        element.dataset.motionPressed = "false";
        animateInteractiveState(element);
      };
    });
  });
}

/**
 * Applies a one-time staggered reveal to a visible element.
 *
 * @param {HTMLElement} element - Element to animate.
 * @param {string} [key=""] - Stable key used to avoid replaying the same reveal indefinitely.
 * @param {number} [index=0] - Stagger position within a list.
 * @param {string} [variant="up"] - Motion variant consumed by CSS.
 */
function animateReveal(element, key = "", index = 0, variant = "up") {
  if (!element) {
    return;
  }

  element.style.setProperty("--stagger-index", String(index));
  element.style.setProperty("--stagger-delay", `${index * MOTION_STAGGER_STEP_MS}ms`);
  element.dataset.motionVariant = variant;

  if (!shouldUseMotion()) {
    return;
  }

  if (key && motionSeenKeys.has(key)) {
    return;
  }

  const { x, y } = getRevealOffset(variant);
  playMotion(
    element,
    {
      opacity: [0, 1],
      x: [x, 0],
      y: [y, 0],
      scale: [0.985, 1],
      filter: ["blur(8px)", "blur(0px)"]
    },
    {
      duration: 0.46,
      delay: index * (MOTION_STAGGER_STEP_MS / 1000),
      ease: MOTION_EASE_SCENE
    }
  );

  if (key) {
    motionSeenKeys.add(key);
  }
}

/**
 * Opens or closes an element using the shared visibility animation pattern.
 *
 * @param {HTMLElement} element - Target element.
 * @param {boolean} isOpen - Whether the element should be visible.
 */
function toggleAnimatedVisibility(element, isOpen) {
  if (!element) {
    return;
  }

  if (element.__visibilityTimer) {
    window.clearTimeout(element.__visibilityTimer);
  }

  const surface = getVisibilitySurface(element);
  const wasOpen = element.__isAnimatedVisible === true;
  element.__isAnimatedVisible = Boolean(isOpen);

  if (isOpen) {
    element.classList.remove("hidden");
    element.classList.add("is-open");

    if (wasOpen) {
      return;
    }

    if (!shouldUseMotion()) {
      return;
    }

    playMotion(
      element,
      { opacity: [0, 1], y: [18, 0] },
      { duration: 0.42, ease: MOTION_EASE_SCENE },
      "__visibilityMotion"
    );

    if (surface) {
      playMotion(
        surface,
        {
          opacity: [0, 1],
          y: [18, 0],
          scale: [0.985, 1],
          filter: ["blur(10px)", "blur(0px)"]
        },
        { duration: 0.46, delay: 0.03, ease: MOTION_EASE_SCENE },
        "__surfaceVisibilityMotion"
      );
    }
    return;
  }

  element.classList.remove("is-open");

  if (!wasOpen) {
    element.classList.add("hidden");
    return;
  }

  if (!shouldUseMotion()) {
    element.classList.add("hidden");
    return;
  }

  const controls = playMotion(
    element,
    { opacity: [1, 0], y: [0, 12] },
    { duration: 0.22, ease: MOTION_EASE_STANDARD },
    "__visibilityMotion"
  );

  if (surface) {
    playMotion(
      surface,
      {
        opacity: [1, 0],
        y: [0, 12],
        scale: [1, 0.985],
        filter: ["blur(0px)", "blur(8px)"]
      },
      { duration: 0.2, ease: MOTION_EASE_STANDARD },
      "__surfaceVisibilityMotion"
    );
  }

  const activeToken = Symbol("visibility");
  element.__visibilityToken = activeToken;
  Promise.resolve(controls?.finished).finally(() => {
    if (element.__visibilityToken !== activeToken) {
      return;
    }
    element.classList.add("hidden");
  });
}

/** Keeps persisted collection cover sizes within the supported visual range. */
function clampCollectionCoverSize(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_COLLECTION_COVER_SIZE;
  }

  return Math.min(
    MAX_COLLECTION_COVER_SIZE,
    Math.max(MIN_COLLECTION_COVER_SIZE, Math.round(numericValue))
  );
}

/** Keeps playback speeds aligned with the renderer control options. */
function clampPlaybackSpeed(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_PLAYBACK_SPEED;
  }

  return Math.min(2, Math.max(0.75, Number(numericValue.toFixed(2))));
}

/** Restricts skip intervals to the values the UI is designed to display consistently. */
function clampSkipIntervalSeconds(value) {
  const numericValue = Number(value);
  return [10, 15, 30, 45, 60].includes(numericValue)
    ? numericValue
    : DEFAULT_SKIP_INTERVAL_SECONDS;
}

/** Normalizes UI preferences so the renderer can render immediately without defensive branching everywhere. */
function sanitizeUiPreferences(preferences = {}) {
  const defaultCollectionCoverSize = clampCollectionCoverSize(
    preferences.defaultCollectionCoverSize ?? preferences.collectionCoverSize
  );
  const miniPlayerDockBookId =
    typeof preferences.miniPlayerDockBookId === "string" ? preferences.miniPlayerDockBookId : "";

  return {
    animationsEnabled: preferences.animationsEnabled !== false,
    sidebarCollapsedByDefault: Boolean(preferences.sidebarCollapsedByDefault),
    startView: preferences.startView === "settings" ? "settings" : "library",
    collectionCoverSize: clampCollectionCoverSize(
      preferences.collectionCoverSize ?? defaultCollectionCoverSize
    ),
    defaultCollectionCoverSize,
    rememberCollectionCoverSize: preferences.rememberCollectionCoverSize !== false,
    showContinueListening: preferences.showContinueListening !== false,
    defaultPlaybackSpeed: clampPlaybackSpeed(preferences.defaultPlaybackSpeed),
    skipIntervalSeconds: clampSkipIntervalSeconds(preferences.skipIntervalSeconds),
    resumeFromLastPosition: preferences.resumeFromLastPosition !== false,
    showMiniPlayerOnMinimize: preferences.showMiniPlayerOnMinimize !== false,
    miniPlayerDockOpen: Boolean(preferences.miniPlayerDockOpen && miniPlayerDockBookId),
    miniPlayerDockBookId,
    autoRefreshMetadata: Boolean(preferences.autoRefreshMetadata),
    showMetadataSource: preferences.showMetadataSource !== false
  };
}

/** Formats playback and chapter times for transport controls. */
function formatTime(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return "0:00";
  }

  const seconds = Math.floor(totalSeconds);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainder = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

/** Formats the topbar status line for the latest completed library scan. */
function formatUpdatedAt(timestamp) {
  if (!timestamp) {
    return "Waiting for import";
  }

  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "Waiting for import";
  }

  return `Last scan ${date.toLocaleString()}`;
}

/** Extracts a friendly leaf folder name for compact UI labels. */
function getFolderName(folderPath) {
  if (!folderPath || typeof folderPath !== "string") {
    return "";
  }

  const segments = folderPath.split(/[\\/]+/).filter(Boolean);
  return segments[segments.length - 1] || folderPath;
}

/** Summarizes one or more imported library roots for the sidebar status area. */
function formatLibrarySummary(libraries) {
  if (!Array.isArray(libraries) || libraries.length === 0) {
    return "No folders selected";
  }

  if (libraries.length === 1) {
    return getFolderName(libraries[0].rootFolder);
  }

  return `${libraries.length} folders imported`;
}

/** Formats longer runtimes for summaries, detail rails, and metadata blocks. */
function formatLongDuration(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return "0 min";
  }

  const rounded = Math.round(totalSeconds);
  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours} hr ${minutes} min`;
  }

  if (hours > 0) {
    return `${hours} hr`;
  }

  return `${Math.max(1, minutes)} min`;
}

/** Prefers imported summaries but can synthesize a readable fallback when metadata is sparse. */
function getBookSummaryText(book) {
  if (typeof book?.summary === "string" && book.summary.trim()) {
    return book.summary.trim();
  }

  if (!book) {
    return "No embedded summary was found for this audiobook.";
  }

  const pieces = [];
  if (book.title && book.author) {
    pieces.push(`${book.title} by ${book.author}.`);
  }

  if (Array.isArray(book.sections) && book.sections.length > 1) {
    pieces.push(`Imported as ${book.sections.length} parts.`);
  }

  pieces.push(`Runtime ${formatLongDuration(book.duration)}.`);

  if (book.narrator) {
    pieces.push(`Narrated by ${book.narrator}.`);
  }

  return pieces.join(" ").trim();
}

/** Builds a compact metadata line for collection cards and detail panels. */
function getCollectionBookMeta(book) {
  if (!book) {
    return "";
  }

  const chapterCount = getBookChapters(book).length;
  const partLabel =
    Array.isArray(book.sections) && book.sections.length > 1
      ? `${book.sections.length} parts`
      : `${chapterCount} chapter${chapterCount === 1 ? "" : "s"}`;

  return [
    book.author || "Unknown author",
    book.narrator ? `Narrated by ${book.narrator}` : "",
    formatLongDuration(book.duration),
    partLabel
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Condenses series, year, and genre information into one optional metadata line. */
function getMetadataDetailLine(book) {
  if (!book) {
    return "";
  }

  const pieces = [];

  if (book.publishedYear) {
    pieces.push(String(book.publishedYear));
  }

  if (book.series) {
    const seriesLabel = cleanMetadataLabel(book.series);
    pieces.push(book.seriesIndex ? `${seriesLabel} #${book.seriesIndex}` : seriesLabel);
  }

  if (Array.isArray(book.genres) && book.genres.length > 0) {
    pieces.push(book.genres.slice(0, 3).map(cleanMetadataLabel).filter(Boolean).join(" / "));
  }

  return pieces.join(" · ");
}

/** Normalizes machine-style metadata labels into cleaner UI text. */
function cleanMetadataLabel(value) {
  if (!value) {
    return "";
  }

  return String(value)
    .replace(/^[a-z]+:/i, "")
    .replace(/_/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Hides provider provenance when the related setting is turned off. */
function getMetadataSourceLine(book) {
  if (!shouldShowMetadataSource()) {
    return "";
  }

  if (!Array.isArray(book?.metadataSources) || book.metadataSources.length === 0) {
    return "";
  }

  return cleanMetadataLabel(book.metadataSources.join(" · "));
}

/** Returns only books with meaningful in-progress playback for the continue shelf. */
function getContinueListeningBooks() {
  return [...state.library.books]
    .filter((book) => {
      const position = Number(book.resumePosition) || 0;
      const duration = Number(book.duration) || 0;
      return position >= 15 && (!duration || position < duration - 5);
    })
    .sort((left, right) =>
      String(right.resumeUpdatedAt || "").localeCompare(String(left.resumeUpdatedAt || ""))
    );
}

/**
 * Syncs card frames to the natural cover image ratio so artwork is not stretched or over-cropped.
 *
 * @param {HTMLImageElement} image - Cover image element.
 * @param {HTMLElement} frame - Wrapper whose aspect ratio should follow the image.
 * @param {number} [fallbackRatio=DEFAULT_LIBRARY_COVER_RATIO] - Ratio used before the image loads.
 */
function syncCoverAspectRatio(image, frame, fallbackRatio = DEFAULT_LIBRARY_COVER_RATIO) {
  const applyRatio = () => {
    const safeRatio =
      image.naturalWidth > 0 && image.naturalHeight > 0
        ? image.naturalWidth / image.naturalHeight
        : fallbackRatio;
    frame.style.aspectRatio = String(safeRatio);
  };

  image.addEventListener("load", applyRatio);
  if (image.complete) {
    applyRatio();
  }
}

/**
 * Samples a cover image to derive a bloom color that feels tied to the artwork instead of the global theme.
 *
 * @param {HTMLImageElement} image - Loaded cover image.
 * @returns {string} CSS rgba color used by the hover glow.
 */
function getCoverGlowColor(image) {
  try {
    if (!image || image.naturalWidth <= 0 || image.naturalHeight <= 0) {
      return DEFAULT_COVER_GLOW;
    }

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      return DEFAULT_COVER_GLOW;
    }

    const sampleSize = 24;
    canvas.width = sampleSize;
    canvas.height = sampleSize;
    context.drawImage(image, 0, 0, sampleSize, sampleSize);

    const { data } = context.getImageData(0, 0, sampleSize, sampleSize);
    let red = 0;
    let green = 0;
    let blue = 0;
    let weightTotal = 0;

    for (let index = 0; index < data.length; index += 4) {
      const alpha = data[index + 3] / 255;
      if (alpha < 0.35) {
        continue;
      }

      const pixelRed = data[index];
      const pixelGreen = data[index + 1];
      const pixelBlue = data[index + 2];
      const maxChannel = Math.max(pixelRed, pixelGreen, pixelBlue);
      const minChannel = Math.min(pixelRed, pixelGreen, pixelBlue);
      const brightness = (pixelRed + pixelGreen + pixelBlue) / 3;
      const saturation = maxChannel - minChannel;

      if (brightness < 26 || brightness > 242) {
        continue;
      }

      const weight =
        alpha * (0.55 + saturation / 255) * (0.5 + Math.abs(brightness - 128) / 160);

      red += pixelRed * weight;
      green += pixelGreen * weight;
      blue += pixelBlue * weight;
      weightTotal += weight;
    }

    if (weightTotal <= 0) {
      return DEFAULT_COVER_GLOW;
    }

    const averageRed = red / weightTotal;
    const averageGreen = green / weightTotal;
    const averageBlue = blue / weightTotal;
    const channelMean = (averageRed + averageGreen + averageBlue) / 3;
    const boostedRed = Math.min(255, Math.round(channelMean + (averageRed - channelMean) * 1.4 + 18));
    const boostedGreen = Math.min(
      255,
      Math.round(channelMean + (averageGreen - channelMean) * 1.4 + 18)
    );
    const boostedBlue = Math.min(
      255,
      Math.round(channelMean + (averageBlue - channelMean) * 1.4 + 18)
    );
    const mixedRed = Math.round(boostedRed * 0.96 + 255 * 0.04);
    const mixedGreen = Math.round(boostedGreen * 0.96 + 255 * 0.04);
    const mixedBlue = Math.round(boostedBlue * 0.96 + 255 * 0.04);

    return `rgba(${mixedRed}, ${mixedGreen}, ${mixedBlue}, 0.96)`;
  } catch {
    return DEFAULT_COVER_GLOW;
  }
}

/**
 * Applies the sampled cover glow color to one or more UI targets.
 *
 * @param {HTMLImageElement} image - Cover image to sample.
 * @param {...HTMLElement} targets - Elements that should receive the derived glow color.
 */
function bindCoverGlow(image, ...targets) {
  const applyGlow = () => {
    const glowColor = getCoverGlowColor(image);
    targets.filter(Boolean).forEach((target) => {
      target.style.setProperty("--cover-glow", glowColor);
    });
  };

  image.addEventListener("load", applyGlow);
  if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
    applyGlow();
  }
}

/** Converts a swatch hex string into the rgba value format used by the fullscreen background CSS. */
function hexToRgba(hexColor, alpha = 1) {
  if (typeof hexColor !== "string" || !hexColor.startsWith("#")) {
    return `rgba(255, 255, 255, ${alpha})`;
  }

  const normalizedHex = hexColor.length === 4
    ? `#${hexColor[1]}${hexColor[1]}${hexColor[2]}${hexColor[2]}${hexColor[3]}${hexColor[3]}`
    : hexColor;
  const red = Number.parseInt(normalizedHex.slice(1, 3), 16);
  const green = Number.parseInt(normalizedHex.slice(3, 5), 16);
  const blue = Number.parseInt(normalizedHex.slice(5, 7), 16);

  if (![red, green, blue].every(Number.isFinite)) {
    return `rgba(255, 255, 255, ${alpha})`;
  }

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

/** Applies the current fullscreen palette to the player view so CSS can animate the derived colors. */
function applyPlayerFullscreenPalette(palette = DEFAULT_FULLSCREEN_PALETTE) {
  const resolvedPalette = palette || DEFAULT_FULLSCREEN_PALETTE;
  elements.playerView.style.setProperty("--player-fs-color-1", resolvedPalette.primary);
  elements.playerView.style.setProperty("--player-fs-color-2", resolvedPalette.secondary);
  elements.playerView.style.setProperty("--player-fs-color-3", resolvedPalette.tertiary);
  elements.playerView.style.setProperty("--player-fs-shadow", resolvedPalette.shadow);
}

/** Extracts a compact cover palette for fullscreen mode and caches it per book to avoid repeated work. */
async function updatePlayerFullscreenPalette(book = getCurrentBook()) {
  if (!book?.cover?.src) {
    state.playerFullscreenPalette = DEFAULT_FULLSCREEN_PALETTE;
    state.playerFullscreenPaletteBookId = "";
    applyPlayerFullscreenPalette(DEFAULT_FULLSCREEN_PALETTE);
    return DEFAULT_FULLSCREEN_PALETTE;
  }

  if (state.playerFullscreenPaletteBookId === book.id && state.playerFullscreenPalette) {
    applyPlayerFullscreenPalette(state.playerFullscreenPalette);
    return state.playerFullscreenPalette;
  }

  if (state.playerFullscreenPalettePromise && state.playerFullscreenPaletteBookId === book.id) {
    return state.playerFullscreenPalettePromise;
  }

  state.playerFullscreenPaletteBookId = book.id;
  state.playerFullscreenPalettePromise = api.extractCoverPalette(book.cover.src)
    .then((palette) => {
      const swatches = [
        palette?.Vibrant,
        palette?.LightVibrant,
        palette?.Muted,
        palette?.DarkVibrant,
        palette?.DarkMuted
      ].filter(Boolean);

      const resolvedPalette = {
        primary: hexToRgba(swatches[0] || "#855cff", 0.42),
        secondary: hexToRgba(swatches[1] || swatches[0] || "#ffbc49", 0.34),
        tertiary: hexToRgba(swatches[2] || swatches[1] || "#5aa4ff", 0.28),
        shadow: hexToRgba(swatches[3] || swatches[4] || "#070708", 0.88)
      };

      state.playerFullscreenPalette = resolvedPalette;
      applyPlayerFullscreenPalette(resolvedPalette);
      return resolvedPalette;
    })
    .catch(() => {
      state.playerFullscreenPalette = DEFAULT_FULLSCREEN_PALETTE;
      applyPlayerFullscreenPalette(DEFAULT_FULLSCREEN_PALETTE);
      return DEFAULT_FULLSCREEN_PALETTE;
    })
    .finally(() => {
      state.playerFullscreenPalettePromise = null;
    });

  return state.playerFullscreenPalettePromise;
}

/** Shows or hides the fullscreen HUD and cursor without affecting the normal player layout. */
function setPlayerHudVisible(isVisible) {
  state.playerHudVisible = Boolean(isVisible || !state.playerFullscreen);
  elements.playerView.classList.toggle("player-hud-hidden", !state.playerHudVisible && state.playerFullscreen);
}

/** Resets the fullscreen HUD idle timer so controls fade away only after the user stops interacting. */
function schedulePlayerHudHide() {
  window.clearTimeout(state.playerHudIdleTimer);
  if (!state.playerFullscreen || !state.playerOpen) {
    setPlayerHudVisible(true);
    return;
  }

  setPlayerHudVisible(true);
  state.playerHudIdleTimer = window.setTimeout(() => {
    if (state.playerFullscreen && state.playerOpen) {
      setPlayerHudVisible(false);
    }
  }, PLAYER_HUD_IDLE_MS);
}

/** Drives the fullscreen background's subtle reactive CSS variables from the current audio energy level. */
function updatePlayerReactiveScene() {
  state.playerReactiveLevel = player.getReactiveLevel?.() || 0;
  const softLevel = Math.max(0, Math.min(1, state.playerReactiveLevel));
  elements.playerView.style.setProperty("--player-reactive-level", softLevel.toFixed(4));
  elements.playerView.style.setProperty("--player-reactive-boost", `${1 + softLevel * 0.18}`);

  if (!state.playerOpen || !state.playerFullscreen) {
    state.playerReactiveFrame = 0;
    return;
  }

  state.playerReactiveFrame = window.requestAnimationFrame(updatePlayerReactiveScene);
}

/** Starts the fullscreen animation loop only while the immersive player is active. */
function startPlayerReactiveLoop() {
  if (state.playerReactiveFrame) {
    return;
  }

  updatePlayerReactiveScene();
}

/** Stops the fullscreen animation loop when the immersive mode is not active. */
function stopPlayerReactiveLoop() {
  if (!state.playerReactiveFrame) {
    return;
  }

  window.cancelAnimationFrame(state.playerReactiveFrame);
  state.playerReactiveFrame = 0;
}

/** Returns the currently active book from merged library state. */
function getCurrentBook() {
  return state.library.books.find((book) => book.id === state.currentBookId) || null;
}

/** Returns the currently open collection, if any. */
function getCurrentCollection() {
  return state.library.collections.find((collection) => collection.id === state.currentCollectionId) || null;
}

/** Resolves full book records for the currently open collection. */
function getBooksForCollection(collection = getCurrentCollection()) {
  if (!collection) {
    return [];
  }

  const bookMap = new Map(state.library.books.map((book) => [book.id, book]));
  return collection.bookIds
    .map((bookId) => bookMap.get(bookId))
    .filter(Boolean);
}

/** Indicates whether the library grid is acting as a collection picker instead of a launch surface. */
function isCollectionSelectionMode() {
  return state.collectionSelectionMode === "create" || state.collectionSelectionMode === "edit";
}

/** Checks whether a book is currently selected while creating or editing a collection. */
function isBookSelectedForCollection(bookId) {
  return state.selectedCollectionBookIds.includes(bookId);
}

/** Guarantees the player always has at least one chapter-like segment to work with. */
function getBookChapters(book = getCurrentBook()) {
  if (!book) {
    return [];
  }

  const chapters = Array.isArray(book.chapters) ? book.chapters : [];
  if (chapters.length > 0) {
    return chapters;
  }

  return [
    {
      id: `${book.id}-chapter-fallback`,
      title: book.title,
      start: 0,
      end: book.duration || 0
    }
  ];
}

/**
 * Resolves the chapter title that corresponds to a book's saved resume position.
 *
 * @param {object} book - Book whose chapter list should be inspected.
 * @param {number} time - Absolute playback time in seconds.
 * @returns {string} Chapter title or an empty string when no chapter can be resolved.
 */
function getChapterTitleForTime(book, time) {
  const chapters = getBookChapters(book);
  if (chapters.length === 0) {
    return "";
  }

  const safeTime = Math.max(0, Number(time) || 0);

  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index];
    const start = Number.isFinite(chapter.start) ? chapter.start : 0;
    const end = Number.isFinite(chapter.end) ? chapter.end : start;
    const isLast = index === chapters.length - 1;

    if (safeTime >= start && (safeTime < end || isLast)) {
      return chapter.title || "";
    }
  }

  return chapters[chapters.length - 1]?.title || "";
}

/**
 * Resolves which chapter a timeline position belongs to.
 *
 * Boundary handling matters here because chapter navigation should feel consistent when the user pauses
 * exactly on a chapter edge or clicks next/previous repeatedly.
 *
 * @param {number} [time=state.playerSnapshot.currentTime || 0] - Absolute playback time.
 * @param {{ boundaryBias?: "current" | "previous" }} [options={}] - Which side of a boundary should win.
 * @returns {number} Chapter index or -1 when no chapters exist.
 */
function getChapterIndexForTime(
  time = state.playerSnapshot.currentTime || 0,
  { boundaryBias = "current" } = {}
) {
  const chapters = getBookChapters();
  if (chapters.length === 0) {
    return -1;
  }

  const safeTime = Math.max(0, time);

  for (let index = 0; index < chapters.length; index += 1) {
    const chapter = chapters[index];
    const start = Number.isFinite(chapter.start) ? chapter.start : 0;
    const end = Number.isFinite(chapter.end) ? chapter.end : start;
    const isLast = index === chapters.length - 1;

    if (safeTime > start && safeTime < end) {
      return index;
    }

    if (Math.abs(safeTime - start) <= CHAPTER_BOUNDARY_EPSILON_SECONDS) {
      return boundaryBias === "previous" && index > 0 ? index - 1 : index;
    }

    if (Math.abs(safeTime - end) <= CHAPTER_BOUNDARY_EPSILON_SECONDS) {
      if (boundaryBias === "previous" || isLast) {
        return index;
      }

      return index + 1;
    }

    if (isLast && safeTime > end) {
      return index;
    }
  }

  return chapters.length - 1;
}

/** Returns a safe seek target just inside a chapter to avoid boundary ambiguity. */
function getChapterSeekTime(chapterIndex) {
  const chapters = getBookChapters();
  const chapter = chapters[chapterIndex];
  if (!chapter) {
    return 0;
  }

  if (chapterIndex === 0) {
    return chapter.start || 0;
  }

  const end = Number.isFinite(chapter.end) ? chapter.end : chapter.start || 0;
  return Math.min((chapter.start || 0) + CHAPTER_BOUNDARY_EPSILON_SECONDS, end);
}

/** Returns the chapter the player UI should currently feature. */
function getActiveChapter() {
  const chapters = getBookChapters();
  if (chapters.length === 0) {
    return null;
  }

  const index = getDisplayChapterIndex();
  if (index >= 0 && index < chapters.length) {
    return chapters[index];
  }

  return chapters[0];
}

/** Chooses the displayed chapter index, including paused-state overrides used by the chapter buttons. */
function getDisplayChapterIndex() {
  const chapters = getBookChapters();
  if (chapters.length === 0) {
    return -1;
  }

  if (!state.playerSnapshot.isPlaying && state.pausedChapterIndex >= 0) {
    return Math.min(state.pausedChapterIndex, chapters.length - 1);
  }

  const index = getChapterIndexForTime(state.playerSnapshot.currentTime, {
    boundaryBias: "previous"
  });
  if (index >= 0 && index < chapters.length) {
    return index;
  }

  return 0;
}

/** Shows or hides the blocking loading overlay with context-specific status text. */
function setBusy(isBusy, label = "Scanning library...") {
  elements.loadingMessage.textContent = label;
  toggleAnimatedVisibility(elements.loadingOverlay, isBusy);
}

/** Shows a short-lived toast message using the shared animated visibility helper. */
function showToast(message) {
  if (!message) {
    return;
  }

  elements.toast.textContent = message;
  toggleAnimatedVisibility(elements.toast, true);

  if (state.toastTimer) {
    window.clearTimeout(state.toastTimer);
  }

  state.toastTimer = window.setTimeout(() => {
    toggleAnimatedVisibility(elements.toast, false);
  }, 3200);
}

/** Syncs the custom title bar controls with the current native window state. */
function applyWindowState(windowState = {}) {
  state.isWindowMaximized = Boolean(windowState?.isMaximized);
  state.isWindowAlwaysOnTop = Boolean(windowState?.isAlwaysOnTop);
  state.isWindowFullScreen = Boolean(windowState?.isFullScreen);
  state.playerFullscreen = Boolean(state.isWindowFullScreen && state.playerOpen);
  document.body.classList.toggle("window-maximized", state.isWindowMaximized);
  document.body.classList.toggle("window-pinned", state.isWindowAlwaysOnTop);
  document.body.classList.toggle("window-fullscreen", state.isWindowFullScreen);
  elements.playerView.classList.toggle("player-fullscreen", state.playerFullscreen);
  elements.windowMaximizeButton.setAttribute(
    "aria-label",
    state.isWindowMaximized ? "Restore window" : "Maximize window"
  );
  elements.windowMaximizeButton.title = state.isWindowMaximized
    ? "Restore window"
    : "Maximize window";
  elements.windowPinButton.classList.toggle("is-active", state.isWindowAlwaysOnTop);
  elements.windowPinButton.setAttribute(
    "aria-label",
    state.isWindowAlwaysOnTop ? "Disable always on top" : "Enable always on top"
  );
  elements.windowPinButton.title = state.isWindowAlwaysOnTop
    ? "Disable always on top"
    : "Enable always on top";
  setIconOnlyButtonContent(elements.windowPinButton, state.isWindowAlwaysOnTop ? "pin" : "pin-off");
  setIconOnlyButtonContent(elements.windowMinimizeButton, "minus");
  setIconOnlyButtonContent(
    elements.windowMaximizeButton,
    state.isWindowMaximized ? "copy" : "square"
  );
  setIconOnlyButtonContent(elements.windowCloseButton, "x");
  setIconOnlyButtonContent(
    elements.playerFullscreenButton,
    state.playerFullscreen ? "minimize" : "maximize"
  );
  setIconOnlyButtonContent(
    elements.playerDockFullscreenButton,
    state.playerFullscreen ? "minimize" : "maximize"
  );
  elements.playerFullscreenButton?.setAttribute(
    "aria-label",
    state.playerFullscreen ? "Exit fullscreen" : "Enter fullscreen"
  );
  elements.playerFullscreenButton.title = state.playerFullscreen ? "Exit fullscreen" : "Enter fullscreen";
  elements.playerDockFullscreenButton?.setAttribute(
    "aria-label",
    state.playerFullscreen ? "Exit fullscreen" : "Enter fullscreen"
  );
  elements.playerDockFullscreenButton.title = state.playerFullscreen ? "Exit fullscreen" : "Enter fullscreen";
  elements.playerFullscreenButton?.classList.toggle("is-active", state.playerFullscreen);
  elements.playerDockFullscreenButton?.classList.toggle("is-active", state.playerFullscreen);

  if (state.playerFullscreen) {
    schedulePlayerHudHide();
    startPlayerReactiveLoop();
  } else {
    setPlayerHudVisible(true);
    stopPlayerReactiveLoop();
  }

  if (state.playerOpen) {
    renderPlayer();
  }

  renderLucideIcons();
}

/** Applies the sidebar collapsed state and keeps the toggle affordance in sync. */
function applySidebarState(isCollapsed) {
  state.sidebarCollapsed = Boolean(isCollapsed);
  document.body.classList.toggle("sidebar-collapsed", state.sidebarCollapsed);
  elements.sidebarToggleButton.innerHTML = state.sidebarCollapsed ? "&#10095;" : "&#10094;";
  elements.sidebarToggleButton.setAttribute(
    "aria-label",
    state.sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
  );
  elements.sidebarToggleButton.title = state.sidebarCollapsed
    ? "Expand sidebar"
    : "Collapse sidebar";
  setIconOnlyButtonContent(
    elements.sidebarToggleButton,
    state.sidebarCollapsed ? "panel-left-open" : "panel-left-close"
  );
  renderLucideIcons();
}

/** Returns the sanitized UI preference snapshot currently loaded in renderer state. */
function getUiPreferences() {
  return sanitizeUiPreferences(state.library.uiPreferences);
}

/** Reads the configured skip interval once and returns it in a safe, clamped form. */
function getSkipIntervalSeconds() {
  return clampSkipIntervalSeconds(getUiPreferences().skipIntervalSeconds);
}

/** Indicates whether the continue shelf should be rendered. */
function shouldShowContinueListening() {
  return getUiPreferences().showContinueListening;
}

/** Indicates whether metadata provider names should be shown in detail views. */
function shouldShowMetadataSource() {
  return getUiPreferences().showMetadataSource;
}

/** Indicates whether books should reopen from saved positions by default. */
function shouldResumeFromLastPosition() {
  return getUiPreferences().resumeFromLastPosition;
}

/** Indicates whether minimizing the player should surface the bottom dock. */
function shouldShowMiniPlayerOnMinimize() {
  return getUiPreferences().showMiniPlayerOnMinimize;
}

/** Indicates whether the live collection cover size should be remembered between sessions. */
function shouldRememberCollectionCoverSize() {
  return getUiPreferences().rememberCollectionCoverSize;
}

/** Resolves the cover size that should be applied to collection pages right now. */
function getResolvedCollectionCoverSize() {
  const preferences = getUiPreferences();
  return preferences.rememberCollectionCoverSize
    ? clampCollectionCoverSize(preferences.collectionCoverSize)
    : clampCollectionCoverSize(preferences.defaultCollectionCoverSize);
}

/** Pushes document-level preference flags into CSS-driven behavior such as motion. */
function applyUiPreferencesToDocument() {
  const preferences = getUiPreferences();
  document.body.dataset.motion = preferences.animationsEnabled ? "on" : "off";
}

/** Switches between the main library and settings base views. */
function setActiveView(view) {
  state.activeView = view === "settings" ? "settings" : "library";
  elements.libraryNavButton.classList.toggle("is-active", state.activeView === "library");
  elements.settingsNavButton.classList.toggle("is-active", state.activeView === "settings");
  const showLibraryView = state.activeView === "library";
  elements.topbar.classList.toggle("hidden", !showLibraryView);
  if (!showLibraryView) {
    elements.continuePanel.classList.add("hidden");
    elements.collectionsPanel.classList.add("hidden");
    elements.libraryGridPanel.classList.add("hidden");
  }
  elements.settingsView.classList.toggle("hidden", state.activeView !== "settings");
}

/** Updates the settings form controls to reflect the current stored preference state. */
function updateSettingControlState() {
  const preferences = getUiPreferences();
  elements.settingsAnimationsEnabled.checked = preferences.animationsEnabled;
  elements.settingsSidebarDefault.value = preferences.sidebarCollapsedByDefault
    ? "collapsed"
    : "expanded";
  elements.settingsStartView.value = preferences.startView;
  elements.settingsDefaultCoverSize.value = String(preferences.defaultCollectionCoverSize);
  elements.settingsDefaultCoverSizeValue.textContent = `${preferences.defaultCollectionCoverSize}px`;
  elements.settingsRememberCoverSize.checked = preferences.rememberCollectionCoverSize;
  elements.settingsShowContinueListening.checked = preferences.showContinueListening;
  elements.settingsDefaultPlaybackSpeed.value = String(preferences.defaultPlaybackSpeed);
  elements.settingsSkipInterval.value = String(preferences.skipIntervalSeconds);
  elements.settingsResumePosition.checked = preferences.resumeFromLastPosition;
  elements.settingsShowMiniPlayer.checked = preferences.showMiniPlayerOnMinimize;
  elements.settingsAutoRefreshMetadata.checked = preferences.autoRefreshMetadata;
  elements.settingsShowMetadataSource.checked = preferences.showMetadataSource;
}

/** Replays the main library scene reveals after the base view has been rendered. */
function animateLibrarySections() {
  animateReveal(elements.topbar, "scene:topbar", 0, "down");
  if (!elements.continuePanel.classList.contains("hidden")) {
    animateReveal(elements.continuePanel, "scene:continue-panel", 1, "up");
  }
  if (!elements.collectionsPanel.classList.contains("hidden")) {
    animateReveal(elements.collectionsPanel, "scene:collections-panel", 2, "up");
  }
  animateReveal(elements.libraryGridPanel, "scene:grid-panel", 3, "up");
}

/** Mirrors saved resume state back into the in-memory library list so the UI updates immediately. */
function applyResumeStateToLibrary(bookId, position, speed, updatedAt = new Date().toISOString()) {
  if (!bookId) {
    return;
  }

  state.library.books = state.library.books.map((book) =>
    book.id === bookId
      ? {
          ...book,
          resumePosition: Math.max(0, Number(position) || 0),
          resumeSpeed: Number.isFinite(speed) ? speed : book.resumeSpeed || 1,
          resumeUpdatedAt: updatedAt
        }
      : book
  );
}

/** Applies the live collection cover size to state, slider UI, and CSS custom properties. */
function applyCollectionCoverSize(size) {
  const nextSize = clampCollectionCoverSize(size);
  state.collectionCoverSize = nextSize;
  elements.collectionSizeSlider.value = String(nextSize);
  elements.collectionBooks.style.setProperty("--collection-cover-size", `${nextSize}px`);
}

/**
 * Persists UI preference changes through the preload bridge.
 *
 * @param {object} changes - Partial preference updates.
 * @param {{ silent?: boolean }} [options={}] - Whether failures should show a toast.
 * @returns {Promise<object|null>} Updated library state or null when the save fails.
 */
async function persistUiPreferences(changes, { silent = true } = {}) {
  try {
    const library = await api.updateUiPreferences(changes);
    updateLibraryState(library);
    return library;
  } catch (error) {
    if (!silent) {
      showToast(error?.message || "Unable to save settings.");
    }
    return null;
  }
}

/** Captures the bottom dock state so the next launch can restore the same paused mini-player session. */
function getMiniPlayerDockPreferenceState() {
  const dockVisible = Boolean(
    state.currentBookId &&
      state.playerMinimized &&
      !state.playerOpen &&
      shouldShowMiniPlayerOnMinimize()
  );

  return {
    miniPlayerDockOpen: dockVisible,
    miniPlayerDockBookId: dockVisible ? state.currentBookId : ""
  };
}

/** Persists dock visibility only when the remembered launch state actually changed. */
async function persistMiniPlayerDockPreference() {
  const nextState = getMiniPlayerDockPreferenceState();
  const preferences = getUiPreferences();

  if (
    preferences.miniPlayerDockOpen === nextState.miniPlayerDockOpen &&
    preferences.miniPlayerDockBookId === nextState.miniPlayerDockBookId
  ) {
    return null;
  }

  return persistUiPreferences(nextState);
}

/** Persists the current collection cover size only when the remember-size setting is enabled. */
async function persistCollectionCoverSize() {
  if (!shouldRememberCollectionCoverSize()) {
    return;
  }

  const coverSize = clampCollectionCoverSize(state.collectionCoverSize);
  const currentSavedSize = clampCollectionCoverSize(getUiPreferences().collectionCoverSize);
  if (coverSize === currentSavedSize) {
    return;
  }

  await persistUiPreferences(
    {
      collectionCoverSize: coverSize
    },
    { silent: false }
  );
}

/** Debounces cover-size persistence so dragging the slider does not spam disk writes. */
function scheduleCollectionCoverSizeSave() {
  window.clearTimeout(state.collectionCoverSizeSaveTimer);
  state.collectionCoverSizeSaveTimer = window.setTimeout(() => {
    void persistCollectionCoverSize();
  }, 180);
}

/** Replaces renderer library state and reconciles any dependent UI state that may now be invalid. */
function updateLibraryState(library) {
  const previousPreferences = getUiPreferences();
  state.library = {
    rootFolder: library?.rootFolder || "",
    rootFolders: Array.isArray(library?.rootFolders) ? library.rootFolders : [],
    updatedAt: library?.updatedAt || "",
    books: Array.isArray(library?.books) ? library.books : [],
    rootAvailable: Boolean(library?.rootAvailable),
    unavailableFolders: Array.isArray(library?.unavailableFolders) ? library.unavailableFolders : [],
    libraries: Array.isArray(library?.libraries) ? library.libraries : [],
    collections: Array.isArray(library?.collections) ? library.collections : [],
    uiPreferences: sanitizeUiPreferences(library?.uiPreferences)
  };
  const preferences = getUiPreferences();

  if (!state.initialPreferencesApplied) {
    applySidebarState(preferences.sidebarCollapsedByDefault);
    state.activeView = preferences.startView;
    state.initialPreferencesApplied = true;
  }

  if (!state.initialMiniPlayerDockApplied) {
    state.initialMiniPlayerDockApplied = true;
    const shouldRestoreDock =
      Boolean(preferences.miniPlayerDockOpen && preferences.miniPlayerDockBookId) &&
      shouldShowMiniPlayerOnMinimize() &&
      !state.currentBookId;

    if (shouldRestoreDock) {
      const dockBook = state.library.books.find((book) => book.id === preferences.miniPlayerDockBookId);
      if (dockBook) {
        const resumePosition = Number.isFinite(dockBook.resumePosition) ? Math.max(0, dockBook.resumePosition) : 0;
        const resumeSpeed = Number.isFinite(dockBook.resumeSpeed)
          ? clampPlaybackSpeed(dockBook.resumeSpeed)
          : preferences.defaultPlaybackSpeed;
        const currentChapterIndex = getChapterIndexForTime(resumePosition, {
          boundaryBias: "previous"
        });

        state.currentBookId = dockBook.id;
        state.playerMinimized = true;
        state.playerOpen = false;
        state.playerChapterDrawerOpen = false;
        state.playerSummaryExpanded = false;
        state.miniPlayerScrubValue = null;
        state.pausedChapterIndex = currentChapterIndex;
        state.lastPersistedPosition = resumePosition;
        state.lastPersistedSpeed = resumeSpeed;
        state.playerSnapshot = {
          ...state.playerSnapshot,
          currentTime: resumePosition,
          duration: Number.isFinite(dockBook.duration) ? dockBook.duration : 0,
          isPlaying: false,
          rate: resumeSpeed,
          currentChapterIndex,
          isReady: false
        };
        // Load the paused book into the playback engine so dock controls work immediately after relaunch.
        player.load(dockBook, {
          position: resumePosition,
          speed: resumeSpeed
        });
      }
    }
  }

  applyUiPreferencesToDocument();

  if (
    !shouldRememberCollectionCoverSize() ||
    preferences.collectionCoverSize !== previousPreferences.collectionCoverSize ||
    preferences.defaultCollectionCoverSize !== previousPreferences.defaultCollectionCoverSize
  ) {
    applyCollectionCoverSize(getResolvedCollectionCoverSize());
  }

  if (state.currentBookId && !getCurrentBook()) {
    state.currentBookId = "";
    state.playerOpen = false;
    state.playerMinimized = false;
  }

  if (state.currentCollectionId && !getCurrentCollection()) {
    state.currentCollectionId = "";
    state.collectionOpen = false;
    state.collectionDetailBookId = "";
  }

  if (isCollectionSelectionMode()) {
    const validBookIds = new Set(state.library.books.map((book) => book.id));
    state.selectedCollectionBookIds = state.selectedCollectionBookIds.filter((bookId) =>
      validBookIds.has(bookId)
    );
  }

  renderLibrary();
  updateSettingControlState();
  setActiveView(state.activeView);
  renderSettings();
  renderCollections();
  renderCollectionView();
  renderPlayer();
  void persistMiniPlayerDockPreference();
}

/** Renders the base library view, including shelves, counts, and collection-selection mode state. */
function renderLibrary() {
  const bookCount = state.library.books.length;
  const currentBook = getCurrentBook();
  const continueBooks = getContinueListeningBooks();
  const libraryCount = state.library.libraries.length;
  const librarySummary = formatLibrarySummary(state.library.libraries);
  const libraryTooltip = state.library.libraries.map((entry) => entry.rootFolder).join("\n");
  const selectionMode = isCollectionSelectionMode();
  const isEditingCollection = state.collectionSelectionMode === "edit";

  elements.bookCount.textContent = String(bookCount);
  elements.libraryRoot.textContent = librarySummary;
  elements.libraryRoot.title = libraryTooltip || librarySummary;
  elements.updatedAt.textContent = formatUpdatedAt(state.library.updatedAt);
  elements.rescanLibraryButton.disabled = libraryCount === 0;
  elements.refreshMetadataButton.disabled = bookCount === 0;
  elements.newCollectionButton.textContent = selectionMode
    ? isEditingCollection
      ? "Save Collection"
      : "Create Collection"
    : "New Collection";
  elements.cancelCollectionButton.classList.toggle("hidden", !selectionMode);
  setIconLabelButtonContent(elements.chooseLibraryButton, "folder-plus", "Add Library");
  setIconLabelButtonContent(
    elements.newCollectionButton,
    selectionMode ? "check" : "folder-plus",
    elements.newCollectionButton.textContent
  );
  setIconLabelButtonContent(elements.cancelCollectionButton, "x", "Cancel");
  setIconLabelButtonContent(elements.refreshMetadataButton, "refresh-cw", "Refresh Metadata");
  setIconLabelButtonContent(elements.rescanLibraryButton, "refresh-cw", "Rescan");

  elements.emptyState.classList.toggle("hidden", bookCount > 0);
  elements.gridScroll.classList.toggle("hidden", bookCount === 0);
  elements.continuePanel.classList.toggle(
    "hidden",
    state.activeView !== "library" ||
      selectionMode ||
      !shouldShowContinueListening() ||
      continueBooks.length === 0
  );
  elements.collectionsPanel.classList.toggle(
    "hidden",
    state.activeView !== "library" || state.library.collections.length === 0
  );
  elements.libraryGridPanel.classList.toggle("hidden", state.activeView !== "library");
  grid.setItems(state.library.books);
  renderContinueListening(continueBooks);
  if (state.activeView === "library") {
    animateLibrarySections();
  }

  if (selectionMode) {
    elements.resumeBookButton.classList.remove("hidden");
    elements.resumeBookLabel.textContent = `${state.selectedCollectionBookIds.length} selected`;
    elements.resumeBookButton.disabled = true;
  } else if (currentBook) {
    elements.resumeBookButton.classList.remove("hidden");
    elements.resumeBookLabel.textContent = currentBook.title;
    elements.resumeBookButton.disabled = false;
  } else {
    elements.resumeBookButton.classList.add("hidden");
    elements.resumeBookLabel.textContent = "Nothing yet";
    elements.resumeBookButton.disabled = true;
  }

  renderLucideIcons();
  bindMotionInteractions(elements.libraryView);
}

/** Renders the settings page shell and its entry animation. */
function renderSettings() {
  updateSettingControlState();
  if (state.activeView === "settings") {
    animateReveal(elements.settingsView, "scene:settings-view", 0, "up");
  }
  bindMotionInteractions(elements.settingsView);
}

/**
 * Renders the horizontal continue-listening shelf.
 *
 * @param {Array<object>} books - Books with saved progress.
 */
function renderContinueListening(books) {
  elements.continueList.replaceChildren();

  if (!Array.isArray(books) || books.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  books.forEach((book, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "continue-card";
    button.addEventListener("click", () => {
      void openBook(book.id, {
        resumePosition: Number(book.resumePosition),
        resumeSpeed: Number(book.resumeSpeed)
      });
    });

    const dismissButton = document.createElement("button");
    dismissButton.type = "button";
    dismissButton.className = "continue-card__dismiss";
    dismissButton.setAttribute("aria-label", `Remove ${book.title} from Continue Listening`);
    dismissButton.title = "Clear saved progress";
    setIconOnlyButtonContent(dismissButton, "x");
    dismissButton.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      void clearContinueProgress(book.id);
    });

    const coverShell = document.createElement("div");
    coverShell.className = "continue-card__cover-shell";

    const cover = document.createElement("img");
    cover.className = "continue-card__cover";
    cover.src = book.cover?.src || "";
    cover.alt = `${book.title} cover`;
    cover.loading = "lazy";
    bindCoverGlow(cover, coverShell);

    const body = document.createElement("div");
    body.className = "continue-card__body";

    const title = document.createElement("strong");
    title.className = "continue-card__title";
    title.textContent = book.title;

    const chapter = document.createElement("span");
    chapter.className = "continue-card__chapter";
    chapter.textContent = getChapterTitleForTime(book, book.resumePosition);
    chapter.classList.toggle("hidden", !chapter.textContent);

    const meta = document.createElement("span");
    meta.className = "continue-card__meta";
    meta.textContent = `${formatTime(book.resumePosition || 0)} of ${formatTime(book.duration || 0)}`;

    const progress = document.createElement("div");
    progress.className = "continue-card__progress";

    const progressFill = document.createElement("span");
    progressFill.className = "continue-card__progress-fill";
    const percent =
      Number(book.duration) > 0
        ? Math.max(0, Math.min(100, ((book.resumePosition || 0) / book.duration) * 100))
        : 0;
    progressFill.style.width = `${percent}%`;
    progress.appendChild(progressFill);

    coverShell.appendChild(cover);
    body.append(title, chapter, meta, progress);
    button.append(dismissButton, coverShell, body);
    animateReveal(button, `continue:${book.id}`, index, "up");
    fragment.appendChild(button);
  });

  elements.continueList.appendChild(fragment);
  renderLucideIcons();
  bindMotionInteractions(elements.continueList);
}

/**
 * Clears persisted playback state for one book so it disappears from the continue shelf.
 *
 * @param {string} bookId - Audiobook identifier.
 */
async function clearContinueProgress(bookId) {
  if (!bookId) {
    return;
  }

  try {
    const library = await api.clearPlaybackState(bookId);
    updateLibraryState(library);
    showToast("Removed from Continue Listening.");
  } catch (error) {
    showToast(error?.message || "Unable to clear saved progress.");
  }
}

/** Renders the top-level collection shelf shown on the library page. */
function renderCollections() {
  const collections = Array.isArray(state.library.collections) ? state.library.collections : [];
  elements.collectionsPanel.classList.toggle(
    "hidden",
    state.activeView !== "library" || collections.length === 0
  );
  elements.collectionsList.replaceChildren();

  if (collections.length === 0) {
    return;
  }

  const fragment = document.createDocumentFragment();

  collections.forEach((collection, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "collection-card";

    const coverShell = document.createElement("div");
    coverShell.className = "collection-card__cover-shell";

    const cover = document.createElement("img");
    cover.className = "collection-card__cover";
    cover.alt = `${collection.name} cover`;
    cover.src = collection.cover?.src || "";
    cover.loading = "lazy";
    bindCoverGlow(cover, coverShell);

    const body = document.createElement("div");
    body.className = "collection-card__body";

    const name = document.createElement("strong");
    name.textContent = collection.name;

    const meta = document.createElement("span");
    meta.textContent = `${collection.bookCount} book${collection.bookCount === 1 ? "" : "s"}`;

    coverShell.appendChild(cover);
    body.append(name, meta);
    button.append(coverShell, body);
    button.addEventListener("click", () => {
      openCollection(collection.id);
    });

    animateReveal(button, `shelf-collection:${collection.id}`, index, "up");
    fragment.appendChild(button);
  });

  elements.collectionsList.appendChild(fragment);
  renderLucideIcons();
  bindMotionInteractions(elements.collectionsList);
}

/** Opens or closes the collection create/edit modal and keeps aria state in sync. */
function setCollectionModalOpen(isOpen) {
  toggleAnimatedVisibility(elements.collectionModal, isOpen);
  elements.collectionModal.setAttribute("aria-hidden", isOpen ? "false" : "true");
  if (isOpen) {
    bindMotionInteractions(elements.collectionModal);
  }
}

/** Resolves the pending collection dialog promise and hides the modal. */
function closeCollectionDialog(result = null) {
  const resolver = state.collectionDialogResolver;
  state.collectionDialogResolver = null;
  setCollectionModalOpen(false);
  if (resolver) {
    resolver(result);
  }
}

/** Animates the collection overlay and its major panels as a single scene. */
function animateCollectionScene(isOpen) {
  if (!shouldUseMotion()) {
    return;
  }

  playMotion(
    elements.collectionView,
    isOpen
      ? { opacity: [0, 1], y: [18, 0], scale: [0.996, 1] }
      : { opacity: [1, 0], y: [0, 12], scale: [1, 0.996] },
    {
      duration: isOpen ? 0.46 : 0.24,
      ease: isOpen ? MOTION_EASE_SCENE : MOTION_EASE_STANDARD
    },
    "__sceneMotion"
  );

  const panels = [elements.collectionHero, elements.collectionBooksPanel, elements.collectionDetailPanel]
    .filter(Boolean);
  motionApi.animate(
    panels,
    isOpen
      ? {
          opacity: [0, 1],
          y: [18, 0],
          filter: ["blur(10px)", "blur(0px)"]
        }
      : {
          opacity: [1, 0],
          y: [0, 10]
        },
    {
      duration: isOpen ? 0.42 : 0.18,
      delay: isOpen ? motionApi.stagger(0.06) : 0,
      ease: isOpen ? MOTION_EASE_SCENE : MOTION_EASE_STANDARD
    }
  );
}

/** Animates the full player shell when it opens or closes. */
function animatePlayerScene(isOpen) {
  if (!shouldUseMotion()) {
    return;
  }

  playMotion(
    elements.playerView,
    isOpen ? { opacity: [0, 1], y: [20, 0] } : { opacity: [1, 0], y: [0, 14] },
    {
      duration: isOpen ? 0.46 : 0.24,
      ease: isOpen ? MOTION_EASE_SCENE : MOTION_EASE_STANDARD
    },
    "__sceneMotion"
  );

  motionApi.animate(
    [elements.playerHeader, elements.playerMain, elements.playerDock],
    isOpen
      ? {
          opacity: [0, 1],
          y: [22, 0],
          filter: ["blur(10px)", "blur(0px)"]
        }
      : {
          opacity: [1, 0],
          y: [0, 12]
        },
    {
      duration: isOpen ? 0.42 : 0.18,
      delay: isOpen ? motionApi.stagger(0.06) : 0,
      ease: isOpen ? MOTION_EASE_SCENE : MOTION_EASE_STANDARD
    }
  );
}

/** Animates the slide-out chapter drawer and its backdrop independently of layout classes. */
function animatePlayerChapterDrawer(isOpen) {
  if (!shouldUseMotion() || elements.chapterSidebar.classList.contains("hidden")) {
    elements.playerDrawerBackdrop.classList.toggle("hidden", !isOpen);
    return;
  }

  if (isOpen) {
    elements.playerDrawerBackdrop.classList.remove("hidden");
    playMotion(
      elements.playerDrawerBackdrop,
      { opacity: [0, 1] },
      { duration: 0.22, ease: MOTION_EASE_STANDARD },
      "__drawerMotion"
    );
    playMotion(
      elements.chapterSidebar,
      {
        opacity: [0, 1],
        x: [24, 0],
        scale: [0.985, 1],
        filter: ["blur(10px)", "blur(0px)"]
      },
      { duration: 0.28, ease: MOTION_EASE_SCENE },
      "__drawerMotion"
    );
    return;
  }

  const controls = playMotion(
    elements.playerDrawerBackdrop,
    { opacity: [1, 0] },
    { duration: 0.18, ease: MOTION_EASE_STANDARD },
    "__drawerMotion"
  );
  playMotion(
    elements.chapterSidebar,
    {
      opacity: [1, 0],
      x: [0, 24],
      scale: [1, 0.99],
      filter: ["blur(0px)", "blur(8px)"]
    },
    { duration: 0.22, ease: MOTION_EASE_STANDARD },
    "__drawerMotion"
  );

  Promise.resolve(controls?.finished).finally(() => {
    if (!state.playerChapterDrawerOpen) {
      elements.playerDrawerBackdrop.classList.add("hidden");
    }
  });
}

/** Animates the summary disclosure so it feels lighter than a hard open/close. */
function animatePlayerSummaryPanel(isOpen) {
  const panel = elements.playerSummaryPanel;
  if (!panel) {
    return;
  }

  if (!shouldUseMotion()) {
    panel.classList.toggle("is-open", isOpen);
    return;
  }

  stopMotionAnimation(panel, "__summaryMotion");
  panel.style.overflow = "hidden";

  if (isOpen) {
    panel.classList.add("is-open");
    const height = panel.scrollHeight;
    const controls = motionApi.animate(
      panel,
      {
        opacity: [0, 1],
        y: [-8, 0],
        height: [0, height]
      },
      {
        duration: 0.28,
        ease: MOTION_EASE_STANDARD
      }
    );
    panel.__summaryMotion = controls;
    Promise.resolve(controls.finished).finally(() => {
      if (!state.playerSummaryExpanded) {
        return;
      }
      panel.style.height = "auto";
      panel.style.overflow = "";
    });
    return;
  }

  const currentHeight = panel.offsetHeight || panel.scrollHeight || 0;
  const controls = motionApi.animate(
    panel,
    {
      opacity: [1, 0],
      y: [0, -8],
      height: [currentHeight, 0]
    },
    {
      duration: 0.22,
      ease: MOTION_EASE_STANDARD
    }
  );
  panel.__summaryMotion = controls;
  Promise.resolve(controls.finished).finally(() => {
    if (state.playerSummaryExpanded) {
      return;
    }
    panel.classList.remove("is-open");
    panel.style.height = "";
    panel.style.overflow = "";
  });
}

/** Opens or closes the mini-player chapter picker only when chapter navigation is meaningful. */
function setMiniPlayerChapterMenuOpen(isOpen) {
  const chapters = getBookChapters();
  state.miniPlayerChapterMenuOpen = Boolean(
    isOpen &&
      state.playerMinimized &&
      shouldShowMiniPlayerOnMinimize() &&
      Boolean(state.currentBookId) &&
      chapters.length > 1
  );

  elements.miniPlayerChapterButton?.setAttribute(
    "aria-expanded",
    state.miniPlayerChapterMenuOpen ? "true" : "false"
  );
  const chapterButtonIcon = elements.miniPlayerChapterButton?.querySelector(".ui-icon-slot");
  if (chapterButtonIcon) {
    chapterButtonIcon.innerHTML = iconPlaceholder(
      state.miniPlayerChapterMenuOpen ? "chevron-up" : "chevron-down"
    );
  }
  elements.miniPlayerChapterMenu?.setAttribute(
    "aria-hidden",
    state.miniPlayerChapterMenuOpen ? "false" : "true"
  );
  elements.miniPlayerChapterButton?.classList.toggle("is-open", state.miniPlayerChapterMenuOpen);
  toggleAnimatedVisibility(elements.miniPlayerChapterMenu, state.miniPlayerChapterMenuOpen);
  renderLucideIcons();
}

/** Renders the chapter picker menu used by the minimized player dock. */
function renderMiniPlayerChapterMenu() {
  const book = getCurrentBook();
  const chapters = getBookChapters(book);
  const showMenuButton = Boolean(book && state.playerMinimized && chapters.length > 1);
  const displayChapterIndex = Math.max(0, getDisplayChapterIndex());

  elements.miniPlayerChapterButton.classList.toggle("hidden", !showMenuButton);

  if (!showMenuButton) {
    state.miniPlayerChapterMenuOpen = false;
    state.lastRenderedMiniPlayerChapterBookId = "";
    state.lastRenderedMiniPlayerChapterIndex = -1;
    state.lastRenderedMiniPlayerChaptersRef = null;
    elements.miniPlayerChapterList.replaceChildren();
    setMiniPlayerChapterMenuOpen(false);
    return;
  }

  elements.miniPlayerChapterButton.classList.add("ui-control--with-icon");
  elements.miniPlayerChapterButton.title = "Choose chapter";

  const shouldReuseRenderedList =
    state.lastRenderedMiniPlayerChapterBookId === (book?.id || "") &&
    state.lastRenderedMiniPlayerChapterIndex === displayChapterIndex &&
    state.lastRenderedMiniPlayerChaptersRef === chapters;

  if (shouldReuseRenderedList) {
    renderLucideIcons();
    bindMotionInteractions(elements.miniPlayerChapterButton);
    bindMotionInteractions(elements.miniPlayerChapterList);
    return;
  }

  elements.miniPlayerChapterList.replaceChildren();
  const fragment = document.createDocumentFragment();

  chapters.forEach((chapter, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mini-player__chapter-option";
    if (index === displayChapterIndex) {
      button.classList.add("is-active");
    }

    const title = document.createElement("span");
    title.className = "mini-player__chapter-option-title";
    title.textContent = chapter.title;

    const time = document.createElement("span");
    time.className = "mini-player__chapter-option-time";
    time.textContent = `${formatTime(chapter.start)} - ${formatTime(chapter.end)}`;

    button.append(title, time);
    button.addEventListener("click", () => {
      setMiniPlayerChapterMenuOpen(false);
      seekToChapter(index);
    });
    fragment.appendChild(button);
  });

  elements.miniPlayerChapterList.appendChild(fragment);
  state.lastRenderedMiniPlayerChapterBookId = book?.id || "";
  state.lastRenderedMiniPlayerChapterIndex = displayChapterIndex;
  state.lastRenderedMiniPlayerChaptersRef = chapters;
  renderLucideIcons();
  bindMotionInteractions(elements.miniPlayerChapterButton);
  bindMotionInteractions(elements.miniPlayerChapterList);
}

/**
 * Opens the collection dialog and returns a promise for the entered values.
 *
 * @param {object} options - Dialog copy and initial values.
 * @returns {Promise<object|null>} Dialog result or null when the user cancels.
 */
function showCollectionDialog({ title, name = "", description = "" }) {
  if (state.collectionDialogResolver) {
    closeCollectionDialog(null);
  }

  elements.collectionModalTitle.textContent = title;
  elements.collectionNameInput.value = name;
  elements.collectionDescriptionInput.value = description;
  setCollectionModalOpen(true);

  window.setTimeout(() => {
    elements.collectionNameInput.focus();
    elements.collectionNameInput.select();
  }, 0);

  return new Promise((resolve) => {
    state.collectionDialogResolver = resolve;
  });
}

/** Opens or closes the collection overlay and updates the body scroll lock state. */
function setCollectionOpen(isOpen) {
  state.collectionOpen = isOpen;
  document.body.classList.toggle("collection-view-open", isOpen);
  elements.collectionView.classList.toggle("is-open", isOpen);
  elements.collectionView.setAttribute("aria-hidden", isOpen ? "false" : "true");
  animateCollectionScene(isOpen);
}

/** Renders the currently open collection page, its book canvas, and the selected-book detail rail. */
function renderCollectionView() {
  const collection = getCurrentCollection();
  if (!collection) {
    setCollectionOpen(false);
    elements.collectionTitle.textContent = "Collection";
    elements.collectionDescription.textContent = "";
    elements.collectionBookCount.textContent = "0";
    elements.collectionBooks.replaceChildren();
    elements.collectionDetail.replaceChildren();
    return;
  }

  const memberBooks = getBooksForCollection(collection);
  const selectedBookExists = memberBooks.some((book) => book.id === state.collectionDetailBookId);
  if (!selectedBookExists) {
    state.collectionDetailBookId = memberBooks[0]?.id || "";
  }

  const selectedBook =
    memberBooks.find((book) => book.id === state.collectionDetailBookId) || memberBooks[0] || null;
  const selectedBookIndex = memberBooks.findIndex((book) => book.id === selectedBook?.id);
  elements.collectionTitle.textContent = collection.name;
  elements.collectionDescription.textContent =
    collection.description || "A custom shelf built from your imported audiobook library.";
  elements.collectionDescription.classList.toggle("hidden", false);
  elements.collectionBookCount.textContent = String(memberBooks.length);
  applyCollectionCoverSize(state.collectionCoverSize || getResolvedCollectionCoverSize());
  elements.collectionBooks.replaceChildren();
  elements.collectionDetail.replaceChildren();

  const fragment = document.createDocumentFragment();

  memberBooks.forEach((book, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "collection-grid-card";
    if (book.id === selectedBook?.id) {
      button.classList.add("is-active");
    }

    const frame = document.createElement("div");
    frame.className = "collection-grid-card__frame";

    const media = document.createElement("div");
    media.className = "collection-grid-card__media";

    const cover = document.createElement("img");
    cover.className = "collection-grid-card__image";
    cover.src = book.cover?.src || "";
    cover.alt = `${book.title} cover`;
    cover.loading = "lazy";
    syncCoverAspectRatio(cover, frame);
    bindCoverGlow(cover, frame);

    const order = document.createElement("span");
    order.className = "collection-grid-card__order";
    order.textContent = String(index + 1).padStart(2, "0");

    const overlay = document.createElement("div");
    overlay.className = "collection-grid-card__overlay";

    const title = document.createElement("strong");
    title.textContent = book.title;

    const meta = document.createElement("span");
    meta.textContent = getCollectionBookMeta(book);

    overlay.append(title, meta);
    media.append(order, cover, overlay);
    frame.append(media);
    button.append(frame);

    button.addEventListener("click", () => {
      state.collectionDetailBookId = book.id;
      renderCollectionView();
    });

    button.addEventListener("dblclick", () => {
      void openBook(book.id);
    });

    animateReveal(
      button,
      `collection-book:${collection.id}:${book.id}`,
      index,
      "up"
    );
    fragment.appendChild(button);
  });

  elements.collectionBooks.appendChild(fragment);
  renderCollectionDetail(selectedBook, selectedBookIndex, memberBooks.length);
  setCollectionOpen(state.collectionOpen);
  animateReveal(elements.collectionHero, `collection-hero:${collection.id}`, 0, "down");
  animateReveal(elements.collectionBooksPanel, `collection-books:${collection.id}`, 1, "up");
  animateReveal(elements.collectionDetailPanel, `collection-detail-panel:${collection.id}`, 2, "right");
  renderLucideIcons();
  bindMotionInteractions(elements.collectionView);
}

/**
 * Renders the selected-book inspector for the open collection.
 *
 * @param {object|null} book - Currently selected collection book.
 * @param {number} index - Zero-based position inside the collection.
 * @param {number} totalBooks - Total number of books in the collection.
 */
function renderCollectionDetail(book, index, totalBooks) {
  elements.collectionDetail.replaceChildren();

  if (!book) {
    const empty = document.createElement("div");
    empty.className = "collection-detail-empty";
    empty.textContent = "Select a book in this collection to view its metadata.";
    elements.collectionDetail.appendChild(empty);
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "collection-detail-card";

  const coverButton = document.createElement("button");
  coverButton.type = "button";
  coverButton.className = "collection-detail-cover-button";
  coverButton.addEventListener("click", () => {
    void openBook(book.id);
  });

  const cover = document.createElement("img");
  cover.className = "collection-detail-cover";
  cover.src = book.cover?.src || "";
  cover.alt = `${book.title} cover`;
  coverButton.appendChild(cover);

  const copy = document.createElement("div");
  copy.className = "collection-detail-copy";

  const position = document.createElement("p");
  position.className = "collection-detail-position";
  position.textContent = `Book ${String(index + 1).padStart(2, "0")} of ${String(
    Math.max(totalBooks, 1)
  ).padStart(2, "0")}`;

  const title = document.createElement("h4");
  title.className = "collection-detail-title";
  title.textContent = book.title;

  const meta = document.createElement("p");
  meta.className = "collection-detail-meta";
  meta.textContent = getCollectionBookMeta(book);

  const actions = document.createElement("div");
  actions.className = "collection-detail-actions";

  const openButton = document.createElement("button");
  openButton.type = "button";
  openButton.className = "button button-primary";
  setIconLabelButtonContent(openButton, "play", "Open Player");
  openButton.addEventListener("click", () => {
    void openBook(book.id);
  });

  const refreshButton = document.createElement("button");
  refreshButton.type = "button";
  refreshButton.className = "button button-secondary";
  setIconLabelButtonContent(refreshButton, "refresh-cw", "Refresh Metadata");
  refreshButton.addEventListener("click", () => {
    void refreshMetadataForBook(book.id);
  });

  actions.append(openButton, refreshButton);

  const source = document.createElement("p");
  source.className = "collection-detail-source";
  source.textContent = `Library: ${getFolderName(book.sourceLibrary || "") || "Unknown source"}`;

  const metadata = document.createElement("p");
  metadata.className = "collection-detail-source";
  metadata.textContent = [getMetadataDetailLine(book), getMetadataSourceLine(book)]
    .filter(Boolean)
    .join(" · ");
  metadata.classList.toggle("hidden", !metadata.textContent);

  const summary = document.createElement("p");
  summary.className = "collection-detail-summary";
  summary.textContent = getBookSummaryText(book);

  copy.append(position, title, meta, actions, source, metadata, summary);
  wrapper.append(coverButton, copy);
  animateReveal(
    wrapper,
    `collection-detail:${state.currentCollectionId || "none"}:${book.id}`,
    0,
    "right"
  );
  elements.collectionDetail.appendChild(wrapper);
  renderLucideIcons();
  bindMotionInteractions(elements.collectionDetail);
}

/** Toggles native fullscreen specifically for the now-playing experience. */
async function togglePlayerFullscreen() {
  if (!state.playerOpen) {
    return;
  }

  const windowState = await api.toggleFullscreenWindow();
  applyWindowState(windowState);
  renderPlayer();
}

/** Leaves native fullscreen when the player closes so the rest of the app returns to its normal shell. */
async function exitPlayerFullscreenIfNeeded() {
  if (!state.isWindowFullScreen) {
    return;
  }

  const windowState = await api.toggleFullscreenWindow();
  applyWindowState(windowState);
}

/** Opens or closes the full player overlay and keeps the dock/minimized state consistent. */
function setPlayerOpen(isOpen) {
  state.playerOpen = isOpen;
  state.playerFullscreen = Boolean(state.isWindowFullScreen && isOpen);
  if (isOpen) {
    state.playerMinimized = false;
  } else {
    state.playerChapterDrawerOpen = false;
    state.playerSummaryExpanded = false;
  }
  document.body.classList.toggle("player-view-open", isOpen);
  elements.playerView.classList.toggle("is-open", isOpen);
  elements.playerView.setAttribute("aria-hidden", isOpen ? "false" : "true");
  elements.playerView.classList.toggle("player-fullscreen", state.playerFullscreen);
  animatePlayerScene(isOpen);
  syncPlayerPanels();
  renderMiniPlayer();
  if (state.playerFullscreen) {
    schedulePlayerHudHide();
    void updatePlayerFullscreenPalette();
    startPlayerReactiveLoop();
  } else {
    setPlayerHudVisible(true);
    stopPlayerReactiveLoop();
  }
  void persistMiniPlayerDockPreference();
}

/** Updates whether the bottom dock should stand in for the full player. */
function setPlayerMinimized(isMinimized) {
  state.playerMinimized = isMinimized && Boolean(state.currentBookId);
  if (!state.playerMinimized) {
    state.miniPlayerScrubValue = null;
  }
  renderMiniPlayer();
  void persistMiniPlayerDockPreference();
}

/** Synchronizes the player summary and chapter drawer UI with the current player state. */
function syncPlayerPanels() {
  const hasChapters = getBookChapters().length > 1;
  const showDrawer = Boolean(state.playerOpen && hasChapters && state.playerChapterDrawerOpen);
  const showSummary = Boolean(state.playerSummaryExpanded && getCurrentBook());
  const previousPanelState = state.lastPlayerPanelsState;
  const chaptersVisibilityChanged = previousPanelState.hasChapters !== hasChapters;
  const drawerStateChanged = previousPanelState.showDrawer !== showDrawer;
  const summaryStateChanged = previousPanelState.showSummary !== showSummary;

  elements.playerView.classList.toggle("player-chapters-open", showDrawer);
  elements.playerView.classList.toggle("player-summary-open", showSummary);
  elements.chapterSidebar.setAttribute("aria-hidden", showDrawer ? "false" : "true");
  elements.playerChaptersToggle.classList.toggle("hidden", !hasChapters);
  elements.playerChaptersToggle.classList.toggle("is-active", showDrawer);

  if (chaptersVisibilityChanged || drawerStateChanged) {
    elements.playerChaptersToggle.setAttribute("aria-expanded", showDrawer ? "true" : "false");
    elements.playerChaptersToggle.setAttribute(
      "aria-label",
      showDrawer ? "Close chapter drawer" : "Open chapter drawer"
    );
    elements.playerChaptersToggle.title = showDrawer ? "Close chapters" : "Chapters";
    setIconOnlyButtonContent(elements.playerChaptersToggle, "list");
    animatePlayerChapterDrawer(showDrawer);
  }

  if (summaryStateChanged) {
    elements.playerSummaryPanel.classList.toggle("is-open", showSummary);
    elements.playerSummaryToggle.setAttribute("aria-expanded", showSummary ? "true" : "false");
    setIconLabelButtonContent(
      elements.playerSummaryToggle,
      showSummary ? "chevron-up" : "chevron-down",
      showSummary ? "Hide Summary" : "Show Summary",
      { iconAfter: true }
    );
    animatePlayerSummaryPanel(showSummary);
  }

  if (chaptersVisibilityChanged || drawerStateChanged || summaryStateChanged) {
    renderLucideIcons();
    bindMotionInteractions(elements.playerView);
  }

  state.lastPlayerPanelsState = {
    hasChapters,
    showDrawer,
    showSummary
  };
}

/** Opens or closes the chapter drawer, but only when multiple chapters exist. */
function setPlayerChapterDrawerOpen(isOpen) {
  state.playerChapterDrawerOpen = Boolean(isOpen && getBookChapters().length > 1);
  if (state.playerFullscreen) {
    schedulePlayerHudHide();
  }
  syncPlayerPanels();
}

/** Expands or collapses the player summary section. */
function setPlayerSummaryExpanded(isExpanded) {
  state.playerSummaryExpanded = Boolean(isExpanded);
  if (state.playerFullscreen) {
    schedulePlayerHudHide();
  }
  syncPlayerPanels();
}

/** Renders the minimized bottom playback dock. */
function renderMiniPlayer() {
  const book = getCurrentBook();
  const shouldShow = Boolean(book && state.playerMinimized && shouldShowMiniPlayerOnMinimize());
  const skipInterval = getSkipIntervalSeconds();
  document.body.classList.toggle("mini-player-visible", shouldShow);
  toggleAnimatedVisibility(elements.miniPlayer, shouldShow);
  elements.miniPlayer.setAttribute("aria-hidden", shouldShow ? "false" : "true");

  if (!shouldShow || !book) {
    setMiniPlayerChapterMenuOpen(false);
    elements.miniPlayerCover.removeAttribute("src");
    elements.miniPlayerTitle.textContent = "Nothing playing";
    elements.miniPlayerMeta.textContent = "Paused";
    elements.miniPlayerChapter.textContent = "Playback";
    elements.miniPlayerCurrentTime.textContent = "0:00";
    elements.miniPlayerTotalTime.textContent = "0:00";
    elements.miniPlayerProgress.max = "0";
    elements.miniPlayerProgress.value = "0";
    elements.miniPlayerProgress.style.setProperty("--progress-percent", "0%");
    elements.miniPlayerChapterButton.classList.add("hidden");
    elements.miniPlayerChapterList.replaceChildren();
    setIconOnlyButtonContent(elements.miniPlayerToggleButton, "play");
    setIconValueButtonContent(elements.miniPlayerSkipBackButton, "rewind", skipInterval);
    setIconValueButtonContent(elements.miniPlayerSkipForwardButton, "fast-forward", skipInterval);
    setIconOnlyButtonContent(elements.miniPlayerBackButton, "skip-back");
    setIconOnlyButtonContent(elements.miniPlayerNextButton, "skip-forward");
    elements.miniPlayerBackButton.disabled = true;
    elements.miniPlayerNextButton.disabled = true;
    renderLucideIcons();
    bindMotionInteractions(elements.miniPlayer);
    return;
  }

  const activeChapter = getActiveChapter();
  const chapterStart = activeChapter?.start || 0;
  const chapterEnd = activeChapter?.end || state.playerSnapshot.duration || book.duration || 0;
  const chapterDuration = Math.max(0, chapterEnd - chapterStart);
  const globalTime = Number(state.playerSnapshot.currentTime) || 0;
  const chapterTime =
    state.miniPlayerScrubValue ?? Math.min(chapterDuration, Math.max(0, globalTime - chapterStart));
  const chapters = getBookChapters();
  const chapterIndex = Math.max(0, getDisplayChapterIndex());
  const hasPreviousChapter = chapterIndex > 0;
  const hasNextChapter = chapterIndex >= 0 && chapterIndex < chapters.length - 1;

  elements.miniPlayerCover.src = book.cover?.src || "";
  elements.miniPlayerCover.alt = `${book.title} cover`;
  elements.miniPlayerTitle.textContent = book.title;
  elements.miniPlayerMeta.textContent = book.author || "Unknown author";
  elements.miniPlayerChapter.textContent = activeChapter?.title || "Playback";
  elements.miniPlayerCurrentTime.textContent = formatTime(chapterTime);
  elements.miniPlayerTotalTime.textContent = formatTime(chapterDuration);
  elements.miniPlayerProgress.max = String(chapterDuration);
  elements.miniPlayerProgress.value = String(Math.min(chapterDuration, chapterTime));
  const miniPlayerProgressPercent =
    chapterDuration > 0 ? Math.max(0, Math.min(100, (chapterTime / chapterDuration) * 100)) : 0;
  elements.miniPlayerProgress.style.setProperty(
    "--progress-percent",
    `${miniPlayerProgressPercent}%`
  );
  setIconOnlyButtonContent(
    elements.miniPlayerToggleButton,
    state.playerSnapshot.isPlaying ? "pause" : "play"
  );
  setIconValueButtonContent(elements.miniPlayerSkipBackButton, "rewind", skipInterval);
  setIconValueButtonContent(elements.miniPlayerSkipForwardButton, "fast-forward", skipInterval);
  setIconOnlyButtonContent(elements.miniPlayerBackButton, "skip-back");
  setIconOnlyButtonContent(elements.miniPlayerNextButton, "skip-forward");
  elements.miniPlayerSkipBackButton.title = `Back ${skipInterval} seconds`;
  elements.miniPlayerSkipForwardButton.title = `Forward ${skipInterval} seconds`;
  elements.miniPlayerBackButton.disabled = chapters.length === 0;
  elements.miniPlayerNextButton.disabled = !hasNextChapter;
  elements.miniPlayerBackButton.classList.toggle("is-disabled", chapters.length === 0);
  elements.miniPlayerNextButton.classList.toggle("is-disabled", !hasNextChapter);
  elements.miniPlayerBackButton.title = hasPreviousChapter
    ? "Restart chapter or go to previous chapter"
    : "Restart chapter";
  elements.miniPlayerNextButton.title = hasNextChapter ? "Next chapter" : "No next chapter";
  renderMiniPlayerChapterMenu();
  renderLucideIcons();
  bindMotionInteractions(elements.miniPlayer);
}

/** Renders the full now-playing view for the active book. */
function renderPlayer() {
  const book = getCurrentBook();
  const isFullscreenPlayer = Boolean(state.playerFullscreen && state.playerOpen);

  if (!book) {
    if (state.isWindowFullScreen) {
      void exitPlayerFullscreenIfNeeded();
    }
    setPlayerOpen(false);
    elements.playerTitle.textContent = "Select a book";
    elements.playerAuthor.textContent = "";
    elements.playerNarrator.textContent = "";
    elements.playerMetaExtra.textContent = "";
    elements.playerMetaSource.textContent = "";
    elements.playerDockTitle.textContent = "Select a book";
    elements.playerDockAuthor.textContent = "";
    elements.playerDockChapter.textContent = "Playback";
    elements.playerSummary.textContent = "";
    elements.playerCurrentChapter.textContent = "Playback";
    elements.playerMetaExtra.classList.add("hidden");
    elements.playerMetaSource.classList.add("hidden");
    elements.playerDockChapterBlock.classList.add("hidden");
    elements.playerCover.removeAttribute("src");
    elements.playerBackdrop.style.backgroundImage = "";
    elements.progress.style.setProperty("--progress-percent", "0%");
    elements.bookProgressShadowFill.style.width = "0%";
    elements.refreshCurrentMetadataButton.disabled = true;
    elements.playerSummaryToggle.classList.add("hidden");
    elements.playerFullscreenButton.classList.add("hidden");
    elements.playerDockFullscreenButton.classList.add("hidden");
    state.playerSummaryExpanded = false;
    state.playerChapterDrawerOpen = false;
    syncPlayerPanels();
    renderChapters();
    renderMiniPlayer();
    return;
  }

  const summaryText = getBookSummaryText(book) || "No summary available yet.";
  elements.playerTitle.textContent = book.title;
  elements.playerAuthor.textContent = book.author || "Unknown author";
  elements.playerNarrator.textContent = book.narrator ? `Narrated by ${book.narrator}` : "";
  elements.playerDockTitle.textContent = book.title;
  elements.playerDockAuthor.textContent = book.author || "Unknown author";
  elements.playerNarrator.classList.toggle("hidden", !book.narrator);
  elements.playerMetaExtra.textContent = getMetadataDetailLine(book);
  elements.playerMetaSource.textContent = getMetadataSourceLine(book);
  elements.playerMetaExtra.classList.toggle("hidden", !elements.playerMetaExtra.textContent);
  elements.playerMetaSource.classList.toggle("hidden", !elements.playerMetaSource.textContent);
  elements.playerSummary.textContent = summaryText;
  elements.playerSummaryToggle.classList.toggle("hidden", isFullscreenPlayer);
  elements.playerFullscreenButton.classList.remove("hidden");
  elements.playerDockFullscreenButton.classList.remove("hidden");
  if (isFullscreenPlayer) {
    state.playerSummaryExpanded = false;
  }
  elements.playerCover.src = book.cover?.src || "";
  elements.playerCover.alt = `${book.title} cover`;
  elements.playerBackdrop.style.backgroundImage = `url("${book.cover?.src || ""}")`;
  bindCoverGlow(
    elements.playerCover,
    elements.playerView,
    elements.progress,
    elements.bookProgressShadowFill,
    elements.miniPlayerProgress
  );
  void updatePlayerFullscreenPalette(book);
  elements.refreshCurrentMetadataButton.disabled = false;
  elements.speedSelect.value = String(state.playerSnapshot.rate || 1);

  renderProgress();
  renderControls();
  renderChapters();
  syncPlayerPanels();
  renderMiniPlayer();
}

/** Renders the chapter-relative progress bar and timestamps. */
function renderProgress() {
  const activeChapter = getActiveChapter();
  const chapterStart = activeChapter?.start || 0;
  const chapterEnd = activeChapter?.end || state.playerSnapshot.duration || 0;
  const chapterDuration = Math.max(0, chapterEnd - chapterStart);
  const globalTime = state.playerSnapshot.currentTime ?? 0;
  const chapterTime =
    state.scrubValue ?? Math.min(chapterDuration, Math.max(0, globalTime - chapterStart));
  const bookDuration = Math.max(0, Number(state.playerSnapshot.duration) || 0);
  const bookProgressPercent =
    bookDuration > 0 ? Math.max(0, Math.min(100, (globalTime / bookDuration) * 100)) : 0;

  elements.playerCurrentChapter.textContent = activeChapter?.title || "Playback";
  elements.playerDockChapter.textContent = activeChapter?.title || "Playback";
  elements.playerDockChapterBlock.classList.toggle("hidden", !activeChapter?.title);
  elements.progress.max = String(chapterDuration);
  elements.progress.value = String(Math.min(chapterDuration, chapterTime));
  const chapterProgressPercent =
    chapterDuration > 0 ? Math.max(0, Math.min(100, (chapterTime / chapterDuration) * 100)) : 0;
  elements.progress.style.setProperty("--progress-percent", `${chapterProgressPercent}%`);
  elements.bookProgressShadowFill.style.width = `${bookProgressPercent}%`;
  elements.currentTime.textContent = formatTime(chapterTime);
  elements.totalTime.textContent = formatTime(chapterDuration);
}

/** Maps a chapter-relative scrub value to the global book timeline and performs the seek. */
function seekWithinActiveChapter(chapterTime, { autoplay = state.playerSnapshot.isPlaying } = {}) {
  if (!Number.isFinite(chapterTime)) {
    return false;
  }

  const activeChapter = getActiveChapter();
  const chapterStart = activeChapter?.start || 0;
  player.seek(chapterStart + chapterTime, { autoplay });
  return true;
}

/** Keeps both volume controls synchronized because the full player and dock share one player instance. */
function syncVolumeControls(volumePercent) {
  const safePercent = Math.max(0, Math.min(100, Math.round(volumePercent)));
  elements.volumeSlider.value = String(safePercent);
  elements.volumeSlider.setAttribute("aria-label", `Volume ${safePercent}%`);
  elements.miniPlayerVolumeSlider.value = String(safePercent);
  elements.miniPlayerVolumeSlider.setAttribute("aria-label", `Volume ${safePercent}%`);
}

/** Renders transport labels, button states, and volume/speed controls. */
function renderControls() {
  const isPlaying = state.playerSnapshot.isPlaying;
  const volume = Number.isFinite(state.playerSnapshot.volume) ? state.playerSnapshot.volume : 1;
  const volumePercent = Math.round(volume * 100);
  const skipInterval = getSkipIntervalSeconds();
  const chapters = getBookChapters();
  const chapterIndex = Math.max(0, getDisplayChapterIndex());
  const hasPreviousChapter = chapterIndex > 0;
  const hasNextChapter = chapterIndex >= 0 && chapterIndex < chapters.length - 1;

  setIconOnlyButtonContent(elements.togglePlaybackButton, isPlaying ? "pause" : "play");
  elements.togglePlaybackButton.setAttribute("aria-label", isPlaying ? "Pause" : "Play");
  elements.togglePlaybackButton.title = isPlaying ? "Pause" : "Play";
  setIconValueButtonContent(elements.skipBackButton, "rewind", skipInterval);
  setIconValueButtonContent(elements.skipForwardButton, "fast-forward", skipInterval);
  setIconOnlyButtonContent(elements.chapterBackButton, "skip-back");
  setIconOnlyButtonContent(elements.chapterNextButton, "skip-forward");
  elements.skipBackButton.setAttribute("aria-label", `Back ${skipInterval} seconds`);
  elements.skipForwardButton.setAttribute("aria-label", `Forward ${skipInterval} seconds`);
  elements.skipBackButton.title = `Back ${skipInterval} seconds`;
  elements.skipForwardButton.title = `Forward ${skipInterval} seconds`;
  syncVolumeControls(volumePercent);
  elements.chapterBackButton.disabled = chapters.length === 0;
  elements.chapterNextButton.disabled = !hasNextChapter;
  elements.chapterBackButton.classList.toggle("is-disabled", chapters.length === 0);
  elements.chapterNextButton.classList.toggle("is-disabled", !hasNextChapter);
  elements.chapterBackButton.title = hasPreviousChapter
    ? "Restart chapter or go to previous chapter"
    : "Restart chapter";
  elements.chapterNextButton.title = hasNextChapter ? "Next chapter" : "No next chapter";
  updateVolumeBubble(volumePercent);
  renderLucideIcons();
  bindMotionInteractions(elements.playerView);
}

/** Positions the hover volume bubble over the current slider thumb. */
function updateVolumeBubble(volumePercent = Number.parseFloat(elements.volumeSlider.value) || 0) {
  const safePercent = Math.max(0, Math.min(100, Math.round(volumePercent)));
  elements.volumeBubble.textContent = `${safePercent}%`;
  elements.volumeBubble.style.left = `calc(${safePercent}% + ${12 - safePercent * 0.24}px)`;
}

/** Shows the floating volume bubble. */
function showVolumeBubble() {
  updateVolumeBubble();
  elements.volumeBubble.classList.remove("hidden");
}

/** Hides the floating volume bubble. */
function hideVolumeBubble() {
  elements.volumeBubble.classList.add("hidden");
}

/** Renders the chapter drawer contents for the current book. */
function renderChapters() {
  const book = getCurrentBook();
  const chapters = Array.isArray(book?.chapters) ? book.chapters : [];
  const showChapters = chapters.length > 1;
  const displayChapterIndex = Math.max(0, getDisplayChapterIndex());

  elements.chapterSidebar.classList.toggle("hidden", !showChapters);

  if (!showChapters) {
    state.lastRenderedChapterBookId = "";
    state.lastRenderedChapterIndex = -1;
    state.lastRenderedChaptersRef = null;
    elements.chapterList.replaceChildren();
    state.playerChapterDrawerOpen = false;
    syncPlayerPanels();
    return;
  }

  const shouldReuseRenderedList =
    state.lastRenderedChapterBookId === (book?.id || "") &&
    state.lastRenderedChapterIndex === displayChapterIndex &&
    state.lastRenderedChaptersRef === chapters;

  if (shouldReuseRenderedList) {
    syncPlayerPanels();
    bindMotionInteractions(elements.chapterList);
    return;
  }

  elements.chapterList.replaceChildren();

  const fragment = document.createDocumentFragment();

  chapters.forEach((chapter, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "chapter-button";
    if (index === displayChapterIndex) {
      button.classList.add("is-active");
    }

    const header = document.createElement("div");
    header.className = "chapter-heading";

    const chapterIndex = document.createElement("span");
    chapterIndex.className = "chapter-index";
    chapterIndex.textContent = String(index + 1).padStart(2, "0");

    const title = document.createElement("span");
    title.textContent = chapter.title;

    const time = document.createElement("span");
    time.className = "chapter-time";
    time.textContent = `${formatTime(chapter.start)} - ${formatTime(chapter.end)}`;

    header.append(chapterIndex, title);
    button.append(header, time);
    button.addEventListener("click", () => {
      state.pausedChapterIndex = index;
      setPlayerChapterDrawerOpen(false);
      player.seek(getChapterSeekTime(index), { autoplay: state.playerSnapshot.isPlaying });
    });

    animateReveal(button, `chapter:${state.currentBookId || "none"}:${index}`, index, "right");
    fragment.appendChild(button);
  });

  elements.chapterList.appendChild(fragment);
  state.lastRenderedChapterBookId = book?.id || "";
  state.lastRenderedChapterIndex = displayChapterIndex;
  state.lastRenderedChaptersRef = chapters;
  syncPlayerPanels();
  bindMotionInteractions(elements.chapterList);
}

/**
 * Renders one library book card for the virtualized cover wall.
 *
 * @param {object} book - Book record to display.
 * @returns {HTMLButtonElement} Interactive card element for the virtual grid.
 */
function renderBookCard(book) {
  const layout = arguments[1] || {};
  const button = document.createElement("button");
  button.type = "button";
  button.className = "book-card";
  if (book.id === state.currentBookId) {
    button.classList.add("is-active");
  }
  if (isCollectionSelectionMode()) {
    button.classList.add("is-selecting");
  }
  if (isBookSelectedForCollection(book.id)) {
    button.classList.add("is-selected");
  }

  const frame = document.createElement("div");
  frame.className = "book-card__frame";

  const media = document.createElement("div");
  media.className = "book-card__media";

  const image = document.createElement("img");
  image.className = "book-card__image";
  image.src = book.cover?.src || "";
  image.alt = `${book.title} cover`;
  image.loading = "lazy";
  bindCoverGlow(image, frame);

  const overlay = document.createElement("div");
  overlay.className = "book-card__overlay";

  const title = document.createElement("span");
  title.className = "book-card__title";
  title.textContent = book.title;

  const badge = document.createElement("span");
  badge.className = "book-card__badge";
  badge.textContent = isBookSelectedForCollection(book.id) ? "Selected" : "Select";

  overlay.append(title);
  media.append(badge, image, overlay);
  frame.append(media);
  button.append(frame);

  const updateFrameSize = (aspectRatio = DEFAULT_LIBRARY_COVER_RATIO) => {
    const cellWidth = Number.isFinite(layout.width) ? layout.width : 220;
    const cellHeight = Number.isFinite(layout.height) ? layout.height : 320;
    const safeAspectRatio =
      Number.isFinite(aspectRatio) && aspectRatio > 0 ? aspectRatio : DEFAULT_LIBRARY_COVER_RATIO;
    let frameWidth = cellWidth;
    let frameHeight = frameWidth / safeAspectRatio;

    if (frameHeight > cellHeight) {
      frameHeight = cellHeight;
      frameWidth = frameHeight * safeAspectRatio;
    }

    frame.style.width = `${Math.round(frameWidth)}px`;
    frame.style.height = `${Math.round(frameHeight)}px`;
  };

  updateFrameSize();

  image.addEventListener("load", () => {
    if (image.naturalWidth > 0 && image.naturalHeight > 0) {
      updateFrameSize(image.naturalWidth / image.naturalHeight);
    }
  });

  if (image.complete && image.naturalWidth > 0 && image.naturalHeight > 0) {
    updateFrameSize(image.naturalWidth / image.naturalHeight);
  }

  button.addEventListener("click", () => {
    if (isCollectionSelectionMode()) {
      toggleCollectionBook(book.id);
      return;
    }

    void openBook(book.id);
  });

  animateReveal(button, `library-book:${book.id}`, Number(layout.index) || 0, "up");
  bindMotionInteractions(button);
  return button;
}

/** Opens a collection overlay and ensures it has a valid selected detail book. */
function openCollection(collectionId) {
  const collection = state.library.collections.find((entry) => entry.id === collectionId);
  if (!collection) {
    return;
  }

  state.currentCollectionId = collectionId;
  const memberBooks = getBooksForCollection(collection);
  if (!memberBooks.some((book) => book.id === state.collectionDetailBookId)) {
    state.collectionDetailBookId = memberBooks[0]?.id || "";
  }
  setCollectionOpen(true);
  renderCollectionView();
}

/** Clears collection-selection mode after create/edit flows complete or are canceled. */
function resetCollectionSelection() {
  state.collectionSelectionMode = "";
  state.editingCollectionId = "";
  state.selectedCollectionBookIds = [];
}

/** Starts collection creation or editing by turning the main library into a picker surface. */
function beginCollectionSelection(mode, collection = null) {
  state.collectionSelectionMode = mode;
  state.editingCollectionId = collection?.id || "";
  state.selectedCollectionBookIds = collection?.bookIds ? [...collection.bookIds] : [];
  setCollectionOpen(false);
  renderLibrary();
}

/** Toggles a book inside the in-progress collection selection set. */
function toggleCollectionBook(bookId) {
  if (!isCollectionSelectionMode()) {
    return;
  }

  if (isBookSelectedForCollection(bookId)) {
    state.selectedCollectionBookIds = state.selectedCollectionBookIds.filter((id) => id !== bookId);
  } else {
    state.selectedCollectionBookIds = [...state.selectedCollectionBookIds, bookId];
  }

  renderLibrary();
}

/** Saves the pending collection selection, prompting for metadata when creating a new collection. */
async function confirmCollectionSelection() {
  if (!isCollectionSelectionMode()) {
    return;
  }

  if (state.selectedCollectionBookIds.length === 0) {
    showToast("Select at least one audiobook for the collection.");
    return;
  }

  try {
    setBusy(true, "Saving collection...");

    if (state.collectionSelectionMode === "create") {
      const firstSelectedBook =
        state.library.books.find((book) => book.id === state.selectedCollectionBookIds[0]) || null;
      const suggestedName =
        state.selectedCollectionBookIds.length === 1
          ? firstSelectedBook?.title || "New Collection"
          : "New Collection";
      setBusy(false);
      const result = await showCollectionDialog({
        title: "Create Collection",
        name: suggestedName,
        description: ""
      });
      if (!result?.name) {
        return;
      }

      setBusy(true, "Saving collection...");
      const library = await api.createCollection({
        name: result.name,
        description: result.description || "",
        bookIds: state.selectedCollectionBookIds
      });
      updateLibraryState(library);
    } else {
      const collectionId = state.editingCollectionId;
      const library = await api.updateCollection(collectionId, {
        bookIds: state.selectedCollectionBookIds
      });
      updateLibraryState(library);
      state.currentCollectionId = collectionId;
      setCollectionOpen(true);
    }

    resetCollectionSelection();
    renderLibrary();
    renderCollections();
    renderCollectionView();
  } catch (error) {
    showToast(error?.message || "Unable to save the collection.");
  } finally {
    setBusy(false);
  }
}

/** Cancels collection selection and restores the previously open collection when editing. */
function cancelCollectionSelection() {
  const editedCollectionId = state.collectionSelectionMode === "edit" ? state.editingCollectionId : "";
  resetCollectionSelection();
  renderLibrary();
  renderCollections();
  if (editedCollectionId) {
    state.currentCollectionId = editedCollectionId;
    setCollectionOpen(true);
    renderCollectionView();
  }
}

/**
 * Opens a book in the full player and resolves the correct initial resume state.
 *
 * Explicit resume values win, then current library state, then stored playback, and finally configured
 * defaults. That order keeps continue-listening clicks and resume settings predictable.
 *
 * @param {string} bookId - Audiobook identifier.
 * @param {{ resumePosition?: number, resumeSpeed?: number }} [options={}] - Optional explicit resume overrides.
 */
async function openBook(bookId, { resumePosition = Number.NaN, resumeSpeed = Number.NaN } = {}) {
  const book = state.library.books.find((entry) => entry.id === bookId);
  if (!book) {
    return;
  }

  persistPlaybackState(true);

  state.currentBookId = bookId;
  const playbackState = await api.getPlaybackState(bookId);
  const storedPosition = Number.isFinite(playbackState?.position) ? playbackState.position : 0;
  const allowResume = shouldResumeFromLastPosition();
  const fallbackPosition = Number.isFinite(resumePosition)
    ? Math.max(0, resumePosition)
    : allowResume && Number.isFinite(book.resumePosition)
      ? Math.max(0, book.resumePosition)
      : 0;
  const initialPosition =
    allowResume && storedPosition > 0 && Math.abs(storedPosition - fallbackPosition) <= 1
      ? storedPosition
      : fallbackPosition > 0
        ? fallbackPosition
        : allowResume
          ? storedPosition
          : 0;

  const hasStoredPlaybackState = Boolean(playbackState?.updatedAt);
  const storedSpeed = Number.isFinite(playbackState?.speed)
    ? playbackState.speed
    : getUiPreferences().defaultPlaybackSpeed;
  const explicitSpeed = Number.isFinite(resumeSpeed)
    ? Math.min(2, Math.max(0.75, resumeSpeed))
    : Number.isFinite(book.resumeSpeed)
      ? Math.min(2, Math.max(0.75, book.resumeSpeed))
      : Number.NaN;
  const initialSpeed = Number.isFinite(explicitSpeed)
    ? explicitSpeed
    : hasStoredPlaybackState
      ? storedSpeed
      : getUiPreferences().defaultPlaybackSpeed;
  const resolvedPlaybackState = {
    position: initialPosition,
    speed: initialSpeed
  };

  player.load(book, resolvedPlaybackState);
  state.playerSnapshot = {
    ...state.playerSnapshot,
    currentTime: initialPosition,
    duration: book.duration || 0,
    rate: initialSpeed
  };
  state.lastPersistedPosition = initialPosition;
  state.lastPersistedSpeed = initialSpeed;
  state.lastPersistAt = Date.now();
  state.lastChapterBackAt = 0;
  state.lastChapterBackIndex = -1;
  state.pausedChapterIndex = getChapterIndexForTime(initialPosition, {
    boundaryBias: "previous"
  });
  state.playerChapterDrawerOpen = false;
  state.playerSummaryExpanded = false;
  setPlayerOpen(true);
  renderLibrary();
  renderPlayer();
}

/** Minimizes the full player into the bottom dock after forcing a playback-state save. */
async function minimizePlayer() {
  await exitPlayerFullscreenIfNeeded();
  await persistPlaybackState(true);
  setPlayerOpen(false);
  setPlayerMinimized(Boolean(getCurrentBook()) && shouldShowMiniPlayerOnMinimize());
  renderLibrary();
}

/** Hides the bottom dock without clearing playback progress or treating the action like a stop. */
async function closeMiniPlayer() {
  setPlayerMinimized(false);
  renderLibrary();
}

/** Consumes live updates from the playback engine and re-renders the dependent player UI. */
function handlePlayerUpdate(snapshot) {
  const wasPlaying = state.playerSnapshot.isPlaying;
  if (snapshot.currentChapterIndex !== state.playerSnapshot.currentChapterIndex) {
    state.lastChapterBackAt = 0;
    state.lastChapterBackIndex = -1;
  }

  state.playerSnapshot = snapshot;
  if (snapshot.isPlaying) {
    state.pausedChapterIndex = -1;
  } else if (wasPlaying || state.pausedChapterIndex < 0) {
    state.pausedChapterIndex = getChapterIndexForTime(snapshot.currentTime, {
      boundaryBias: "previous"
    });
  }
  if (state.scrubValue === null) {
    renderProgress();
  }
  renderControls();
  renderChapters();
  renderMiniPlayer();
  persistPlaybackState(false);
}

/**
 * Persists playback position and speed using a small throttle.
 *
 * @param {boolean} force - When true, bypasses the normal throttle and dirty checks.
 * @returns {Promise<object>|undefined} Save promise when a write occurs.
 */
function persistPlaybackState(force) {
  const book = getCurrentBook();
  if (!book) {
    return;
  }

  const position = state.playerSnapshot.currentTime || 0;
  const speed = state.playerSnapshot.rate || 1;
  const now = Date.now();
  const positionChanged = Math.abs(position - state.lastPersistedPosition) >= 1;
  const speedChanged = Math.abs(speed - state.lastPersistedSpeed) >= 0.01;

  if (!force && !speedChanged && !positionChanged) {
    return;
  }

  if (!force && now - state.lastPersistAt < 2000) {
    return;
  }

  state.lastPersistAt = now;
  state.lastPersistedPosition = position;
  state.lastPersistedSpeed = speed;
  const updatedAt = new Date(now).toISOString();
  applyResumeStateToLibrary(book.id, position, speed, updatedAt);

  const savePromise = api.savePlaybackState(book.id, {
    position,
    speed
  });

  if (!state.playerOpen || state.playerMinimized) {
    renderLibrary();
    renderMiniPlayer();
  }

  return savePromise;
}

/** Seeks directly to a chapter start while keeping paused-state chapter tracking in sync. */
function seekToChapter(chapterIndex) {
  const chapters = getBookChapters();
  if (chapterIndex < 0 || chapterIndex >= chapters.length) {
    return;
  }

  state.lastChapterBackAt = 0;
  state.lastChapterBackIndex = -1;
  state.pausedChapterIndex = chapterIndex;
  player.seek(getChapterSeekTime(chapterIndex), {
    autoplay: state.playerSnapshot.isPlaying
  });
}

/** Advances to the next chapter when one exists. */
function handleChapterNext() {
  const chapters = getBookChapters();
  if (chapters.length === 0) {
    return;
  }

  const currentIndex = Math.max(0, getDisplayChapterIndex());
  if (currentIndex < chapters.length - 1) {
    seekToChapter(currentIndex + 1);
  }
}

/** Restarts the current chapter or jumps backward using the same rules as common media players. */
function handleChapterBack() {
  const chapters = getBookChapters();
  if (chapters.length === 0) {
    return;
  }

  const currentIndex = Math.max(0, getDisplayChapterIndex());
  const currentChapter = chapters[currentIndex];
  const elapsedInChapter = Math.max(
    0,
    (state.playerSnapshot.currentTime || 0) - (currentChapter?.start || 0)
  );
  const now = Date.now();
  const shouldGoPrevious =
    currentIndex > 0 &&
    (elapsedInChapter <= CHAPTER_RESTART_THRESHOLD_SECONDS ||
      (state.lastChapterBackIndex === currentIndex &&
        now - state.lastChapterBackAt <= CHAPTER_DOUBLE_CLICK_WINDOW_MS));

  if (shouldGoPrevious) {
    seekToChapter(currentIndex - 1);
    return;
  }

  state.lastChapterBackAt = now;
  state.lastChapterBackIndex = currentIndex;
  player.seek(getChapterSeekTime(currentIndex), {
    autoplay: state.playerSnapshot.isPlaying
  });
}

/** Opens the native folder picker, scans the chosen library, and optionally refreshes metadata. */
async function chooseLibraryFolder() {
  try {
    setBusy(true, "Scanning library...");
    const result = await api.addLibraryFolder();
    if (!result?.canceled && result?.library) {
      updateLibraryState(result.library);
      if (getUiPreferences().autoRefreshMetadata) {
        await refreshLibraryMetadata({ showNotification: false });
        showToast("Library scanned and metadata refreshed.");
      }
    }
  } catch (error) {
    showToast(error?.message || "Unable to scan the selected library.");
  } finally {
    setBusy(false);
  }
}

/** Rescans every imported library root and optionally refreshes metadata afterward. */
async function rescanLibrary() {
  try {
    setBusy(true, "Refreshing library...");
    const library = await api.rescanLibrary();
    updateLibraryState(library);
    if (getUiPreferences().autoRefreshMetadata) {
      await refreshLibraryMetadata({ showNotification: false });
      showToast("Library refreshed and metadata updated.");
    }
  } catch (error) {
    showToast(error?.message || "Unable to rescan the library.");
  } finally {
    setBusy(false);
  }
}

/**
 * Refreshes metadata for the whole library.
 *
 * @param {{ showNotification?: boolean }} [options={}] - Whether to show a completion toast.
 */
async function refreshLibraryMetadata({ showNotification = true } = {}) {
  try {
    setBusy(true, "Refreshing metadata...");
    const result = await api.refreshLibraryMetadata();
    updateLibraryState(result?.library);
    if (showNotification) {
      showToast(
        result?.refreshedCount
          ? `Metadata refreshed for ${result.refreshedCount} books. Matched ${result.matchedCount}.`
          : "No books are available for metadata refresh."
      );
    }
  } catch (error) {
    showToast(error?.message || "Unable to refresh metadata.");
  } finally {
    setBusy(false);
  }
}

/**
 * Refreshes metadata for one book.
 *
 * @param {string} [bookId=state.currentBookId] - Book to refresh.
 */
async function refreshMetadataForBook(bookId = state.currentBookId) {
  if (!bookId) {
    return;
  }

  try {
    setBusy(true, "Refreshing book metadata...");
    const result = await api.refreshBookMetadata(bookId);
    updateLibraryState(result?.library);
    showToast(
      result?.matchedCount
        ? "Metadata refreshed for this audiobook."
        : "No external metadata match was found for this audiobook."
    );
  } catch (error) {
    showToast(error?.message || "Unable to refresh metadata for this audiobook.");
  } finally {
    setBusy(false);
  }
}

/** Prevents global shortcuts from firing while the user is typing or using form controls. */
function shouldIgnoreShortcuts(target) {
  return Boolean(target?.closest("input, select, textarea, button"));
}

/**
 * Registers all renderer event handlers.
 *
 * This file centralizes events here so the rest of the module can stay focused on state transitions and rendering.
 */
function bindEvents() {
  elements.sidebarToggleButton.addEventListener("click", () => {
    applySidebarState(!state.sidebarCollapsed);
  });

  elements.libraryNavButton.addEventListener("click", () => {
    setActiveView("library");
    renderLibrary();
    renderCollections();
  });

  elements.settingsNavButton.addEventListener("click", () => {
    setActiveView("settings");
    renderSettings();
  });

  elements.windowMinimizeButton.addEventListener("click", () => {
    void api.minimizeWindow();
  });

  elements.windowPinButton.addEventListener("click", async () => {
    const windowState = await api.toggleAlwaysOnTopWindow();
    applyWindowState(windowState);
  });

  elements.windowMaximizeButton.addEventListener("click", async () => {
    const windowState = await api.toggleMaximizeWindow();
    applyWindowState(windowState);
  });

  elements.windowCloseButton.addEventListener("click", () => {
    void api.closeWindow();
  });

  elements.customTitlebarDrag.addEventListener("dblclick", async () => {
    const windowState = await api.toggleMaximizeWindow();
    applyWindowState(windowState);
  });

  elements.chooseLibraryButton.addEventListener("click", () => {
    void chooseLibraryFolder();
  });

  elements.newCollectionButton.addEventListener("click", () => {
    if (isCollectionSelectionMode()) {
      void confirmCollectionSelection();
      return;
    }

    if (state.library.books.length === 0) {
      showToast("Import audiobooks before creating a collection.");
      return;
    }

    beginCollectionSelection("create");
  });

  elements.cancelCollectionButton.addEventListener("click", () => {
    cancelCollectionSelection();
  });

  elements.collectionModalCancel.addEventListener("click", () => {
    closeCollectionDialog(null);
  });

  elements.collectionModalSave.addEventListener("click", () => {
    const name = elements.collectionNameInput.value.trim();
    if (!name) {
      elements.collectionNameInput.focus();
      return;
    }

    closeCollectionDialog({
      name,
      description: elements.collectionDescriptionInput.value.trim()
    });
  });

  elements.rescanLibraryButton.addEventListener("click", () => {
    void rescanLibrary();
  });

  elements.refreshMetadataButton.addEventListener("click", () => {
    void refreshLibraryMetadata();
  });

  elements.settingsAnimationsEnabled.addEventListener("change", async () => {
    await persistUiPreferences(
      { animationsEnabled: elements.settingsAnimationsEnabled.checked },
      { silent: false }
    );
  });

  elements.settingsSidebarDefault.addEventListener("change", async () => {
    const shouldCollapse = elements.settingsSidebarDefault.value === "collapsed";
    applySidebarState(shouldCollapse);
    await persistUiPreferences(
      { sidebarCollapsedByDefault: shouldCollapse },
      { silent: false }
    );
  });

  elements.settingsStartView.addEventListener("change", async () => {
    await persistUiPreferences(
      { startView: elements.settingsStartView.value === "settings" ? "settings" : "library" },
      { silent: false }
    );
  });

  elements.settingsDefaultCoverSize.addEventListener("input", () => {
    const value = clampCollectionCoverSize(elements.settingsDefaultCoverSize.value);
    elements.settingsDefaultCoverSizeValue.textContent = `${value}px`;
    if (!shouldRememberCollectionCoverSize()) {
      applyCollectionCoverSize(value);
    }
  });

  elements.settingsDefaultCoverSize.addEventListener("change", async () => {
    const value = clampCollectionCoverSize(elements.settingsDefaultCoverSize.value);
    await persistUiPreferences(
      {
        defaultCollectionCoverSize: value,
        collectionCoverSize: shouldRememberCollectionCoverSize()
          ? getUiPreferences().collectionCoverSize
          : value
      },
      { silent: false }
    );
    if (!shouldRememberCollectionCoverSize()) {
      applyCollectionCoverSize(value);
      renderCollectionView();
    }
  });

  elements.settingsRememberCoverSize.addEventListener("change", async () => {
    const rememberCollectionCoverSize = elements.settingsRememberCoverSize.checked;
    const changes = {
      rememberCollectionCoverSize
    };

    if (!rememberCollectionCoverSize) {
      changes.collectionCoverSize = getUiPreferences().defaultCollectionCoverSize;
    } else {
      changes.collectionCoverSize = state.collectionCoverSize;
    }

    await persistUiPreferences(changes, { silent: false });
    applyCollectionCoverSize(getResolvedCollectionCoverSize());
    renderCollectionView();
  });

  elements.settingsShowContinueListening.addEventListener("change", async () => {
    await persistUiPreferences(
      { showContinueListening: elements.settingsShowContinueListening.checked },
      { silent: false }
    );
    renderLibrary();
  });

  elements.settingsDefaultPlaybackSpeed.addEventListener("change", async () => {
    await persistUiPreferences(
      { defaultPlaybackSpeed: clampPlaybackSpeed(elements.settingsDefaultPlaybackSpeed.value) },
      { silent: false }
    );
  });

  elements.settingsSkipInterval.addEventListener("change", async () => {
    await persistUiPreferences(
      { skipIntervalSeconds: clampSkipIntervalSeconds(elements.settingsSkipInterval.value) },
      { silent: false }
    );
    renderControls();
    renderMiniPlayer();
  });

  elements.settingsResumePosition.addEventListener("change", async () => {
    await persistUiPreferences(
      { resumeFromLastPosition: elements.settingsResumePosition.checked },
      { silent: false }
    );
  });

  elements.settingsShowMiniPlayer.addEventListener("change", async () => {
    await persistUiPreferences(
      { showMiniPlayerOnMinimize: elements.settingsShowMiniPlayer.checked },
      { silent: false }
    );
  });

  elements.settingsAutoRefreshMetadata.addEventListener("change", async () => {
    await persistUiPreferences(
      { autoRefreshMetadata: elements.settingsAutoRefreshMetadata.checked },
      { silent: false }
    );
  });

  elements.settingsShowMetadataSource.addEventListener("change", async () => {
    await persistUiPreferences(
      { showMetadataSource: elements.settingsShowMetadataSource.checked },
      { silent: false }
    );
    renderCollectionView();
    renderPlayer();
  });

  elements.resumeBookButton.addEventListener("click", () => {
    const book = getCurrentBook();
    if (book) {
      setPlayerOpen(true);
      renderPlayer();
    }
  });

  elements.closePlayerButton.addEventListener("click", () => {
      void minimizePlayer();
    });

    elements.playerFullscreenButton.addEventListener("click", () => {
      void togglePlayerFullscreen();
    });

    elements.playerDockFullscreenButton.addEventListener("click", () => {
      void togglePlayerFullscreen();
    });

   elements.playerChaptersToggle.addEventListener("click", () => {
      setPlayerChapterDrawerOpen(!state.playerChapterDrawerOpen);
    });

  elements.playerDrawerBackdrop.addEventListener("click", () => {
    setPlayerChapterDrawerOpen(false);
  });

  elements.chapterDrawerCloseButton.addEventListener("click", () => {
    setPlayerChapterDrawerOpen(false);
  });

    elements.playerSummaryToggle.addEventListener("click", () => {
      setPlayerSummaryExpanded(!state.playerSummaryExpanded);
    });

    elements.playerView.addEventListener("pointermove", () => {
      if (state.playerFullscreen) {
        schedulePlayerHudHide();
      }
    });

    elements.playerView.addEventListener("pointerdown", () => {
      if (state.playerFullscreen) {
        schedulePlayerHudHide();
      }
    });

    elements.playerView.addEventListener("touchstart", () => {
      if (state.playerFullscreen) {
        schedulePlayerHudHide();
      }
    });

  elements.refreshCurrentMetadataButton.addEventListener("click", () => {
    void refreshMetadataForBook();
  });

  elements.closeCollectionButton.addEventListener("click", () => {
    setCollectionOpen(false);
  });

  elements.editCollectionButton.addEventListener("click", () => {
    const collection = getCurrentCollection();
    if (!collection) {
      return;
    }

    beginCollectionSelection("edit", collection);
  });

  elements.collectionSizeSlider.addEventListener("input", () => {
    applyCollectionCoverSize(elements.collectionSizeSlider.value);
    if (shouldRememberCollectionCoverSize()) {
      scheduleCollectionCoverSizeSave();
    }
  });

  elements.collectionSizeSlider.addEventListener("change", () => {
    applyCollectionCoverSize(elements.collectionSizeSlider.value);
    if (shouldRememberCollectionCoverSize()) {
      void persistCollectionCoverSize();
    }
  });

  elements.togglePlaybackButton.addEventListener("click", () => {
    player.toggle();
  });

  elements.miniPlayerOpenButton.addEventListener("click", () => {
    if (!state.currentBookId) {
      return;
    }

    setPlayerOpen(true);
    renderPlayer();
  });

  elements.miniPlayerCloseButton.addEventListener("click", () => {
    void closeMiniPlayer();
  });

  elements.miniPlayerExpandButton.addEventListener("click", () => {
    if (!state.currentBookId) {
      return;
    }

    setPlayerOpen(true);
    renderPlayer();
  });

  elements.miniPlayerChapterButton.addEventListener("click", (event) => {
    event.stopPropagation();
    setMiniPlayerChapterMenuOpen(!state.miniPlayerChapterMenuOpen);
    renderMiniPlayerChapterMenu();
  });

  elements.miniPlayerToggleButton.addEventListener("click", (event) => {
    event.stopPropagation();
    if (!state.currentBookId) {
      return;
    }

    player.toggle();
  });

  elements.miniPlayerBackButton.addEventListener("click", (event) => {
    event.stopPropagation();
    handleChapterBack();
  });

  elements.miniPlayerNextButton.addEventListener("click", (event) => {
    event.stopPropagation();
    handleChapterNext();
  });

  elements.miniPlayerSkipBackButton.addEventListener("click", (event) => {
    event.stopPropagation();
    player.skip(-getSkipIntervalSeconds());
  });

  elements.miniPlayerSkipForwardButton.addEventListener("click", (event) => {
    event.stopPropagation();
    player.skip(getSkipIntervalSeconds());
  });

  elements.miniPlayerProgress.addEventListener("input", (event) => {
    event.stopPropagation();
    const nextTime = Number.parseFloat(elements.miniPlayerProgress.value);
    if (!Number.isFinite(nextTime)) {
      return;
    }

    state.miniPlayerScrubValue = nextTime;
    seekWithinActiveChapter(nextTime);
    renderMiniPlayer();
  });

  elements.miniPlayerProgress.addEventListener("change", (event) => {
    event.stopPropagation();
    const nextTime = Number.parseFloat(elements.miniPlayerProgress.value);
    seekWithinActiveChapter(nextTime);
    state.miniPlayerScrubValue = null;
    renderMiniPlayer();
    persistPlaybackState(true);
  });

  elements.chapterBackButton.addEventListener("click", () => {
    handleChapterBack();
  });

  elements.chapterNextButton.addEventListener("click", () => {
    handleChapterNext();
  });

  elements.skipBackButton.addEventListener("click", () => {
    player.skip(-getSkipIntervalSeconds());
  });

  elements.skipForwardButton.addEventListener("click", () => {
    player.skip(getSkipIntervalSeconds());
  });

  elements.volumeSlider.addEventListener("input", () => {
    const volumePercent = Number.parseFloat(elements.volumeSlider.value) || 0;
    const volume = volumePercent / 100;
    if (Number.isFinite(volume)) {
      player.setVolume(volume);
      updateVolumeBubble(volumePercent);
      showVolumeBubble();
    }
  });

  elements.volumeSlider.addEventListener("mouseenter", () => {
    showVolumeBubble();
  });

  elements.volumeSlider.addEventListener("mouseleave", () => {
    hideVolumeBubble();
  });

  elements.volumeSlider.addEventListener("focus", () => {
    showVolumeBubble();
  });

  elements.volumeSlider.addEventListener("blur", () => {
    hideVolumeBubble();
  });

  elements.miniPlayerVolumeSlider.addEventListener("input", () => {
    const volumePercent = Number.parseFloat(elements.miniPlayerVolumeSlider.value) || 0;
    const volume = volumePercent / 100;
    if (Number.isFinite(volume)) {
      player.setVolume(volume);
      syncVolumeControls(volumePercent);
      updateVolumeBubble(volumePercent);
    }
  });

  elements.speedSelect.addEventListener("change", () => {
    const rate = Number.parseFloat(elements.speedSelect.value);
    if (Number.isFinite(rate)) {
      player.setRate(rate);
      persistPlaybackState(true);
    }
  });

  elements.progress.addEventListener("input", () => {
    const nextTime = Number.parseFloat(elements.progress.value);
    if (!Number.isFinite(nextTime)) {
      return;
    }

    state.scrubValue = nextTime;
    seekWithinActiveChapter(nextTime);
    renderProgress();
  });

  elements.progress.addEventListener("change", () => {
    const nextTime = Number.parseFloat(elements.progress.value);
    seekWithinActiveChapter(nextTime);
    state.scrubValue = null;
    renderProgress();
    persistPlaybackState(true);
  });

  window.addEventListener("keydown", (event) => {
    if (state.collectionDialogResolver && event.code === "Escape") {
      event.preventDefault();
      closeCollectionDialog(null);
      return;
    }

    if (
      state.collectionDialogResolver &&
      event.code === "Enter" &&
      !event.shiftKey &&
      event.target === elements.collectionNameInput
    ) {
      event.preventDefault();
      elements.collectionModalSave.click();
      return;
    }

    if (shouldIgnoreShortcuts(event.target)) {
      return;
    }

      if (event.code === "Escape" && state.playerOpen) {
        event.preventDefault();
        if (state.playerFullscreen) {
          void togglePlayerFullscreen();
          return;
        }
        if (state.playerChapterDrawerOpen) {
          setPlayerChapterDrawerOpen(false);
          return;
        }
        void minimizePlayer();
      return;
    }

    if (event.code === "Escape" && state.collectionOpen) {
      event.preventDefault();
      setCollectionOpen(false);
      return;
    }

    if (event.code === "Escape" && state.miniPlayerChapterMenuOpen) {
      event.preventDefault();
      setMiniPlayerChapterMenuOpen(false);
      return;
    }

    if (event.code === "Escape" && isCollectionSelectionMode()) {
      event.preventDefault();
      cancelCollectionSelection();
      return;
    }

    if (!state.currentBookId) {
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      player.toggle();
      return;
    }

    if (event.code === "ArrowLeft") {
      event.preventDefault();
      player.skip(-getSkipIntervalSeconds());
      return;
    }

    if (event.code === "ArrowRight") {
      event.preventDefault();
      player.skip(getSkipIntervalSeconds());
    }
  });

  window.addEventListener("beforeunload", () => {
    window.clearTimeout(state.collectionCoverSizeSaveTimer);
    window.clearTimeout(state.playerHudIdleTimer);
    stopPlayerReactiveLoop();
    persistPlaybackState(true);
    player.destroy();
    grid.destroy();
  });

  document.addEventListener("pointerdown", (event) => {
    if (!state.miniPlayerChapterMenuOpen) {
      return;
    }

    const target = event.target;
    if (
      target instanceof Node &&
      (elements.miniPlayerChapterButton.contains(target) ||
        elements.miniPlayerChapterMenu.contains(target))
    ) {
      return;
    }

    setMiniPlayerChapterMenuOpen(false);
  });
}

/** Boots the renderer by wiring events, hydrating window state, and loading the cached library. */
async function init() {
  bindEvents();
  applyStaticControlIcons();
  bindMotionInteractions(document);
  setBusy(true, "Loading cached library...");

  try {
    applyWindowState(await api.getWindowState());
    api.onWindowStateChange((windowState) => {
      applyWindowState(windowState);
    });
    const library = await api.getLibraryState();
    updateLibraryState(library);
  } catch (error) {
    showToast(error?.message || "Unable to load the local library cache.");
  } finally {
    setBusy(false);
  }
}

void init();
