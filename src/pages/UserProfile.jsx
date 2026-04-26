import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate, Navigate } from 'react-router-dom';
import NavBar from './navbar';
import { getBadgeMeta } from '../constants/achievements';
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

export default function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const decoded = safeDecodeToken(token);
  const currentUserId = decoded?.id || decoded?._id || null;
  const [user, setUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (decoded) setIsOwner(decoded.id === id || decoded._id === id);

    const fetchUser = async () => {
      try {
        const res = await fetch(`http://localhost:5000/users/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const userData = data.user || data;
        setUser(userData);
        setUsernameInput(userData?.username || '');
      } catch (err) {
        console.error('Fetch user failed:', err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id, decoded, token]);

  if (currentUserId && String(currentUserId) === String(id)) {
    return <Navigate to="/profile" replace />;
  }

  const updateUsername = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return alert('Enter a username');
    const token = localStorage.getItem('token');
    if (!token) return alert('Please log in');
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ username: usernameInput.trim() }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      const data = await res.json();
      const updatedUser = data.user || data;
      setUser(prev => ({ ...prev, ...updatedUser }));
      localStorage.setItem('username', updatedUser.username);
      alert('Username updated successfully!');
      navigate(`/users/${updatedUser._id || id}`);
    } catch (err) {
      console.error('Username update error:', err);
      alert('Failed to update username: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    if (!newPassword.trim()) return alert('Enter a new password');
    const token = localStorage.getItem('token');
    if (!token) return alert('Please log in');
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ password: newPassword.trim() }),
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }
      setNewPassword('');
      alert('Password updated successfully!');
      navigate('/');
    } catch (err) {
      console.error('Password update error:', err);
      alert('Failed to update password: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <>
      <NavBar />
      <div className="homepage-dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="profile-page container py-4" style={{ flex: 1 }}><p>Loading...</p></div>
      </div>
    </>
  );

  if (!user) return (
    <>
      <NavBar />
      <div className="homepage-dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="profile-page container py-4" style={{ flex: 1 }}>
          <p>User not found.</p>
          <Link to="/" className="btn btn-sm btn-primary">Home</Link>
        </div>
      </div>
    </>
  );

  const decoratedBadges = (Array.isArray(user.equippedBadges) ? user.equippedBadges : [])
    .map((badgeId) => ({ id: badgeId, ...getBadgeMeta(badgeId) }))
    .filter((badge) => badge.title);

  return (
    <>
      <NavBar />
      <div className="homepage-dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="profile-page container py-4" style={{ flex: 1 }}>
          <div className="profile-container">
            <div className="profile-header d-flex align-items-center gap-3 mb-3">
              <img src={user.avatar || '/logo192.png'} alt="avatar" className="profile-avatar" />
              <div>
                <h3 className="mb-0">{user.username || 'Unknown'}</h3>
                {user.favoriteQuote ? (
                  <p className="profile-quote">"{user.favoriteQuote}"</p>
                ) : null}
                {Array.isArray(user.favoriteGenres) && user.favoriteGenres.length > 0 ? (
                  <div className="profile-genre-preview">
                    {user.favoriteGenres.map((genre) => (
                      <span key={genre} className="profile-genre-pill">{genre}</span>
                    ))}
                  </div>
                ) : null}
                {decoratedBadges.length > 0 ? (
                  <div className="profile-badge-strip">
                    {decoratedBadges.map((badge) => (
                      <div key={badge.id} className="profile-badge-chip" title={badge.title}>
                        <img src={badge.image} alt={badge.title} className="profile-badge-image" />
                        <span>{badge.title}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
                <div className="mb-muted">{user.email || 'No email found'}</div>
              </div>
            </div>

            {isOwner && (
              <>
                <div className="mb-4">
                  <form onSubmit={updateUsername} className="d-flex gap-2 align-items-center profile-form">
                    <input className="form-control form-control-sm profile-input" value={usernameInput} onChange={e => setUsernameInput(e.target.value)} disabled={saving} placeholder="New username" />
                    <button className="btn btn-outline-primary btn-sm" disabled={saving} type="submit">{saving ? 'Saving...' : 'Save'}</button>
                  </form>
                </div>

                <div className="mb-4">
                  <form onSubmit={updatePassword} className="d-flex gap-2 align-items-center profile-form">
                    <input type="password" className="form-control form-control-sm profile-input" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={saving} placeholder="New password" />
                    <button className="btn btn-outline-warning btn-sm" disabled={saving} type="submit">{saving ? 'Saving...' : 'Change password'}</button>
                  </form>
                </div>
              </>
            )}

            <div className="profile-navigation mb-4">
              <h5 className="mb-3">{isOwner ? 'Your Activity' : `${user.username}'s Activity`}</h5>
              <div className="d-flex flex-wrap gap-3">
                <Link to={`/users/${id}/watchlist`} className="btn btn-outline-success btn-sm">View Watchlist</Link>
                <Link to={`/users/${id}/reviews`} className="btn btn-outline-primary btn-sm">Reviews</Link>
                <Link to={`/users/${id}/discussions`} className="btn btn-outline-info btn-sm">Discussions</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
