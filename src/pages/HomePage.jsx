import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import NavBar from './navbar';

const FALLBACK_POSTER = '/logo192.png';
const CATEGORY_SECTIONS = [
  { slug: 'anime', title: 'Anime', mediaType: 'Anime' },
  { slug: 'movies', title: 'Movies', mediaType: 'Movies' },
  { slug: 'tv-series', title: 'TV Series', mediaType: 'TV_series' },
];

function getRating(value) {
  return typeof value === 'number' ? value.toFixed(1) : 'N/A';
}

function sortByRating(items) {
  return [...items].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
}

function HomePage() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGenre, setSelectedGenre] = useState('');

  useEffect(() => {
    fetch('http://localhost:5000/media')
      .then((res) => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then((data) => {
        setMedia(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching media:', err);
        setLoading(false);
      });
  }, []);

  const sections = useMemo(
    () => CATEGORY_SECTIONS
      .map((section) => ({
        ...section,
        items: sortByRating(
          media.filter((item) => {
            const matchesType = item.media === section.mediaType;
            const matchesGenre = !selectedGenre || item.genre === selectedGenre;
            return matchesType && matchesGenre;
          })
        ).slice(0, 5),
      }))
      .filter((section) => section.items.length > 0),
    [media, selectedGenre]
  );

  const genreOptions = useMemo(() => {
    const uniqueGenres = Array.from(
      new Set(
        media
          .map((item) => item.genre)
          .filter((genre) => typeof genre === 'string' && genre.trim())
      )
    ).sort((a, b) => a.localeCompare(b));

    return uniqueGenres;
  }, [media]);

  return (
    <div className="homepage-dark catalog-homepage">
      <NavBar />

      <main className="catalog-main">
        <div className="catalog-container">
          <div className="catalog-filter-wrap">
            <select
              className="catalog-genre-select"
              value={selectedGenre}
              onChange={(event) => setSelectedGenre(event.target.value)}
              aria-label="Filter by genre"
            >
              <option value="">All genres</option>
              {genreOptions.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="catalog-loading">Loading your library...</div>
          ) : sections.length === 0 ? (
            <div className="catalog-empty-state">
              <h2>Your library is waiting</h2>
              <p>No media items found yet. Add a title to start building these category shelves.</p>
              <Link to="/addmedia" className="catalog-secondary-link">
                Add Media
              </Link>
            </div>
          ) : (
            sections.map((section) => (
              <section className="catalog-section" key={section.slug}>
                <div className="catalog-section-header">
                  <h2>{section.title}</h2>
                  <Link to={`/categories/${section.slug}`} className="catalog-view-all">
                    View all
                  </Link>
                </div>

                <div className="catalog-card-row">
                  {section.items.map((item) => (
                    <article className="catalog-card" key={item._id}>
                      <Link to={`/media/${item._id}`} className="catalog-card-media">
                        <img
                          src={item.poster || FALLBACK_POSTER}
                          className="catalog-poster"
                          alt={item.title}
                          onError={(event) => {
                            event.currentTarget.src = FALLBACK_POSTER;
                          }}
                        />
                      </Link>

                      <div className="catalog-card-body">
                        <h3 className="catalog-card-title">{item.title}</h3>
                        <p className="catalog-card-rating">
                          {getRating(item.average_rating)}
                          <span className="catalog-star">★</span>
                        </p>
                        <Link to={`/media/${item._id}`} className="catalog-detail-btn">
                          View details
                        </Link>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </div>
      </main>
    </div>
  );
}

export default HomePage;
