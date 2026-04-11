import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from './navbar';
import './Profile.css';

export default function UserDiscussions() {
  const [discussions, setDiscussions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserDiscussions = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('http://localhost:5000/users/me/discussions', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (res.ok) {
          const data = await res.json();
          setDiscussions(data);
        }
      } catch (err) {
        console.error('Error fetching discussions:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDiscussions();
  }, []);

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="homepage-dark" style={{ minHeight: '100vh' }}>
          <div className="container py-4">
            <p>Loading your discussions...</p>
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
            <h2>Discussion History</h2>
            <Link to="/profile" className="btn btn-outline-secondary btn-sm">
              ← Back to Profile
            </Link>
          </div>

          {discussions.length === 0 ? (
            <div className="text-center py-5">
              <h4>No discussions yet</h4>
              <p className="text-muted">Start participating in media discussions!</p>
              <Link to="/home" className="btn btn-primary">
                Browse Media
              </Link>
            </div>
          ) : (
            <div className="discussions-container">
              {discussions.filter(discussion => discussion.media).map((discussion) => (
                <div key={discussion._id} className="discussion-box">
                  <div className="discussion-header">
                    <h5 className="discussion-title">
                      <Link to={`/media/${discussion.media._id}`} className="text-decoration-none text-light">
                        {discussion.media.title}
                      </Link>
                    </h5>
                    <span className="discussion-indicator">💬 Discussion</span>
                  </div>
                  
                  <div className="discussion-meta">
                    <span className="genre">{discussion.media.genre}</span>
                    <span className="year">{new Date(discussion.media.release_date).getFullYear()}</span>
                    <span className="date">{new Date(discussion.createdAt).toLocaleDateString()}</span>
                    <span className="time">{new Date(discussion.createdAt).toLocaleTimeString()}</span>
                  </div>
                  
                  <div className="discussion-message">
                    <p>
                      {discussion.message.length > 200 
                        ? discussion.message.substring(0, 200) + '...'
                        : discussion.message
                      }
                    </p>
                    {discussion.isEdited && (
                      <small className="edited-indicator">(edited)</small>
                    )}
                  </div>
                  
                  <div className="discussion-actions">
                    <Link 
                      to={`/media/${discussion.media._id}`} 
                      className="btn btn-primary btn-sm"
                    >
                      View Full Discussion
                    </Link>
                  </div>
                </div>
              ))}
              
              {/* Show message if some discussions have deleted media */}
              {discussions.filter(discussion => !discussion.media).length > 0 && (
                <div className="alert alert-warning mt-4">
                  <small>
                    {discussions.filter(discussion => !discussion.media).length} discussion(s) for deleted media are not shown.
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
