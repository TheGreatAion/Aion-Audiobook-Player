// src/main/library-scanner.js scans audiobook folders, reads metadata, and prepares cached cover art.
const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { parseFile } = require("music-metadata");

const SUPPORTED_EXTENSIONS = new Set([".m4b", ".mp3"]);
const DIRECTORY_COVER_NAMES = [
  "cover.jpg",
  "cover.jpeg",
  "cover.png",
  "folder.jpg",
  "folder.jpeg",
  "folder.png"
];
const CUE_TIMESTAMP_FRAMES_PER_SECOND = 75;

/** Keeps file and book ordering stable in a human-friendly way across scans. */
function naturalSort(a, b) {
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

/** Builds deterministic book ids from stable import keys so rescans preserve playback and collections. */
function createBookId(key) {
  return crypto.createHash("sha1").update(key).digest("hex").slice(0, 16);
}

/** Normalizes optional metadata values into safe strings. */
function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** Falls back to the file name when embedded metadata is incomplete. */
function stripExtension(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

/** Rejects missing or invalid duration values from parser results. */
function safeDuration(value) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Formats runtime summaries for fallback descriptions and collection details. */
function formatDurationForSummary(totalSeconds) {
  const safeSeconds = Math.max(0, Math.round(totalSeconds || 0));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours} hr ${minutes} min`;
  }

  if (hours > 0) {
    return `${hours} hr`;
  }

  return `${Math.max(1, minutes)} min`;
}

/** Escapes dynamic text before embedding it in generated placeholder SVG markup. */
function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

/**
 * Generates a lightweight cover when no embedded or folder artwork is available.
 *
 * @param {string} title - Book title used in the fallback artwork.
 * @param {string} author - Author name shown on the placeholder.
 * @returns {string} A data URL containing SVG cover art.
 */
function buildPlaceholderCover(title, author) {
  const initials = title
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "AB";

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" role="img" aria-label="${title}">
      <rect width="640" height="640" rx="52" fill="#050505" />
      <circle cx="520" cy="124" r="138" fill="rgba(255,255,255,0.08)" />
      <circle cx="98" cy="560" r="210" fill="rgba(255,255,255,0.05)" />
      <rect x="72" y="88" width="112" height="8" rx="4" fill="rgba(255,255,255,0.7)" />
      <text x="70" y="350" fill="white" font-family="Segoe UI Variable, Bahnschrift, sans-serif" font-size="168" font-weight="700">${initials}</text>
      <text x="70" y="460" fill="rgba(255,255,255,0.84)" font-family="Segoe UI Variable, Bahnschrift, sans-serif" font-size="42">${escapeXml(title.slice(0, 26))}</text>
      <text x="70" y="520" fill="rgba(255,255,255,0.56)" font-family="Segoe UI Variable, Bahnschrift, sans-serif" font-size="26">${escapeXml(author || "Unknown Author")}</text>
    </svg>
  `.trim();

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

/** Reads the different value shapes returned by music-metadata tag parsers. */
function valueToString(tagValue) {
  if (typeof tagValue === "string") {
    return sanitizeText(tagValue);
  }

  if (Array.isArray(tagValue)) {
    return tagValue.map(valueToString).filter(Boolean).join(", ");
  }

  if (tagValue && typeof tagValue === "object") {
    if (typeof tagValue.text === "string") {
      return sanitizeText(tagValue.text);
    }

    if (typeof tagValue.value === "string") {
      return sanitizeText(tagValue.value);
    }
  }

  return "";
}

/** Prefers album-style author tags because audiobook files often store series-wide author data there. */
function pickAuthor(metadata) {
  return (
    sanitizeText(metadata?.common?.albumartist) ||
    sanitizeText(metadata?.common?.artist) ||
    sanitizeText(metadata?.common?.albumartists?.[0]) ||
    sanitizeText(metadata?.common?.artists?.[0]) ||
    ""
  );
}

/** Searches native tags for narrator-style fields that are not standardized across formats. */
function pickNarrator(metadata) {
  if (!metadata?.native || typeof metadata.native !== "object") {
    return "";
  }

  for (const tagGroup of Object.values(metadata.native)) {
    for (const tag of tagGroup) {
      const id = sanitizeText(tag?.id).toLowerCase();
      if (!id || (!id.includes("narrator") && !id.includes("reader") && !id.includes("read by"))) {
        continue;
      }

      const value = valueToString(tag.value);
      if (value) {
        return value;
      }
    }
  }

  return "";
}

/** Extracts the first useful summary-like tag across common and native metadata fields. */
function pickSummary(metadata) {
  const commonSummary = metadata?.common?.description || metadata?.common?.comment?.[0];
  if (typeof commonSummary === "string" && commonSummary.trim()) {
    return commonSummary.trim();
  }

  if (!metadata?.native || typeof metadata.native !== "object") {
    return "";
  }

  for (const tagGroup of Object.values(metadata.native)) {
    for (const tag of tagGroup) {
      const id = sanitizeText(tag?.id).toLowerCase();
      if (
        !id ||
        (!id.includes("summary") &&
          !id.includes("description") &&
          !id.includes("synopsis") &&
          !id.includes("comment"))
      ) {
        continue;
      }

      const value = valueToString(tag.value);
      if (value) {
        return value;
      }
    }
  }

  return "";
}

/**
 * Builds a readable summary when imported files do not contain one.
 *
 * @param {object} options - Fallback summary inputs.
 * @param {string} options.title - Book title.
 * @param {string} options.author - Book author.
 * @param {string} options.narrator - Book narrator.
 * @param {number} options.duration - Total runtime in seconds.
 * @param {number} options.sectionCount - Number of file sections in the import.
 * @returns {string} A concise summary suitable for the library cache.
 */
function buildFallbackSummary({ title, author, narrator, duration, sectionCount }) {
  const pieces = [];
  if (title && author) {
    pieces.push(`${title} by ${author}.`);
  } else if (title) {
    pieces.push(`${title}.`);
  }

  if (sectionCount > 1) {
    pieces.push(`Imported as ${sectionCount} parts.`);
  }

  pieces.push(`Runtime ${formatDurationForSummary(duration)}.`);

  if (narrator) {
    pieces.push(`Narrated by ${narrator}.`);
  }

  return pieces.join(" ").trim();
}

/** Parses cue timestamps that may use either CD frames or centiseconds for the final field. */
function cueTimestampToSeconds(timestamp, treatLastFieldAsCentiseconds) {
  const parts = sanitizeText(timestamp).split(":");
  if (parts.length !== 3) {
    return null;
  }

  const minutes = Number(parts[0]);
  const seconds = Number(parts[1]);
  const fraction = Number(parts[2]);
  if (![minutes, seconds, fraction].every(Number.isFinite)) {
    return null;
  }

  return minutes * 60 + seconds + (treatLastFieldAsCentiseconds ? fraction / 100 : fraction / CUE_TIMESTAMP_FRAMES_PER_SECOND);
}

/** Chooses the cue timestamp mode that fits the actual file duration best. */
function shouldTreatCueFractionsAsCentiseconds(timestamps, fallbackDuration) {
  if (!Array.isArray(timestamps) || timestamps.length === 0 || !Number.isFinite(fallbackDuration) || fallbackDuration <= 0) {
    return false;
  }

  const scoreMode = (treatLastFieldAsCentiseconds) => {
    const starts = timestamps
      .map((timestamp) => cueTimestampToSeconds(timestamp, treatLastFieldAsCentiseconds))
      .filter(Number.isFinite);
    const overflowCount = starts.filter((start) => start > fallbackDuration + 1).length;
    const lastStart = starts[starts.length - 1] ?? 0;
    const overshoot = Math.max(0, lastStart - fallbackDuration);
    const trailingGap = lastStart <= fallbackDuration ? fallbackDuration - lastStart : Number.POSITIVE_INFINITY;

    return {
      overflowCount,
      overshoot,
      trailingGap
    };
  };

  const framesScore = scoreMode(false);
  const centisecondsScore = scoreMode(true);

  if (centisecondsScore.overflowCount !== framesScore.overflowCount) {
    return centisecondsScore.overflowCount < framesScore.overflowCount;
  }

  if (centisecondsScore.overshoot !== framesScore.overshoot) {
    return centisecondsScore.overshoot < framesScore.overshoot;
  }

  return centisecondsScore.trailingGap < framesScore.trailingGap;
}

/** Parses a sidecar cue sheet into chapter markers for single-file audiobooks that lack embedded chapters. */
async function parseCueChapters(audioFilePath, fallbackDuration, fallbackTitle) {
  const cuePath = path.join(
    path.dirname(audioFilePath),
    `${path.basename(audioFilePath, path.extname(audioFilePath))}.cue`
  );

  let cueContents = "";
  try {
    cueContents = await fs.readFile(cuePath, "utf8");
  } catch {
    return [];
  }

  const lines = cueContents.split(/\r?\n/);
  const rawTracks = [];
  let currentTrack = null;

  for (const line of lines) {
    const trimmedLine = line.trim();

    if (/^TRACK\s+\d+\s+AUDIO$/i.test(trimmedLine)) {
      currentTrack = {
        title: "",
        startTimestamp: ""
      };
      rawTracks.push(currentTrack);
      continue;
    }

    if (!currentTrack) {
      continue;
    }

    const titleMatch = trimmedLine.match(/^TITLE\s+"(.+)"$/i);
    if (titleMatch) {
      currentTrack.title = sanitizeText(titleMatch[1]);
      continue;
    }

    const indexMatch = trimmedLine.match(/^INDEX\s+01\s+(\d+:\d+:\d+)$/i);
    if (!indexMatch) {
      continue;
    }

    currentTrack.startTimestamp = indexMatch[1];
  }

  const usesCentiseconds = shouldTreatCueFractionsAsCentiseconds(
    rawTracks.map((track) => track.startTimestamp).filter(Boolean),
    fallbackDuration
  );

  return trimDegenerateTrailingChapters(
    rawTracks.map((track, index, allTracks) => {
      const rawStart = cueTimestampToSeconds(track.startTimestamp, usesCentiseconds);
      const nextStart =
        index < allTracks.length - 1
          ? cueTimestampToSeconds(allTracks[index + 1].startTimestamp, usesCentiseconds)
          : fallbackDuration;
      const start = Math.min(Math.max(0, rawStart || 0), fallbackDuration || rawStart || 0);
      const end = Math.min(
        Math.max(start, nextStart || fallbackDuration || start),
        fallbackDuration || Math.max(start, nextStart || start)
      );

      return {
        id: `${fallbackTitle}-cue-chapter-${index}`,
        title: track.title || `Chapter ${index + 1}`,
        start: Number.isFinite(start) ? start : -1,
        end
      };
    })
    .filter((chapter) => Number.isFinite(chapter.start) && chapter.start >= 0 && Number.isFinite(chapter.end))
  );
}

/**
 * Normalizes chapter data and synthesizes a single chapter when source files have none.
 *
 * @param {Array<object>} rawChapters - Chapters returned by music-metadata.
 * @param {number} fallbackDuration - Section duration used to close the final chapter.
 * @param {string} fallbackTitle - Title used when a chapter name is missing.
 * @returns {Array<object>} Chapter list with consistent ids, titles, starts, and ends.
 */
function normalizeChapters(rawChapters, fallbackDuration, fallbackTitle) {
  if (!Array.isArray(rawChapters) || rawChapters.length === 0) {
    return fallbackDuration > 0
      ? [
          {
            id: `${fallbackTitle}-chapter-0`,
            title: fallbackTitle,
            start: 0,
            end: fallbackDuration
          }
        ]
      : [];
  }

  return rawChapters
    .map((chapter, index, allChapters) => {
      const timeScale = Number.isFinite(chapter?.timeScale) && chapter.timeScale > 0 ? chapter.timeScale : 1;
      const start = Math.max(0, Number(chapter?.start || 0) / timeScale);
      const endFromTag =
        Number.isFinite(chapter?.end) && chapter.end > 0 ? Number(chapter.end) / timeScale : undefined;
      const nextStart =
        index < allChapters.length - 1
          ? Math.max(0, Number(allChapters[index + 1]?.start || 0) / timeScale)
          : fallbackDuration;
      const end = Math.max(start, endFromTag || nextStart || fallbackDuration || start);

      return {
        id: sanitizeText(chapter?.id) || `${fallbackTitle}-chapter-${index}`,
        title: sanitizeText(chapter?.title) || `Chapter ${index + 1}`,
        start,
        end
      };
    })
    .filter((chapter) => Number.isFinite(chapter.start) && Number.isFinite(chapter.end));
}

/** Drops terminal chapter markers that collapse to effectively zero duration after normalization. */
function trimDegenerateTrailingChapters(chapters) {
  if (!Array.isArray(chapters) || chapters.length <= 1) {
    return Array.isArray(chapters) ? chapters : [];
  }

  const normalizedChapters = [...chapters];
  while (
    normalizedChapters.length > 1 &&
    normalizedChapters[normalizedChapters.length - 1].end - normalizedChapters[normalizedChapters.length - 1].start <= 1
  ) {
    normalizedChapters.pop();
  }

  return normalizedChapters;
}

/** Chooses the best chapter source for single-file audiobooks, preferring cue sheets when embedded markers are missing or collapsed. */
async function resolveSingleFileChapters(sourceFile, embeddedChapters, fallbackDuration, fallbackTitle) {
  const normalizedEmbeddedChapters = normalizeChapters(embeddedChapters, fallbackDuration, fallbackTitle);
  const cueChapters = await parseCueChapters(sourceFile, fallbackDuration, fallbackTitle);

  if (cueChapters.length > 1 && normalizedEmbeddedChapters.length <= 1) {
    return cueChapters;
  }

  if (cueChapters.length > normalizedEmbeddedChapters.length && normalizedEmbeddedChapters.length <= 2) {
    return cueChapters;
  }

  return normalizedEmbeddedChapters;
}

/**
 * Parses an audio file without failing the entire scan when one file is malformed.
 *
 * @param {string} filePath - Absolute path to the audio file.
 * @param {object} [options={}] - Additional music-metadata parse options.
 * @returns {Promise<object|null>} Parsed metadata or null if parsing fails.
 */
async function safeParseFile(filePath, options = {}) {
  try {
    return await parseFile(filePath, {
      duration: true,
      includeChapters: true,
      ...options
    });
  } catch {
    return null;
  }
}

/** Looks for conventional folder artwork before falling back to embedded cover extraction. */
async function findDirectoryCover(directoryPath) {
  for (const coverName of DIRECTORY_COVER_NAMES) {
    const candidate = path.join(directoryPath, coverName);

    try {
      const stats = await fs.stat(candidate);
      if (stats.isFile()) {
        return candidate;
      }
    } catch {
      // Ignore missing files and continue looking for supported names.
    }
  }

  return "";
}

/** Maps embedded artwork MIME types to stable file extensions for the cached cover folder. */
function mimeToExtension(mimeType) {
  const value = sanitizeText(mimeType).toLowerCase();

  if (value.includes("png")) {
    return ".png";
  }

  if (value.includes("webp")) {
    return ".webp";
  }

  return ".jpg";
}

/**
 * Resolves artwork for a scanned book.
 *
 * Folder artwork wins over embedded artwork so users can override bad embedded covers without editing files.
 *
 * @param {object} options - Cover resolution inputs.
 * @returns {Promise<{src: string, kind: string}>} Resolved cover source and provenance.
 */
async function resolveCover({ bookId, title, author, directoryPath, metadata, coversDir }) {
  const directoryCover = await findDirectoryCover(directoryPath);
  if (directoryCover) {
    return {
      src: pathToFileURL(directoryCover).href,
      kind: "file"
    };
  }

  const embeddedCover = metadata?.common?.picture?.[0];
  if (embeddedCover?.data?.length) {
    const extension = mimeToExtension(embeddedCover.format);
    const coverPath = path.join(coversDir, `${bookId}${extension}`);

    await fs.mkdir(coversDir, { recursive: true });
    await fs.writeFile(coverPath, Buffer.from(embeddedCover.data));

    return {
      src: pathToFileURL(coverPath).href,
      kind: "embedded"
    };
  }

  return {
    src: buildPlaceholderCover(title, author),
    kind: "placeholder"
  };
}

/**
 * Recursively collects supported audiobook files from a library root.
 *
 * @param {string} rootFolder - Root folder selected by the user.
 * @returns {Promise<string[]>} Supported audio file paths sorted for stable imports.
 */
async function walkAudioFiles(rootFolder) {
  const stack = [rootFolder];
  const files = [];

  while (stack.length > 0) {
    const currentDirectory = stack.pop();
    let entries = [];

    try {
      entries = await fs.readdir(currentDirectory, { withFileTypes: true });
    } catch {
      continue;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDirectory, entry.name);

      if (entry.isDirectory()) {
        stack.push(fullPath);
        continue;
      }

      if (!entry.isFile()) {
        continue;
      }

      const extension = path.extname(entry.name).toLowerCase();
      if (SUPPORTED_EXTENSIONS.has(extension)) {
        files.push(fullPath);
      }
    }
  }

  return files.sort(naturalSort);
}

/**
 * Groups raw files into import candidates.
 *
 * Multi-file MP3 and M4B folders are collapsed intentionally so the UI treats them as one audiobook with
 * sections and chapters instead of flooding the library with near-duplicate entries.
 *
 * @param {string[]} files - Supported audio file paths discovered under the library root.
 * @returns {Array<object>} Candidate import groups.
 */
function buildImportCandidates(files) {
  const candidates = [];
  const consumed = new Set();
  const mp3ByDirectory = new Map();
  const m4bByDirectory = new Map();

  for (const filePath of files) {
    const extension = path.extname(filePath).toLowerCase();
    const directoryPath = path.dirname(filePath);

    if (extension === ".mp3") {
      if (!mp3ByDirectory.has(directoryPath)) {
        mp3ByDirectory.set(directoryPath, []);
      }

      mp3ByDirectory.get(directoryPath).push(filePath);
      continue;
    }

    if (extension === ".m4b") {
      if (!m4bByDirectory.has(directoryPath)) {
        m4bByDirectory.set(directoryPath, []);
      }

      m4bByDirectory.get(directoryPath).push(filePath);
    }
  }

  for (const [directoryPath, mp3Files] of mp3ByDirectory.entries()) {
    if (mp3Files.length <= 1) {
      continue;
    }

    const sortedFiles = [...mp3Files].sort(naturalSort);
    for (const filePath of sortedFiles) {
      consumed.add(filePath);
    }

    candidates.push({
      type: "mp3-folder",
      sourceKey: directoryPath,
      directoryPath,
      files: sortedFiles
    });
  }

  for (const [directoryPath, m4bFiles] of m4bByDirectory.entries()) {
    if (m4bFiles.length <= 1) {
      continue;
    }

    const sortedFiles = [...m4bFiles].sort(naturalSort);
    for (const filePath of sortedFiles) {
      consumed.add(filePath);
    }

    candidates.push({
      type: "m4b-folder",
      sourceKey: directoryPath,
      directoryPath,
      files: sortedFiles
    });
  }

  for (const filePath of files) {
    if (consumed.has(filePath)) {
      continue;
    }

    const extension = path.extname(filePath).toLowerCase();
    candidates.push({
      type: extension === ".m4b" ? "m4b" : "single-file",
      sourceKey: filePath,
      directoryPath: path.dirname(filePath),
      files: [filePath]
    });
  }

  return candidates.sort((left, right) => naturalSort(left.sourceKey, right.sourceKey));
}

/**
 * Builds one audiobook record from a multi-part folder import.
 *
 * @param {object} candidate - Grouped import candidate for a multi-file book.
 * @param {string} rootFolder - Library root used to compute display paths.
 * @param {string} coversDir - Cache directory for extracted artwork.
 * @returns {Promise<object>} Normalized audiobook record.
 */
async function createMultiSectionBook(candidate, rootFolder, coversDir) {
  const bookId = createBookId(candidate.sourceKey);
  const sections = [];
  let firstMetadata = null;
  let totalDuration = 0;

  for (let index = 0; index < candidate.files.length; index += 1) {
    const filePath = candidate.files[index];
    const metadata = await safeParseFile(filePath, {
      skipCovers: index > 0
    });

    if (!firstMetadata) {
      firstMetadata = metadata;
    }

    const duration = safeDuration(metadata?.format?.duration);
    const title = sanitizeText(metadata?.common?.title) || stripExtension(filePath);
    const start = totalDuration;
    totalDuration += duration;

    sections.push({
      id: `${bookId}-section-${index}`,
      title,
      start,
      end: totalDuration,
      duration,
      src: pathToFileURL(filePath).href
    });
  }

  const title =
    sanitizeText(firstMetadata?.common?.album) ||
    sanitizeText(firstMetadata?.common?.title) ||
    path.basename(candidate.directoryPath);
  const author = pickAuthor(firstMetadata);
  const narrator = pickNarrator(firstMetadata);
  const summary =
    pickSummary(firstMetadata) ||
    buildFallbackSummary({
      title,
      author,
      narrator,
      duration: totalDuration,
      sectionCount: sections.length
    });
  const cover = await resolveCover({
    bookId,
    title,
    author,
    directoryPath: candidate.directoryPath,
    metadata: firstMetadata,
    coversDir
  });

  return {
    id: bookId,
    sourceType: candidate.type,
    title,
    author,
    narrator,
    summary,
    duration: totalDuration,
    cover,
    locationLabel: path.relative(rootFolder, candidate.directoryPath) || path.basename(candidate.directoryPath),
    sections,
    chapters: sections.map((section) => ({
      id: section.id,
      title: section.title,
      start: section.start,
      end: section.end
    }))
  };
}

/**
 * Builds one audiobook record from a single-file import.
 *
 * @param {object} candidate - Candidate containing a single audio file.
 * @param {string} rootFolder - Library root used to compute display paths.
 * @param {string} coversDir - Cache directory for extracted artwork.
 * @returns {Promise<object>} Normalized audiobook record.
 */
async function createSingleAssetBook(candidate, rootFolder, coversDir) {
  const sourceFile = candidate.files[0];
  const bookId = createBookId(candidate.sourceKey);
  const metadata = await safeParseFile(sourceFile);
  const extension = path.extname(sourceFile).toLowerCase();
  const duration = safeDuration(metadata?.format?.duration);
  const fallbackTitle = stripExtension(sourceFile);
  const title =
    sanitizeText(metadata?.common?.album) ||
    sanitizeText(metadata?.common?.title) ||
    fallbackTitle;
  const author = pickAuthor(metadata);
  const narrator = pickNarrator(metadata);
  const summary =
    pickSummary(metadata) ||
    buildFallbackSummary({
      title,
      author,
      narrator,
      duration,
      sectionCount: 1
    });
  const cover = await resolveCover({
    bookId,
    title,
    author,
    directoryPath: candidate.directoryPath,
    metadata,
    coversDir
  });
  const sections = [
    {
      id: `${bookId}-section-0`,
      title,
      start: 0,
      end: duration,
      duration,
      src: pathToFileURL(sourceFile).href
    }
  ];

  const chapters =
    extension === ".m4b"
      ? await resolveSingleFileChapters(sourceFile, metadata?.format?.chapters, duration, title)
      : normalizeChapters([], duration, title);

  return {
    id: bookId,
    sourceType: extension === ".m4b" ? "m4b" : "single-file",
    title,
    author,
    narrator,
    summary,
    duration,
    cover,
    locationLabel: path.relative(rootFolder, sourceFile) || path.basename(sourceFile),
    sections,
    chapters
  };
}

/**
 * Dispatches candidate processing to the matching import strategy.
 *
 * @param {object} candidate - Import candidate returned by buildImportCandidates.
 * @param {string} rootFolder - Library root used to compute display paths.
 * @param {string} coversDir - Cache directory for extracted artwork.
 * @returns {Promise<object>} Normalized audiobook record.
 */
async function createBook(candidate, rootFolder, coversDir) {
  if (candidate.type === "mp3-folder" || candidate.type === "m4b-folder") {
    return createMultiSectionBook(candidate, rootFolder, coversDir);
  }

  return createSingleAssetBook(candidate, rootFolder, coversDir);
}

/**
 * Scans a library root and returns normalized audiobook data ready for caching.
 *
 * @param {string} rootFolder - Absolute library folder selected by the user.
 * @param {{ coversDir: string }} options - Paths used for extracted cover caching.
 * @returns {Promise<object>} Library payload containing the root, timestamp, and scanned books.
 */
async function scanLibrary(rootFolder, { coversDir }) {
  const files = await walkAudioFiles(rootFolder);
  const candidates = buildImportCandidates(files);
  const books = [];

  for (const candidate of candidates) {
    const book = await createBook(candidate, rootFolder, coversDir);
    if (!book?.title) {
      continue;
    }

    books.push(book);
  }

  books.sort((left, right) => naturalSort(left.title, right.title));

  return {
    rootFolder,
    updatedAt: new Date().toISOString(),
    books
  };
}

module.exports = {
  scanLibrary
};
