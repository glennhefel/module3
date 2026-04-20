import React, { useEffect, useState, useCallback } from 'react';
import NavBar from './navbar';
import { Link, Navigate, useParams } from 'react-router-dom';
import './Profile.css';

function safeDecodeToken(token) {
  if (!token) return null;
  try {
    const part = token.split('.')[1];
    const json = atob(part.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export default function WatchlistPage() {
  const { id } = useParams();
  const [items, setItems] = useState([]);
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('token');
  const decoded = safeDecodeToken(token);
  const currentUserId = decoded?.id || decoded?._id || null;
  const isOtherUserProfile = Boolean(id);

  const fetchWatchlist = useCallback(async () => {
    setLoading(true);
    if (!token && !isOtherUserProfile) {
      setItems([]);
      setLoading(false);
      return;
    }

    try {
      const endpoint = isOtherUserProfile
        ? `http://localhost:5000/users/${id}/watchlist`
        : 'http://localhost:5000/users/me/watchlist';

      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(endpoint, {
        headers,
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json().catch(() => []);
      
      
      const list = Array.isArray(data) ? data : [];
      setItems(list);
    } catch (err) {
      console.error('Error fetching watchlist:', err);
      if (!isOtherUserProfile) {
        const fallback = safeDecodeToken(token);
        setItems(fallback?.watchlist || []);
      } else {
        setItems([]);
      }
    } finally {
      setLoading(false);
    }
  }, [token, isOtherUserProfile, id]);

  useEffect(() => {
    const fetchProfileUser = async () => {
      if (!isOtherUserProfile) return;
      try {
        const res = await fetch(`http://localhost:5000/users/${id}`);
        if (!res.ok) return;
        const data = await res.json();
        setProfileUser(data.user || null);
      } catch {
        setProfileUser(null);
      }
    };
    fetchProfileUser();
  }, [id, isOtherUserProfile]);

  const updateStatus = async (mediaId, newStatus) => {
    if (!token) {
      alert('Please log in to update status.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/users/me/watchlist/${mediaId}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        // Update the local state
        setItems(prevItems => 
          prevItems.map(item => {
            const itemMediaId = item.media?._id || item.media?.id;
            return itemMediaId === mediaId 
              ? { ...item, status: newStatus }
              : item;
          })
        );
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to update status');
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const removeFromWatchlist = async (mediaId) => {
    if (!token) {
      alert('Please log in to manage your watchlist.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/users/me/watchlist/${mediaId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        // Refresh the watchlist
        fetchWatchlist();
      } else {
        alert('Failed to remove from watchlist');
      }
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      alert('Failed to remove from watchlist');
    }
  };

  useEffect(() => {
    fetchWatchlist();
  }, [fetchWatchlist]);

  if (isOtherUserProfile && currentUserId && String(currentUserId) === String(id)) {
    return <Navigate to="/watchlist" replace />;
  }

  return (
    <>
      <NavBar />
      <div className="homepage-dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="container py-4" style={{ flex: 1, maxWidth: '900px' }}>
          <div className="watchlist-header mb-4">
            <h2 className="mb-1">
              {isOtherUserProfile ? `${profileUser?.username || 'User'}'s Watchlist` : 'My Watchlist'}
            </h2>
            <p className="text-muted">
              {isOtherUserProfile ? 'Viewing saved media collection' : 'Manage your saved media collection'}
            </p>
          </div>

          {loading ? (
            <div className="loading-container">
              <p>Loading your watchlist...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-watchlist">
              <div className="empty-icon">📱</div>
              <h4 className="mb-1"> {isOtherUserProfile ? `${profileUser?.username || 'User'}'s Watchlist is empty` : 'Your Watchlist is empty'}</h4>
              <p className="text-muted">Start adding movies and TV shows to keep track of what you want to watch!</p>
              <Link to="/home" className="btn btn-primary">Browse Media</Link>
            </div>
          ) : (
            <div className="watchlist-items">
              {items.filter(item => item && item.media).map((item, index) => {
                const m = item.media;
                const mediaId = m._id || m.id;
                const status = item.status || 'plan_to_watch';
                
                
                if (!m || !mediaId) {
                  console.warn('Skipping invalid watchlist item:', item);
                  return null;
                }
                
                return (
                  <div className="watchlist-item" key={mediaId}>
                    <div className="item-number">
                      {index + 1}
                    </div>
                    
                    <div className="item-poster">
                      <img 
                        src={m.poster || m.image || '/logo192.png'} 
                        alt={m.title || m.name || 'Unknown'}
                        onError={(e) => {e.target.src = '/logo192.png'}}
                      />
                    </div>
                    
                    <div className="item-details">
                      <div className="item-title">
                        {m.title || m.name || 'Untitled'}
                      </div>
                      <div className="item-subtitle">
                        <select 
                          value={status}
                          onChange={(e) => updateStatus(mediaId, e.target.value)}
                          className="status-dropdown"
                          disabled={isOtherUserProfile}
                        >
                          <option value="plan_to_watch">Plan to Watch</option>
                          <option value="watching">Watching</option>
                          <option value="completed">Completed</option>
                          <option value="dropped">Dropped</option>
                        </select>
                      </div>
                    </div>
                    
                    <div className="item-type">
                      {m.media === 'TV_series' ? 'TV' : m.media === 'Movies' ? 'Movie' : m.media || 'Unknown'}
                    </div>
                    
                    <div className="item-rating">
                      {item.userRating ? `${item.userRating}/10` : 'Not Rated'} ⭐
                    </div>
                    
                    <div className="item-actions">
                      <Link 
                        to={`/media/${mediaId || ''}`} 
                        className="btn-action view"
                        title="View Details"
                      >
                        View
                      </Link>
                      <button 
                        onClick={() => removeFromWatchlist(mediaId)} 
                        className="btn-action remove"
                        title="Remove from Watchlist"
                        disabled={isOtherUserProfile}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          )}
        </div>
      </div>
    </>
  );
}