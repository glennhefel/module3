import axios from "axios";
import Media from "./models/media.model.js";
import scrapeEmitter from './utils/scrapeEvents.js';

function normalizeText(value = '') {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function escapeRegex(value = '') {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function sleep(ms = 0) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrapeAnimeById(animeId, runId = '') {
  try {
    // Try fetching with retries/backoff on 429
    const maxAttempts = 5;
    let attempt = 0;
    let anime = null;
    while (attempt < maxAttempts) {
      try {
        const { data } = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
        anime = data.data;
        break;
      } catch (err) {
        const status = err?.response?.status;
        const retryAfter = err?.response?.headers?.['retry-after'] || err?.response?.headers?.['Retry-After'];
        if (status === 429) {
          const waitSec = retryAfter ? Number(retryAfter) : Math.min(60, 2 ** attempt);
          console.warn(`Rate limited by Jikan API for animeId=${animeId}, attempt=${attempt + 1}, waiting ${waitSec}s`);
          await sleep(waitSec * 1000);
          attempt += 1;
          continue;
        }
        // other errors are not retriable here
        throw err;
      }
    }

    if (!anime) {
      throw new Error('Failed to fetch anime after retries (rate limited)');
    }

    const title = anime.title || "Unknown";
    const release_date = anime.aired?.from ? new Date(anime.aired.from) : new Date("2000-01-01");
    const media = "Anime";
    let genre = anime.genres?.[0]?.name || "Action";
    const director = "Unknown";
    let description = anime.synopsis || "";
    const poster = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "";

    const exactTitleMatch = await Media.findOne({
      media,
      title: { $regex: `^${escapeRegex(title)}$`, $options: 'i' },
    }).lean();

    const normalizedTitle = normalizeText(title);
    const fallbackExisting = exactTitleMatch
      ? exactTitleMatch
      : await Media.find({ media, title: { $regex: escapeRegex(title), $options: 'i' } })
          .select('title')
          .lean();

    const titleAlreadyExists = Array.isArray(fallbackExisting)
      ? fallbackExisting.some((item) => normalizeText(item.title) === normalizedTitle)
      : Boolean(fallbackExisting);

    const existingMedia = await Media.findOne({
      $or: [
        { scrapeSource: 'jikan_top_anime', scrapeExternalId: String(animeId) },
      ],
    });
    if (existingMedia || titleAlreadyExists) {
      const msg = { runId: String(runId || ''), type: 'skipped', animeId, title };
      try { scrapeEmitter.emit('log', msg); } catch (e) {}
      console.log(`Skipped existing anime: ${title}`);
      return { saved: false, skipped: true };
    }

    // Ensure genre is valid for the schema enums
    try {
      const allowedGenres = Media.schema.path('genre').enumValues || [];
      if (!allowedGenres.includes(genre)) {
        genre = allowedGenres.length > 0 ? allowedGenres[0] : 'Action';
      }
    } catch (err) {
      genre = 'Action';
    }

    const mediaDoc = new Media({
      title,
      release_date,
      media,
      genre,
      director,
      description,
      poster,
      scraped: true,
      scrapeRunId: String(runId || ''),
      scrapeSource: 'jikan_top_anime',
      scrapeExternalId: String(animeId),
    });

    await mediaDoc.save();
    const msg = { runId: String(runId || ''), type: 'saved', animeId, title };
    try { scrapeEmitter.emit('log', msg); } catch (e) {}
    console.log(`Saved: ${title}`);
    return { saved: true, skipped: false };
  } catch (err) {
    const msg = { runId: String(runId || ''), type: 'error', animeId, message: err?.message || String(err) };
    try { scrapeEmitter.emit('log', msg); } catch (e) {}
    console.error(`Failed to scrape anime ID ${animeId}: ${err?.message || err}`);
    return { saved: false, skipped: false, error: err?.message || String(err) };
  }
}

async function scrapeTopAnime(limit = 100, runId = '') {
  const targetSaved = Math.max(1, Number(limit) || 100);
  const perPage = 25;
  let page = 1;
  let saved = 0;
  let skipped = 0;
  let failed = 0;

  while (saved < targetSaved) {
    // fetch page with basic retry on 429
    const maxPageAttempts = 5;
    let pageAttempt = 0;
    let animeList = [];
    while (pageAttempt < maxPageAttempts) {
      try {
        const { data } = await axios.get('https://api.jikan.moe/v4/top/anime', {
          params: { page, limit: perPage },
        });
        animeList = Array.isArray(data?.data) ? data.data : [];
        break;
      } catch (err) {
        const status = err?.response?.status;
        const retryAfter = err?.response?.headers?.['retry-after'] || err?.response?.headers?.['Retry-After'];
        if (status === 429) {
          const waitSec = retryAfter ? Number(retryAfter) : Math.min(60, 2 ** pageAttempt);
          console.warn(`Rate limited when fetching top list page=${page}, attempt=${pageAttempt + 1}, waiting ${waitSec}s`);
          await sleep(waitSec * 1000);
          pageAttempt += 1;
          continue;
        }
        const msg = { runId: String(runId || ''), type: 'page_error', page, message: err?.message || String(err) };
        try { scrapeEmitter.emit('log', msg); } catch (e) {}
        throw err;
      }
    }

    if (!animeList || animeList.length === 0) {
      break;
    }

    for (const anime of animeList) {
      if (saved >= targetSaved) break;

      const result = await scrapeAnimeById(anime.mal_id, runId);
      // modest pause to avoid hitting rate limits
      await sleep(300);
      if (result?.saved) saved += 1;
      else if (result?.skipped) skipped += 1;
      else failed += 1;
    }

    // emit progress update for this page
    try { scrapeEmitter.emit('log', { runId: String(runId || ''), type: 'progress', page: page, saved, skipped, failed }); } catch (e) {}

    page += 1;
  }

  return { saved, skipped, failed, pagesScanned: page - 1, targetSaved };
}

export { scrapeTopAnime };

// Note: when used as a module from the running server, the server provides DB connection.
// This file no longer auto-runs the scraper on import.