import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import './MediaDetail.css';
import { jwtDecode } from "jwt-decode";
import NavBar from './navbar';
import Discussion from '../components/Discussion';

function MediaDetail() {
  const { id } = useParams();
  const [media, setMedia] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showDiscussion, setShowDiscussion] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isInWatchlist, setIsInWatchlist] = useState(false);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const userId = localStorage.getItem('userId');
  const userReviewed = reviews.find(r => r.user && (r.user._id === userId || r.user.id === userId));
  
  const checkWatchlistStatus = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch('http://localhost:5000/users/me/watchlist', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        const data = await res.json();
        const isInList = data.some(item => {
          const mediaId = item.media?._id || item.media?.id || item.media;
          return String(mediaId) === String(id);
        });
        setIsInWatchlist(isInList);
      }
    } catch (err) {
      console.error('Error checking watchlist status:', err);
    }
  }, [id]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
    
    fetch(`http://localhost:5000/media/${id}`, { headers })
      .then(res => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then(data => {
        setMedia(data);
        setReviews(data.reviews || []);
      })
      .catch(() => setMedia(null));

    // Check if media is in watchlist
    if (token) {
      checkWatchlistStatus();
    }
  }, [id, checkWatchlistStatus]);

  const toggleWatchlist = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to manage your watchlist.');
      return;
    }

    setWatchlistLoading(true);

    try {
      if (isInWatchlist) {
        // Remove from watchlist
        const res = await fetch(`http://localhost:5000/users/me/watchlist/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.ok) {
          setIsInWatchlist(false);
        } else {
          alert('Failed to remove from watchlist');
        }
      } else {
        // Add to watchlist
        const res = await fetch('http://localhost:5000/users/me/watchlist', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ mediaId: id }),
        });

        if (res.ok) {
          setIsInWatchlist(true);
        } else {
          const error = await res.json();
          if (error.message === 'Already in watchlist') {
            setIsInWatchlist(true);
          } else {
            alert('Failed to add to watchlist');
          }
        }
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err);
      alert('Failed to update watchlist');
    } finally {
      setWatchlistLoading(false);
    }
  };

  
  const token = localStorage.getItem('token');
  let isAdmin = false;
  if (token) {
    try {
      const decoded = jwtDecode(token);
      isAdmin = decoded.isAdmin;
    } catch (e) {
      isAdmin = false;
    }
  }

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this media?')) {
      try {
        const res = await fetch(`http://localhost:5000/media/${id}`, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          }
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.error || 'Network response was not ok');
        alert('Media deleted!');
        window.location.href = '/home';
      } catch (err) {
        console.error('Error deleting media:', err);
        alert('Failed to delete media: ' + err.message);
      }
    }
  };

  const handleEdit = async (editData) => {
    try {
      const res = await fetch(`http://localhost:5000/media/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}` 
        },
        body: JSON.stringify(editData)
      });
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Failed to update media');
      }

      const updatedMedia = await res.json();
      setMedia(updatedMedia);
      setShowEditModal(false);
      alert('Media updated successfully!');
    } catch (err) {
      console.error('Error updating media:', err);
      alert('Failed to update media: ' + err.message);
    }
  };

  const sendReviewVote = async (reviewId, value) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to vote.');
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/ratings/reviews/${reviewId}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ value }),
      });

      if (!res.ok) {
        alert('Vote failed.');
        return;
      }

      // Refresh media 
      const mediaRes = await fetch(`http://localhost:5000/media/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mediaRes.ok) {
        const data = await mediaRes.json();
        setMedia(data);
        setReviews(data.reviews || []);
      }
    } catch (err) {
      alert('Vote failed.');
    }
  };

  const deleteReview = async (reviewId) => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to delete reviews.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this review?')) {
      return;
    }

    try {
      const res = await fetch(`http://localhost:5000/ratings/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        alert('Failed to delete review.');
        return;
      }

      // Refresh media data
      const mediaRes = await fetch(`http://localhost:5000/media/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (mediaRes.ok) {
        const data = await mediaRes.json();
        setMedia(data);
        setReviews(data.reviews || []);
      }

      alert('Review deleted successfully!');
    } catch (err) {
      console.error('Error deleting review:', err);
      alert('Failed to delete review.');
    }
  };
  //TIME
  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const handleUpvote = (reviewId) => sendReviewVote(reviewId, 1);
  const handleDownvote = (reviewId) => sendReviewVote(reviewId, -1);

  if (media === null) return <div>Media not found.</div>;

  const releaseYear = media.release_date && !Number.isNaN(new Date(media.release_date).getTime())
    ? new Date(media.release_date).getFullYear()
    : 'TBA';
  const averageRating = typeof media.average_rating === 'number'
    ? media.average_rating.toFixed(1)
    : 'N/A';
  const reviewCount = typeof media.total_votes === 'number' ? media.total_votes : reviews.length;

  return (
    <>
      <NavBar />
      <div className="media-detail-container">
        <div className="movie-container">
          {isAdmin && (
            <div className="detail-admin-controls">
              <button onClick={() => setShowEditModal(true)} className="edit-media-btn" title="Edit media">
                Edit
              </button>
              <button onClick={handleDelete} className="delete-media-btn" title="Delete media">
                Delete
              </button>
            </div>
          )}

          <div className="movie-layout">
            <div className="movie-side-panel">
              <div className="poster-stat-row">
                <div className="movie-poster">
                  <img
                    src={media.poster || '/logo192.png'}
                    alt={`${media.title} Poster`}
                    className="poster-image"
                    onError={(event) => {
                      event.currentTarget.src = '/logo192.png';
                    }}
                  />
                </div>

                <div className="media-side-actions">
                  <div className="detail-rating-pill">
                    {averageRating}/10 <span className="detail-rating-star">☆</span>
                  </div>

                  <button
                    onClick={toggleWatchlist}
                    disabled={watchlistLoading}
                    className={`detail-watchlist-btn${isInWatchlist ? ' active' : ''}`}
                  >
                    {watchlistLoading
                      ? 'Loading...'
                      : isInWatchlist
                        ? 'Watchlisted ✓'
                        : 'Watchlist +'}
                  </button>
                </div>
              </div>

              <button
                onClick={() => setShowDiscussion(true)}
                className="detail-discuss-btn"
              >
                Discuss →
              </button>
            </div>

            <div className="movie-details">
              <h1 className="movie-title">{media.title}</h1>

              <div className="movie-info">
                <p><strong>Director:</strong> {media.director}</p>
                <p><strong>Genre:</strong> {media.genre}</p>
                <p><strong>Released:</strong> {releaseYear} • <strong>Reviews:</strong> {reviewCount}</p>
              </div>

              <div className="movie-description">
                <h4>Synopsis</h4>
                <p>{media.description}</p>
              </div>
            </div>

            <div className="movie-action-rail">
              <button
                onClick={() => setShowModal(true)}
                className={`detail-review-btn${userReviewed ? ' reviewed' : ''}`}
              >
                {userReviewed ? 'Reviewed' : 'Review'}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews*/}
        <div className="reviews-section">
          <div className="reviews-header">
            <h4 className="reviews-title">
              <span className="reviews-icon">💬</span>
              Reviews ({reviews.length})
            </h4>
            
            
            <div className="quick-review-container">
              <div className="user-avatar-small">
                <span>👤</span>
              </div>
              <button 
                className="quick-review-btn"
                onClick={() => setShowModal(true)}
              >
                {userReviewed ? "Update your review..." : "Write a review..."}
              </button>
            </div>
          </div>

          
          <div className="reviews-list">
            {reviews.length === 0 ? (
              <div className="no-reviews">
                <div className="no-reviews-icon"></div>
                <p>No reviews yet.</p>
              </div>
            ) : (
              reviews.map((review) => (
                <div key={review.id} className="review-card">
                
                  <div className="review-header">
                    <div className="review-user-info">
                      <div className="user-avatar">
                        <span>{review.user.username.charAt(0).toUpperCase()}</span>
                      </div>
                      <div className="user-details">
                        <div className="username">{review.user.username}</div>
                        <div className="review-meta">
                          <span className="rating-badge">
                            ⭐ {review.rating}/10
                          </span>
                          <span className="review-time">• {formatTime(review.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    
                    
                    {(review.user._id === userId || review.user.id === userId) && (
                      <button 
                        onClick={() => deleteReview(review._id)}
                        className="delete-review-btn"
                        title="Delete review"
                      >
                        🗑️
                      </button>
                    )}
                  </div>

                  {/* Review Content */}
                  <div className="review-content">
                    {review.comment === '(This guy wrote nothing)' ? (
                      <div className="empty-comment">
                        <em>No written review</em>
                      </div>
                    ) : (
                      <p className="review-text">{review.comment}</p>
                    )}
                  </div>

                  {/* Review Actions */}
                  <div className="review-actions">
                    <div className="vote-section">
                      <button 
                        onClick={() => handleUpvote(review._id)} 
                        className={`vote-btn upvote ${review.userVote === 1 ? 'active' : ''}`}
                      >
                        <span className="vote-icon">👍</span>
                        <span className="vote-count">{review.upvotes || 0}</span>
                      </button>
                      
                      <button 
                        onClick={() => handleDownvote(review._id)} 
                        className={`vote-btn downvote ${review.userVote === -1 ? 'active' : ''}`}
                      >
                        <span className="vote-icon">👎</span>
                        <span className="vote-count">{review.downvotes || 0}</span>
                      </button>
                    </div>
                    
                    <div className="review-stats">
                      {(review.upvotes || 0) + (review.downvotes || 0) > 0 && (
                        <span className="total-votes">
                          {(review.upvotes || 0) + (review.downvotes || 0)} votes
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/*Modal */}
        {showModal && (
          <div className="review-modal">
            <div className="modal-content-box">
              {/* Modal Header */}
              <div className="modal-header">
                <h3 className="modal-title">
                  <span className="modal-icon"></span>
                  {userReviewed ? 'Edit Your Review' : 'Write a Review'}
                </h3>
                <button 
                  className="modal-close-btn"
                  onClick={() => setShowModal(false)}
                  type="button"
                >
                  ✕
                </button>
              </div>

              
              <form onSubmit={async (e) => {
                e.preventDefault();
                const rating = e.target.rating.value;
                const comment = e.target.comment.value;

                try {
                  const res = await fetch(`http://localhost:5000/ratings/${id}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rating, comment, userId }),
                  });

                  if (!res.ok) {
                    throw new Error('Failed to submit review');
                  }

                  setShowModal(false);

                  // Refetch media details 
                  const token = localStorage.getItem('token');
                  const headers = token ? { 'Authorization': `Bearer ${token}` } : {};
                  fetch(`http://localhost:5000/media/${id}`, { headers })
                    .then(res => res.json())
                    .then(data => {
                      setMedia(data);
                      setReviews(data.reviews || []);
                    });
                } catch (err) {
                  alert('Failed to submit review: ' + err.message);
                }
              }}>
                
               
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">⭐</span>
                    Rating (1-10)
                  </label>
                  <select
                    name="rating"
                    required
                    className="form-control rating-select"
                  >
                    <option value="">Select rating</option>
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>
                        ⭐ {num}/10 {num <= 3 ? '- Poor' : num <= 5 ? '- Fair' : num <= 7 ? '- Good' : num <= 8 ? '- Great' : '- Excellent'}
                      </option>
                    ))}
                  </select>
                </div>

                
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon">💭</span>
                    Comment (optional)
                  </label>
                  <textarea
                    name="comment"
                    rows="4"
                    className="form-control comment-textarea"
                    placeholder="Share your thoughts about this..."
                  ></textarea>
                </div>

               
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    <span className="btn-icon"></span>
                    {userReviewed ? 'Update Review' : 'Post Review'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

       
        <Discussion 
          mediaId={id}
          isOpen={showDiscussion}
          onClose={() => setShowDiscussion(false)}
        />

       
        {showEditModal && (
          <div className="edit-media-modal">
            <div className="modal-content-box">
          
              <div className="modal-header">
                <h3 className="modal-title">
                  <span className="modal-icon"></span>
                  Edit Media
                </h3>
                <button 
                  className="modal-close-btn"
                  onClick={() => setShowEditModal(false)}
                  type="button"
                >
                  ✕
                </button>
              </div>

              {/* Edit Form */}
              <form onSubmit={async (e) => {
                e.preventDefault();
                const formData = {
                  title: e.target.title.value,
                  director: e.target.director.value,
                  genre: e.target.genre.value,
                  description: e.target.description.value,
                  poster: e.target.poster.value,
                };
                await handleEdit(formData);
              }}>
                
                
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon"></span>
                    Title
                  </label>
                  <input
                    name="title"
                    type="text"
                    required
                    defaultValue={media.title}
                    className="form-control"
                    placeholder="Enter movie/TV show title"
                  />
                </div>

                
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon"></span>
                    Director
                  </label>
                  <input
                    name="director"
                    type="text"
                    required
                    defaultValue={media.director}
                    className="form-control"
                    placeholder="Enter director name"
                  />
                </div>

                
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon"></span>
                    Genre
                  </label>
                  <input
                    name="genre"
                    type="text"
                    required
                    defaultValue={media.genre}
                    className="form-control"
                    placeholder="Enter genre (e.g., Action, Comedy, Drama)"
                  />
                </div>

               
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon"></span>
                    Poster URL
                  </label>
                  <div className="image-input-group">
                    <input
                      name="poster"
                      type="url"
                      required
                      defaultValue={media.poster}
                      className="form-control"
                      placeholder="Enter poster image URL"
                    />
                    {media.poster && (
                      <img 
                        src={media.poster} 
                        alt="Current poster" 
                        className="image-preview"
                      />
                    )}
                  </div>
                </div>

               
                <div className="form-group">
                  <label className="form-label">
                    <span className="label-icon"></span>
                    Synopsis
                  </label>
                  <textarea
                    name="description"
                    rows="4"
                    required
                    defaultValue={media.description}
                    className="form-control comment-textarea"
                    placeholder="Enter movie/TV show synopsis"
                  ></textarea>
                </div>

               
                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="btn-cancel"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-submit">
                    <span className="btn-icon"></span>
                    Update Media
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default MediaDetail;