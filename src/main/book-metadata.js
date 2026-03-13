// src/main/book-metadata.js looks up extra book metadata from external providers and normalizes the results.
const OPEN_LIBRARY_BASE_URL = "https://openlibrary.org";
const ITUNES_SEARCH_URL = "https://itunes.apple.com/search";
const REQUEST_TIMEOUT_MS = 9000;
const USER_AGENT = "AionAudiobookPlayer/1.0";

/** Normalizes optional text inputs so downstream matching logic only handles clean strings. */
function sanitizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/** Removes edition-style parenthetical text because provider titles often include noisy suffixes. */
function stripParenthetical(value) {
  return sanitizeText(value).replace(/\s*[\(\[].*?[\)\]]/g, " ").replace(/\s+/g, " ").trim();
}

/** Converts titles and author names into a comparable search key for fuzzy matching. */
function normalizeForMatch(value) {
  return stripParenthetical(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(audiobook|audio|edition|unabridged|abridged|full cast|full-cast|library edition)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Breaks a normalized string into tokens so partial title and author overlap can be scored. */
function tokenize(value) {
  return normalizeForMatch(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

/** Computes a simple overlap ratio that favors shared distinctive words over raw string similarity. */
function getTokenOverlapScore(left, right) {
  const leftTokens = new Set(tokenize(left));
  const rightTokens = new Set(tokenize(right));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let overlap = 0;
  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  }

  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

/**
 * Scores how well a provider candidate matches a scanned audiobook.
 *
 * @param {object} book - The locally scanned audiobook record.
 * @param {string} candidateTitle - Title returned by a metadata provider.
 * @param {string} candidateAuthor - Author returned by a metadata provider.
 * @returns {number} A higher score for better title and author alignment.
 */
function scoreCandidate(book, candidateTitle, candidateAuthor) {
  const bookTitle = normalizeForMatch(book?.title);
  const bookAuthor = normalizeForMatch(book?.author);
  const title = normalizeForMatch(candidateTitle);
  const author = normalizeForMatch(candidateAuthor);

  if (!bookTitle || !title) {
    return 0;
  }

  let score = 0;

  if (title === bookTitle) {
    score += 8;
  } else if (title.includes(bookTitle) || bookTitle.includes(title)) {
    score += 6;
  } else {
    score += getTokenOverlapScore(bookTitle, title) * 5;
  }

  if (bookAuthor && author) {
    if (author === bookAuthor) {
      score += 5;
    } else if (author.includes(bookAuthor) || bookAuthor.includes(author)) {
      score += 3.5;
    } else {
      score += getTokenOverlapScore(bookAuthor, author) * 3;
    }
  }

  return score;
}

/** Deduplicates provider values while preserving only meaningful non-empty strings. */
function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(sanitizeText).filter(Boolean))];
}

/** Strips lightweight HTML because provider summaries frequently arrive as rich text snippets. */
function stripHtml(value) {
  return sanitizeText(value)
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\s+\n/g, "\n")
    .replace(/\n\s+/g, "\n")
    .trim();
}

/** Normalizes the different description shapes used by the supported metadata providers. */
function normalizeDescription(value) {
  if (typeof value === "string") {
    return stripHtml(value);
  }

  if (value && typeof value === "object") {
    if (typeof value.value === "string") {
      return stripHtml(value.value);
    }

    if (typeof value.text === "string") {
      return stripHtml(value.text);
    }
  }

  return "";
}

/**
 * Fetches JSON with a timeout so provider lookups fail fast instead of blocking the scan flow.
 *
 * @param {string} url - Provider endpoint URL.
 * @returns {Promise<any>} Parsed JSON response body.
 */
async function fetchJson(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "application/json"
      },
      signal: controller.signal
    });

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Searches Open Library for the closest matching work.
 *
 * Open Library is queried first because it tends to have stronger series and subject data, which are
 * especially useful for collections and richer player metadata.
 *
 * @param {object} book - The locally scanned audiobook record.
 * @returns {Promise<object|null>} Normalized provider metadata or null when no confident match is found.
 */
async function searchOpenLibrary(book) {
  const title = stripParenthetical(book?.title);
  if (!title) {
    return null;
  }

  const params = new URLSearchParams({
    title,
    limit: "8"
  });

  if (sanitizeText(book?.author)) {
    params.set("author", stripParenthetical(book.author));
  }

  const data = await fetchJson(`${OPEN_LIBRARY_BASE_URL}/search.json?${params.toString()}`);
  const docs = Array.isArray(data?.docs) ? data.docs : [];

  let bestMatch = null;
  for (const doc of docs) {
    const candidate = {
      title: sanitizeText(doc?.title),
      author: Array.isArray(doc?.author_name) ? doc.author_name.join(", ") : "",
      key: sanitizeText(doc?.key),
      series: Array.isArray(doc?.series_name) ? doc.series_name[0] : "",
      seriesIndex: Array.isArray(doc?.series_position) ? doc.series_position[0] : "",
      publishedYear: Number.isFinite(doc?.first_publish_year) ? doc.first_publish_year : "",
      coverId: doc?.cover_i,
      score: scoreCandidate(book, doc?.title, Array.isArray(doc?.author_name) ? doc.author_name[0] : "")
    };

    if (!bestMatch || candidate.score > bestMatch.score) {
      bestMatch = candidate;
    }
  }

  if (!bestMatch || bestMatch.score < 5.5 || !bestMatch.key) {
    return null;
  }

  let work = null;
  try {
    work = await fetchJson(`${OPEN_LIBRARY_BASE_URL}${bestMatch.key}.json`);
  } catch {
    work = null;
  }

  return {
    provider: "Open Library",
    title: bestMatch.title,
    author: bestMatch.author,
    summary: normalizeDescription(work?.description),
    series: bestMatch.series,
    seriesIndex: sanitizeText(bestMatch.seriesIndex),
    publishedYear: bestMatch.publishedYear || "",
    genres: uniqueStrings(Array.isArray(work?.subjects) ? work.subjects.slice(0, 6) : []),
    links: {
      openLibrary: `${OPEN_LIBRARY_BASE_URL}${bestMatch.key}`
    },
    score: bestMatch.score
  };
}

/**
 * Searches Apple audiobook results for a commercially curated fallback match.
 *
 * Apple is treated as a secondary source because it often has better summaries while Open Library tends
 * to be stronger for bibliographic structure.
 *
 * @param {object} book - The locally scanned audiobook record.
 * @returns {Promise<object|null>} Normalized provider metadata or null when no confident match is found.
 */
async function searchAppleAudiobooks(book) {
  const query = [stripParenthetical(book?.title), stripParenthetical(book?.author)].filter(Boolean).join(" ");
  if (!query) {
    return null;
  }

  const params = new URLSearchParams({
    media: "audiobook",
    country: "US",
    limit: "6",
    term: query
  });

  const data = await fetchJson(`${ITUNES_SEARCH_URL}?${params.toString()}`);
  const results = Array.isArray(data?.results) ? data.results : [];

  let bestMatch = null;
  for (const result of results) {
    const score = scoreCandidate(book, result?.collectionName, result?.artistName);
    if (!bestMatch || score > bestMatch.score) {
      bestMatch = {
        result,
        score
      };
    }
  }

  if (!bestMatch || bestMatch.score < 6.5) {
    return null;
  }

  const result = bestMatch.result;
  const releaseDate = sanitizeText(result?.releaseDate);
  const publishedYear = releaseDate ? new Date(releaseDate).getUTCFullYear() : "";

  return {
    provider: "Apple Books",
    title: sanitizeText(result?.collectionName),
    author: sanitizeText(result?.artistName),
    summary: stripHtml(result?.description),
    publishedYear: Number.isFinite(publishedYear) ? publishedYear : "",
    genres: uniqueStrings([sanitizeText(result?.primaryGenreName)]),
    links: {
      appleBooks: sanitizeText(result?.collectionViewUrl)
    },
    score: bestMatch.score
  };
}

/**
 * Enriches a scanned book by combining the best data from the supported providers.
 *
 * @param {object} book - The locally scanned audiobook record.
 * @returns {Promise<object>} Normalized metadata payload persisted by the library store.
 */
async function enrichBookMetadata(book) {
  const [openLibrary, appleBooks] = await Promise.allSettled([
    searchOpenLibrary(book),
    searchAppleAudiobooks(book)
  ]);

  const openLibraryData = openLibrary.status === "fulfilled" ? openLibrary.value : null;
  const appleBooksData = appleBooks.status === "fulfilled" ? appleBooks.value : null;
  const sources = [openLibraryData?.provider, appleBooksData?.provider].filter(Boolean);

  return {
    status: sources.length > 0 ? "matched" : "not_found",
    fetchedAt: new Date().toISOString(),
    author: sanitizeText(book?.author) || appleBooksData?.author || openLibraryData?.author || "",
    summary: appleBooksData?.summary || openLibraryData?.summary || "",
    series: openLibraryData?.series || "",
    seriesIndex: openLibraryData?.seriesIndex || "",
    publishedYear: appleBooksData?.publishedYear || openLibraryData?.publishedYear || "",
    genres: uniqueStrings([...(appleBooksData?.genres || []), ...(openLibraryData?.genres || [])]),
    links: {
      ...(openLibraryData?.links || {}),
      ...(appleBooksData?.links || {})
    },
    sources
  };
}

module.exports = {
  enrichBookMetadata
};
