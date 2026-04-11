import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Profile.css'; 
import NavBar from './navbar';

function Top100Page() {
 
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:5000/media')
      .then((res) => {
        if (!res.ok) throw new Error('Fetch failed');
        return res.json();
      })
      .then((data) => {
        // Sort by average_rating descending and take top 100
        const sorted = data
          .sort((a, b) => (b.average_rating || 0) - (a.average_rating || 0))
          .slice(0, 100);
        setMedia(sorted);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching media:', err);
        setLoading(false);
      });
  }, []);

  return (
    <>
      <NavBar />
      <div className="homepage-dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="container py-4" style={{ flex: 1, maxWidth: '900px' }}>
          <div className="watchlist-header mb-4">
            <h2 className="mb-1">Top 100 List</h2>
            <p className="text-muted">Highest rated movies, TV shows and anime</p>
          </div>

          {loading ? (
            <div className="loading-container">
              <p>Loading top rated media...</p>
            </div>
          ) : media.length === 0 ? (
            <div className="empty-watchlist">
              <div className="empty-icon">📊</div>
              <h4>No media found</h4>
              <p className="text-muted">Unable to load the top rated content.</p>
            </div>
          ) : (
            <div className="watchlist-items">
              {media.map((item, index) => (
                <div className="watchlist-item" key={item._id}>
                  <div className="item-number">
                    {index + 1}
                  </div>
                  
                  <div className="item-poster">
                    <img 
                      src={item.poster || '/logo192.png'} 
                      alt={item.title}
                      onError={(e) => {e.target.src = '/logo192.png'}}
                    />
                  </div>
                  
                  <div className="item-details">
                    <div className="item-title">
                      {item.title}
                    </div>
                    <div className="item-subtitle">
                      {item.director || 'Unknown Director'}
                    </div>
                  </div>
                  
                  <div className="item-type">
                    {item.media === 'TV_series' ? 'TV' : item.media === 'Movies' ? 'Movie' : item.media || 'Unknown'}
                  </div>
                  
                  <div className="item-rating">
                    ★ {item.average_rating?.toFixed(1) || 'N/A'} ({item.total_votes || 0})
                  </div>
                  
                  <div className="item-actions">
                    <Link 
                      to={`/media/${item._id}`} 
                      className="btn-action view"
                      title="View Details"
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Top100Page;