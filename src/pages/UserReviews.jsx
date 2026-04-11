import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from './navbar';
import './Profile.css';

export default function UserReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserReviews = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/users/me/reviews', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setReviews(data);
        }
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserReviews();
  }, []);

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="homepage-dark" style={{ minHeight: '100vh' }}>
          <div className="container py-4">
            <p>Loading your reviews...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="homepage-dark" style={{ minHeight: '100vh' }}>
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>My Reviews</h2>
            <Link to="/profile" className="btn btn-outline-secondary btn-sm">
              ← Back to Profile
            </Link>
          </div>

          {reviews.length === 0 ? (
            <div className="text-center py-5">
              <h4>No reviews yet</h4>
              <p className="text-muted">Start reviewing movies and TV shows!</p>
              <Link to="/home" className="btn btn-primary">
                Browse Media
              </Link>
            </div>
          ) : (
            <div className="reviews-container">
              {reviews.filter(review => review.media).map((review) => (
                <div key={review._id} className="review-box">
                  <div className="review-header">
                    <h5 className="review-title">
                      <Link to={`/media/${review.media._id}`} className="text-decoration-none text-light">
                        {review.media.title}
                      </Link>
                    </h5>
                    <span className="review-rating">⭐ {review.rating}/10</span>
                  </div>
                  
                  <div className="review-meta">
                    <span className="genre">{review.media.genre}</span>
                    <span className="year">{new Date(review.media.release_date).getFullYear()}</span>
                    <span className="date">{new Date(review.createdAt).toLocaleDateString()}</span>
                  </div>
                  
                  {review.comment && review.comment !== '(This guy wrote nothing)' && (
                    <div className="review-comment">
                      <p>{review.comment}</p>
                    </div>
                  )}
                  
                  <div className="review-votes">
                    <span className="upvotes">👍 {review.upvotes || 0}</span>
                    <span className="downvotes">👎 {review.downvotes || 0}</span>
                  </div>
                </div>
              ))}
              
              {/* Show message if some reviews have deleted media */}
              {reviews.filter(review => !review.media).length > 0 && (
                <div className="alert alert-warning mt-4">
                  <small>
                    {reviews.filter(review => !review.media).length} review(s) for deleted media are not shown.
                  </small>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
