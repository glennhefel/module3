import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Media from "./models/media.model.js";

dotenv.config();
mongoose.connect(process.env.ATLAS_URI);

async function scrapeAnimeById(animeId) {
  try {
    const { data } = await axios.get(`https://api.jikan.moe/v4/anime/${animeId}`);
    const anime = data.data;

    const title = anime.title || "Unknown";
    const release_date = anime.aired?.from ? new Date(anime.aired.from) : new Date("2000-01-01");
    const media = "Anime";
    const genre = anime.genres?.[0]?.name || "Unknown";
    const director = "Unknown"; 
    let description = anime.synopsis || "Unknown";
    
    const poster = anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url || "";

    const mediaDoc = new Media({
      title,
      release_date,
      media,
      genre,
      director,
      description,
      poster,
    });

    await mediaDoc.save();
    console.log(`Saved: ${title}`);
  } catch (err) {
    console.error(`Failed to scrape anime ID ${animeId}: ${err.message}`);
  }
}

// Example: scrape top 10 anime from MyAnimeList
async function scrapeTopAnime(limit = 100) {
  const { data } = await axios.get(`https://api.jikan.moe/v4/top/anime?limit=${limit}`);
  const animeList = data.data;
  for (const anime of animeList) {
    await scrapeAnimeById(anime.mal_id);
  }
  mongoose.disconnect();
}

scrapeTopAnime(10);