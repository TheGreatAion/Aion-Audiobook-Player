// src/main/library-store.js persists the app's cached library, collections, metadata, playback, and UI settings.
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const DATABASE_VERSION = 7;
const DEFAULT_COLLECTION_COVER_SIZE = 220;
const MIN_COLLECTION_COVER_SIZE = 150;
const MAX_COLLECTION_COVER_SIZE = 320;
const DEFAULT_PLAYBACK_SPEED = 1;
const ALLOWED_SKIP_INTERVALS = new Set([10, 15, 30, 45, 60]);

/** Clamps playback speed to the renderer-supported range so persisted values cannot break controls. */
function clampPlaybackSpeed(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return DEFAULT_PLAYBACK_SPEED;
  }

  return Math.min(2, Math.max(0.75, Number(numericValue.toFixed(2))));
}

/** Restricts skip intervals to the small set of values the UI exposes consistently. */
function clampSkipIntervalSeconds(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    return 30;
  }

  return ALLOWED_SKIP_INTERVALS.has(numericValue) ? numericValue : 30;
}

/** Keeps persisted collection cover sizes within the layout bounds the renderer was designed for. */
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

/** Creates a fully populated database shell so migrations can merge safely against known defaults. */
function createDefaultDatabase() {
  return {
    version: DATABASE_VERSION,
    library: {
      libraries: []
    },
    collections: [],
    metadata: {},
    playback: {},
    uiPreferences: sanitizeUiPreferences({})
  };
}

/** Uses natural sorting so folders, titles, and collections stay predictably ordered across restarts. */
function sortNaturally(a, b) {
  return String(a || "").localeCompare(String(b || ""), undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

/** Generates collection ids locally because collections are managed entirely on-device. */
function createCollectionId(name) {
  return crypto
    .createHash("sha1")
    .update(`${name}-${Date.now()}-${Math.random()}`)
    .digest("hex")
    .slice(0, 16);
}

/** Sanitizes one persisted library entry before it is merged into live application state. */
function sanitizeLibraryEntry(entry) {
  const rootFolder = typeof entry?.rootFolder === "string" ? entry.rootFolder : "";
  return {
    rootFolder,
    updatedAt: typeof entry?.updatedAt === "string" ? entry.updatedAt : "",
    books: Array.isArray(entry?.books) ? entry.books : []
  };
}

/** Sanitizes collection data and removes duplicate book references introduced by manual edits or migrations. */
function sanitizeCollectionEntry(entry) {
  return {
    id: typeof entry?.id === "string" ? entry.id : createCollectionId(entry?.name || "collection"),
    name: typeof entry?.name === "string" && entry.name.trim() ? entry.name.trim() : "Untitled Collection",
    description: typeof entry?.description === "string" ? entry.description.trim() : "",
    bookIds: Array.isArray(entry?.bookIds)
      ? [...new Set(entry.bookIds.filter((bookId) => typeof bookId === "string" && bookId))]
      : [],
    updatedAt: typeof entry?.updatedAt === "string" ? entry.updatedAt : new Date().toISOString()
  };
}

/** Sanitizes external metadata before it is surfaced in the player or collection views. */
function sanitizeMetadataEntry(entry) {
  return {
    status: typeof entry?.status === "string" ? entry.status : "",
    fetchedAt: typeof entry?.fetchedAt === "string" ? entry.fetchedAt : "",
    author: typeof entry?.author === "string" ? entry.author.trim() : "",
    summary: typeof entry?.summary === "string" ? entry.summary.trim() : "",
    series: typeof entry?.series === "string" ? entry.series.trim() : "",
    seriesIndex:
      typeof entry?.seriesIndex === "string" || Number.isFinite(entry?.seriesIndex)
        ? String(entry.seriesIndex).trim()
        : "",
    publishedYear:
      typeof entry?.publishedYear === "string" || Number.isFinite(entry?.publishedYear)
        ? String(entry.publishedYear).trim()
        : "",
    genres: Array.isArray(entry?.genres)
      ? [...new Set(entry.genres.map((genre) => String(genre).trim()).filter(Boolean))]
      : [],
    sources: Array.isArray(entry?.sources)
      ? [...new Set(entry.sources.map((source) => String(source).trim()).filter(Boolean))]
      : [],
    links:
      entry?.links && typeof entry.links === "object"
        ? Object.fromEntries(
            Object.entries(entry.links)
              .map(([key, value]) => [key, typeof value === "string" ? value.trim() : ""])
              .filter(([, value]) => value)
          )
        : {}
  };
}

/**
 * Normalizes persisted UI preferences and fills in safe defaults for missing fields.
 *
 * This keeps older database versions usable without requiring destructive migrations when new preferences
 * are added over time.
 *
 * @param {object} entry - Raw persisted preference payload.
 * @returns {object} Sanitized UI preferences.
 */
function sanitizeUiPreferences(entry) {
  const defaultCollectionCoverSize = clampCollectionCoverSize(
    entry?.defaultCollectionCoverSize ?? entry?.collectionCoverSize
  );
  const miniPlayerDockBookId =
    typeof entry?.miniPlayerDockBookId === "string" ? entry.miniPlayerDockBookId : "";

  return {
    animationsEnabled: entry?.animationsEnabled !== false,
    sidebarCollapsedByDefault: Boolean(entry?.sidebarCollapsedByDefault),
    startView: entry?.startView === "settings" ? "settings" : "library",
    collectionCoverSize: clampCollectionCoverSize(entry?.collectionCoverSize ?? defaultCollectionCoverSize),
    defaultCollectionCoverSize,
    rememberCollectionCoverSize: entry?.rememberCollectionCoverSize !== false,
    showContinueListening: entry?.showContinueListening !== false,
    defaultPlaybackSpeed: clampPlaybackSpeed(entry?.defaultPlaybackSpeed),
    skipIntervalSeconds: clampSkipIntervalSeconds(entry?.skipIntervalSeconds),
    resumeFromLastPosition: entry?.resumeFromLastPosition !== false,
    showMiniPlayerOnMinimize: entry?.showMiniPlayerOnMinimize !== false,
    miniPlayerDockOpen: Boolean(entry?.miniPlayerDockOpen && miniPlayerDockBookId),
    miniPlayerDockBookId,
    autoRefreshMetadata: Boolean(entry?.autoRefreshMetadata),
    showMetadataSource: entry?.showMetadataSource !== false
  };
}

/** Upgrades legacy single-library payloads into the current multi-library structure. */
function normalizeLibraryState(rawLibrary) {
  const defaultLibrary = createDefaultDatabase().library;

  if (Array.isArray(rawLibrary?.libraries)) {
    return {
      libraries: rawLibrary.libraries
        .map(sanitizeLibraryEntry)
        .filter((entry) => entry.rootFolder)
        .sort((left, right) => sortNaturally(left.rootFolder, right.rootFolder))
    };
  }

  if (typeof rawLibrary?.rootFolder === "string" && rawLibrary.rootFolder) {
    return {
      libraries: [
        sanitizeLibraryEntry({
          rootFolder: rawLibrary.rootFolder,
          updatedAt: rawLibrary.updatedAt,
          books: rawLibrary.books
        })
      ]
    };
  }

  return defaultLibrary;
}

/** Finds the freshest library timestamp so the renderer can show one summary status line. */
function getLatestUpdatedAt(libraries) {
  return libraries.reduce((latest, entry) => {
    if (!entry.updatedAt) {
      return latest;
    }

    if (!latest) {
      return entry.updatedAt;
    }

    return new Date(entry.updatedAt) > new Date(latest) ? entry.updatedAt : latest;
  }, "");
}

/**
 * Creates the JSON-backed persistence service used by the Electron main process.
 *
 * @param {import('electron').App} electronApp - Electron app instance used to resolve the userData path.
 * @returns {object} Store API for libraries, collections, metadata, playback, and UI preferences.
 */
function createLibraryStore(electronApp) {
  const userDataDir = electronApp.getPath("userData");
  const databasePath = path.join(userDataDir, "library-db.json");
  const coversDir = path.join(userDataDir, "covers");

  let database = loadDatabase(databasePath);

  /** Loads the on-disk database and upgrades older shapes into the current schema. */
  function loadDatabase(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        return createDefaultDatabase();
      }

      const parsed = JSON.parse(fs.readFileSync(filePath, "utf8"));
      if (!parsed || typeof parsed !== "object") {
        return createDefaultDatabase();
      }

      return {
        ...createDefaultDatabase(),
        ...parsed,
        version: DATABASE_VERSION,
        library: normalizeLibraryState(parsed.library),
        collections: Array.isArray(parsed.collections)
          ? parsed.collections.map(sanitizeCollectionEntry)
          : [],
        metadata:
          parsed.metadata && typeof parsed.metadata === "object"
            ? Object.fromEntries(
                Object.entries(parsed.metadata)
                  .filter(([bookId]) => typeof bookId === "string" && bookId)
                  .map(([bookId, entry]) => [bookId, sanitizeMetadataEntry(entry)])
              )
            : {},
        playback:
          parsed.playback && typeof parsed.playback === "object" ? parsed.playback : {},
        uiPreferences: sanitizeUiPreferences(parsed.uiPreferences)
      };
    } catch {
      return createDefaultDatabase();
    }
  }

  /** Persists the entire database atomically enough for this single-user desktop app. */
  function persistDatabase() {
    fs.mkdirSync(path.dirname(databasePath), { recursive: true });
    fs.mkdirSync(coversDir, { recursive: true });
    fs.writeFileSync(databasePath, JSON.stringify(database, null, 2), "utf8");
  }

  /** Adds convenience availability flags so the renderer can warn about disconnected library roots. */
  function getLibrariesWithAvailability() {
    return database.library.libraries
      .map((entry) => {
        const rootFolder = entry.rootFolder || "";
        return {
          ...entry,
          rootAvailable: rootFolder ? fs.existsSync(rootFolder) : false,
          bookCount: Array.isArray(entry.books) ? entry.books.length : 0
        };
      })
      .sort((left, right) => sortNaturally(left.rootFolder, right.rootFolder));
  }

  /** Merges stored metadata and playback state into raw scanned books before sending them to the renderer. */
  function getMergedBooks(libraries) {
    return libraries
      .flatMap((entry) =>
        entry.books.map((book) => {
          const playback = getPlaybackState(book.id);
          return {
            ...book,
            author: database.metadata[book.id]?.author || book.author,
            summary: database.metadata[book.id]?.summary || book.summary,
            series: database.metadata[book.id]?.series || "",
            seriesIndex: database.metadata[book.id]?.seriesIndex || "",
            publishedYear: database.metadata[book.id]?.publishedYear || "",
            genres: database.metadata[book.id]?.genres || [],
            metadataSources: database.metadata[book.id]?.sources || [],
            metadataLinks: database.metadata[book.id]?.links || {},
            metadataFetchedAt: database.metadata[book.id]?.fetchedAt || "",
            metadataStatus: database.metadata[book.id]?.status || "",
            resumePosition: playback.position,
            resumeSpeed: playback.speed,
            resumeUpdatedAt: playback.updatedAt,
            sourceLibrary: entry.rootFolder
          };
        })
      )
      .sort((left, right) => sortNaturally(left.title, right.title));
  }

  /** Resolves collection member counts and representative covers from the merged book list. */
  function getCollections(books = []) {
    const bookMap = new Map(books.map((book) => [book.id, book]));

    return database.collections
      .map((collection) => sanitizeCollectionEntry(collection))
      .map((collection) => {
        const bookIds = collection.bookIds.filter((bookId) => bookMap.has(bookId));
        const memberBooks = bookIds.map((bookId) => bookMap.get(bookId));
        return {
          ...collection,
          bookIds,
          bookCount: bookIds.length,
          cover: memberBooks[0]?.cover || null
        };
      })
      .sort((left, right) => sortNaturally(left.name, right.name));
  }

  /**
   * Builds the renderer-facing application state snapshot.
   *
   * @returns {object} Aggregated library, collection, and preference state.
   */
  function getState() {
    const libraries = getLibrariesWithAvailability();
    const books = getMergedBooks(libraries);
    const collections = getCollections(books);

    return {
      rootFolder: libraries[0]?.rootFolder || "",
      rootAvailable: libraries.length > 0 && libraries.every((entry) => entry.rootAvailable),
      rootFolders: libraries.map((entry) => entry.rootFolder),
      unavailableFolders: libraries
        .filter((entry) => !entry.rootAvailable)
        .map((entry) => entry.rootFolder),
      updatedAt: getLatestUpdatedAt(libraries),
      books,
      libraries: libraries.map((entry) => ({
        rootFolder: entry.rootFolder,
        rootAvailable: entry.rootAvailable,
        updatedAt: entry.updatedAt,
        bookCount: entry.bookCount
      })),
      collections,
      uiPreferences: sanitizeUiPreferences(database.uiPreferences)
    };
  }

  /**
   * Inserts or replaces one scanned library root in the cache.
   *
   * @param {object} library - Scan result returned by the library scanner.
   */
  function upsertLibrary(library) {
    const entry = sanitizeLibraryEntry(library);
    if (!entry.rootFolder) {
      return;
    }

    const existingIndex = database.library.libraries.findIndex(
      (candidate) => candidate.rootFolder === entry.rootFolder
    );

    if (existingIndex >= 0) {
      database.library.libraries[existingIndex] = entry;
    } else {
      database.library.libraries.push(entry);
    }

    database.library.libraries.sort((left, right) => sortNaturally(left.rootFolder, right.rootFolder));
    persistDatabase();
  }

  /** Returns the known library roots so rescans can revisit each import location. */
  function getLibraryRoots() {
    return database.library.libraries.map((entry) => entry.rootFolder).filter(Boolean);
  }

  /**
   * Creates a new collection.
   *
   * @param {object} collection - Collection fields from the renderer.
   * @returns {object} The sanitized collection entry that was stored.
   */
  function createCollection(collection) {
    const entry = sanitizeCollectionEntry(collection);
    database.collections = [
      ...database.collections.filter((candidate) => candidate.id !== entry.id),
      {
        ...entry,
        updatedAt: new Date().toISOString()
      }
    ];
    persistDatabase();
    return entry;
  }

  /**
   * Updates an existing collection in place.
   *
   * @param {string} collectionId - Collection identifier.
   * @param {object} [changes={}] - Fields to merge into the stored collection.
   * @returns {object|null} The updated collection, or null if the collection does not exist.
   */
  function updateCollection(collectionId, changes = {}) {
    if (!collectionId || typeof collectionId !== "string") {
      return null;
    }

    const existing = database.collections.find((collection) => collection.id === collectionId);
    if (!existing) {
      return null;
    }

    const nextCollection = sanitizeCollectionEntry({
      ...existing,
      ...changes,
      id: collectionId,
      updatedAt: new Date().toISOString()
    });

    database.collections = database.collections.map((collection) =>
      collection.id === collectionId ? nextCollection : collection
    );
    persistDatabase();
    return nextCollection;
  }

  /**
   * Reads the saved playback state for a book.
   *
   * @param {string} bookId - Audiobook identifier.
   * @returns {{position: number, speed: number, updatedAt: string}} Stored playback snapshot.
   */
  function getPlaybackState(bookId) {
    if (!bookId || typeof bookId !== "string") {
      return { position: 0, speed: 1, updatedAt: "" };
    }

    const stored = database.playback[bookId];
    return {
      position: Number.isFinite(stored?.position) ? stored.position : 0,
      speed: Number.isFinite(stored?.speed) ? stored.speed : 1,
      updatedAt: typeof stored?.updatedAt === "string" ? stored.updatedAt : ""
    };
  }

  /**
   * Persists the latest playback position and speed for one book.
   *
   * @param {string} bookId - Audiobook identifier.
   * @param {object} playbackState - Partial playback state from the renderer.
   */
  function updatePlaybackState(bookId, playbackState) {
    if (!bookId || typeof bookId !== "string") {
      return;
    }

    const current = getPlaybackState(bookId);
    const nextPosition = Number.isFinite(playbackState?.position)
      ? Math.max(0, playbackState.position)
      : current.position;
    const nextSpeed = Number.isFinite(playbackState?.speed)
      ? Math.min(2, Math.max(0.75, playbackState.speed))
      : current.speed;

    database.playback[bookId] = {
      position: nextPosition,
      speed: nextSpeed,
      updatedAt: new Date().toISOString()
    };

    persistDatabase();
  }

  /**
   * Removes saved playback progress for a book.
   *
   * @param {string} bookId - Audiobook identifier.
   */
  function clearPlaybackState(bookId) {
    if (!bookId || typeof bookId !== "string") {
      return;
    }

    if (!(bookId in database.playback)) {
      return;
    }

    delete database.playback[bookId];
    persistDatabase();
  }

  /**
   * Upserts metadata for one book.
   *
   * @param {string} bookId - Audiobook identifier.
   * @param {object} metadata - Provider metadata payload.
   * @returns {object|null} Sanitized metadata entry or null when the id is invalid.
   */
  function updateBookMetadata(bookId, metadata) {
    if (!bookId || typeof bookId !== "string") {
      return null;
    }

    database.metadata[bookId] = sanitizeMetadataEntry({
      ...database.metadata[bookId],
      ...metadata
    });
    persistDatabase();
    return database.metadata[bookId];
  }

  /**
   * Upserts metadata for multiple books in one write.
   *
   * @param {Array<{bookId: string, metadata: object}>} entries - Metadata updates keyed by book id.
   */
  function updateManyBookMetadata(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return;
    }

    for (const entry of entries) {
      if (!entry || typeof entry.bookId !== "string" || !entry.bookId) {
        continue;
      }

      database.metadata[entry.bookId] = sanitizeMetadataEntry({
        ...database.metadata[entry.bookId],
        ...entry.metadata
      });
    }

    persistDatabase();
  }

  /**
   * Persists UI preference changes.
   *
   * @param {object} [changes={}] - Partial UI preference payload from the renderer.
   * @returns {object} The sanitized preference state after the update.
   */
  function updateUiPreferences(changes = {}) {
    database.uiPreferences = sanitizeUiPreferences({
      ...database.uiPreferences,
      ...changes
    });
    persistDatabase();
    return database.uiPreferences;
  }

  return {
    getAssetPaths() {
      return { coversDir };
    },
    getState,
    upsertLibrary,
    getLibraryRoots,
    createCollection,
    updateCollection,
    updateBookMetadata,
    updateManyBookMetadata,
    getPlaybackState,
    updatePlaybackState,
    clearPlaybackState,
    updateUiPreferences
  };
}

module.exports = {
  createLibraryStore
};
