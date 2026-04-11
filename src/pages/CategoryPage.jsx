import React, { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import './HomePage.css';
import NavBar from './navbar';

const FALLBACK_POSTER = '/logo192.png';
const CATEGORY_MAP = {
  anime: { title: 'Anime', mediaType: 'Anime' },
  movies: { title: 'Movies', mediaType: 'Movies' },
  'tv-series': { title: 'TV Series', mediaType: 'TV_series' },
};

function getRating(value) {
  return typeof value === 'number' ? value.toFixed(1) : 'N/A';
}

function sortByRating(items) {
  return [...items].sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0));
}

export default function CategoryPage() {
  const { categoryKey } = useParams();
  const category = CATEGORY_MAP[categoryKey];
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

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
  }, [categoryKey]);

  const items = useMemo(() => {
    if (!category) return [];
    return sortByRating(media.filter((item) => item.media === category.mediaType));
  }, [category, media]);

  return (
    <div className="homepage-dark catalog-homepage">
      <NavBar />

      <main className="catalog-main">
        <div className="catalog-container">
          {!category ? (
            <div className="catalog-empty-state">
              <h2>Category not found</h2>
              <p>The category you requested does not exist.</p>
              <Link to="/home" className="catalog-secondary-link">
                Back home
              </Link>
            </div>
          ) : loading ? (
            <div className="catalog-loading">Loading {category.title.toLowerCase()}...</div>
          ) : (
            <>
              <div className="category-page-header">
                <div>
                  <p className="category-page-kicker">View all</p>
                  <h1>{category.title}</h1>
                  <p>
                    {items.length} {items.length === 1 ? 'title' : 'titles'} in this category.
                  </p>
                </div>

                <div className="category-header-actions">
                  <Link to="/home" className="catalog-secondary-link">
                    Back home
                  </Link>
                  <Link to="/top100" className="catalog-secondary-link">
                    Top 100
                  </Link>
                </div>
              </div>

              {items.length === 0 ? (
                <div className="catalog-empty-state">
                  <h2>No {category.title} yet</h2>
                  <p>Add media to populate this category page.</p>
                  <Link to="/addmedia" className="catalog-secondary-link">
                    Add Media
                  </Link>
                </div>
              ) : (
                <div className="category-grid">
                  {items.map((item) => (
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
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
