import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavBar from './navbar';
import { getBadgeMeta } from '../constants/achievements';
import './Profile.css';

const DEFAULT_AVATAR = '/logo192.png';
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

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

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [favoriteQuote, setFavoriteQuote] = useState('');
  const [availableGenres, setAvailableGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [equippedBadges, setEquippedBadges] = useState([]);
  const [maxEquippedBadges, setMaxEquippedBadges] = useState(3);
  const [savingBadges, setSavingBadges] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const avatarInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    
    if (!token) {
      setLoading(false);
      return;
    }

 
    const fetchUser = async () => {
      try {
        const res = await fetch('http://localhost:5000/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        
        const data = await res.json();
        const userData = data.user || data;
        setUser(userData);
        setUsernameInput(userData?.username || '');
        setFavoriteQuote(userData?.favoriteQuote || '');
        setSelectedGenres(Array.isArray(userData?.favoriteGenres) ? userData.favoriteGenres : []);
        setEquippedBadges(Array.isArray(userData?.equippedBadges) ? userData.equippedBadges : []);
      } catch (err) {
        console.error('Failed to fetch user:', err);
        
        
        const decoded = safeDecodeToken(token);
        if (decoded) {
          const fallbackUser = { 
            _id: decoded.id || decoded._id, 
            username: decoded.username, 
            email: decoded.email || localStorage.getItem('email')
          };
          setUser(fallbackUser);
          setUsernameInput(fallbackUser.username || '');
        } else {
          // If invalid, clear all
          localStorage.removeItem('token');
          localStorage.removeItem('username');
          localStorage.removeItem('email');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const res = await fetch('http://localhost:5000/media/genres');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setAvailableGenres(Array.isArray(data.genres) ? data.genres : []);
      } catch (err) {
        console.error('Failed to fetch genres:', err);
        setAvailableGenres([]);
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const fetchAchievements = async () => {
      try {
        const res = await fetch('http://localhost:5000/users/me/achievements', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const data = await res.json();
        setAchievements(Array.isArray(data.achievements) ? data.achievements : []);
        setEquippedBadges(Array.isArray(data.equippedBadges) ? data.equippedBadges : []);
        setMaxEquippedBadges(
          Number.isInteger(data.maxEquippedBadges) ? data.maxEquippedBadges : 3
        );
      } catch (err) {
        console.error('Failed to fetch achievements:', err);
        setAchievements([]);
      }
    };

    fetchAchievements();
  }, []);

  const updateUsername = async (e) => {
    e.preventDefault();
    if (!usernameInput.trim()) return alert('Enter a username');
    const token = localStorage.getItem('token');
    if (!token) return alert('Please log in');
    
    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/users/me', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
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
      navigate('/');
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
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
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

  const toggleGenreSelection = (genre) => {
    setSelectedGenres((prev) => (
      prev.includes(genre) ? prev.filter((item) => item !== genre) : [...prev, genre]
    ));
  };

  const updatePreferences = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) return alert('Please log in');

    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          favoriteQuote: favoriteQuote.trim(),
          favoriteGenres: selectedGenres,
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      const updatedUser = data.user || data;
      setUser((prev) => ({ ...prev, ...updatedUser }));
      setFavoriteQuote(updatedUser.favoriteQuote || '');
      setSelectedGenres(Array.isArray(updatedUser.favoriteGenres) ? updatedUser.favoriteGenres : []);
      alert('Preferences updated successfully!');
    } catch (err) {
      console.error('Preference update error:', err);
      alert('Failed to update preferences: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const toggleEquippedBadge = (badge) => {
    if (!badge?.earned) return;

    setEquippedBadges((prev) => {
      if (prev.includes(badge.id)) {
        return prev.filter((id) => id !== badge.id);
      }
      if (prev.length >= maxEquippedBadges) {
        alert(`You can equip up to ${maxEquippedBadges} badges.`);
        return prev;
      }
      return [...prev, badge.id];
    });
  };

  const saveEquippedBadges = async () => {
    const token = localStorage.getItem('token');
    if (!token) return alert('Please log in');

    setSavingBadges(true);
    try {
      const res = await fetch('http://localhost:5000/users/me/achievements/equipped', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ badgeIds: equippedBadges }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      const updatedUser = data.user || data;
      setUser((prev) => ({ ...prev, ...updatedUser }));
      setEquippedBadges(
        Array.isArray(updatedUser?.equippedBadges) ? updatedUser.equippedBadges : []
      );
      alert('Badge decoration updated!');
    } catch (err) {
      console.error('Badge update error:', err);
      alert('Failed to update badges: ' + err.message);
    } finally {
      setSavingBadges(false);
    }
  };

  const triggerAvatarUpload = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_AVATAR_BYTES) {
      alert('Image is too large. Please use an image smaller than 2MB.');
      e.target.value = '';
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in');
      e.target.value = '';
      return;
    }

    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(new Error('Failed to read image'));
      reader.readAsDataURL(file);
    }).catch((err) => {
      alert(err.message || 'Failed to process image');
      return null;
    });

    if (!dataUrl) {
      e.target.value = '';
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('http://localhost:5000/users/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: dataUrl }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      const updatedUser = data.user || data;
      setUser((prev) => ({ ...prev, ...updatedUser }));
      alert('Profile picture updated successfully!');
    } catch (err) {
      console.error('Avatar update error:', err);
      const message = err?.message === 'Failed to fetch'
        ? 'Could not reach the server while uploading the image. Please restart backend and try again.'
        : err.message;
      alert('Failed to update profile picture: ' + message);
    } finally {
      setSaving(false);
      e.target.value = '';
    }
  };

  if (loading) return (
    <>
      <NavBar />
      <div className="homepage-dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="profile-page container py-4" style={{ flex: 1 }}>
          <p>Loading...</p>
        </div>
      </div>
    </>
  );

  if (!user) return (
    <>
      <NavBar />
      <div className="homepage-dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div className="profile-page container py-4" style={{ flex: 1 }}>
          <p>Please log in to view your profile.</p>
          <Link to="/" className="btn btn-sm btn-primary">Login</Link>
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
              <div className="profile-avatar-block">
                <img src={user.avatar || DEFAULT_AVATAR} alt="avatar" className="profile-avatar" />
                <input
                  ref={avatarInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="profile-avatar-input"
                />
                <div className="avatar-actions">
                  <button
                    type="button"
                    className="btn btn-outline-light btn-sm avatar-action-btn"
                    onClick={triggerAvatarUpload}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Change photo'}
                  </button>
                </div>
              </div>
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

            <div className="mb-4">
              <form onSubmit={updateUsername} className="d-flex gap-2 align-items-center profile-form">
                <input
                  className="form-control form-control-sm profile-input"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  disabled={saving}
                  placeholder="New username"
                />
                <button className="btn btn-outline-primary btn-sm" disabled={saving} type="submit">
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </form>
            </div>

            <div className="mb-4">
              <form onSubmit={updatePassword} className="d-flex gap-2 align-items-center profile-form">
                <input
                  type="password"
                  className="form-control form-control-sm profile-input"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  disabled={saving}
                  placeholder="New password"
                />
                <button className="btn btn-outline-warning btn-sm" disabled={saving} type="submit">
                  {saving ? 'Saving...' : 'Change password'}
                </button>
              </form>
            </div>

            <div className="mb-4 preference-section">
              <h5 className="mb-3">Profile Preferences</h5>
              <form onSubmit={updatePreferences}>
                <div className="mb-3">
                  <label htmlFor="favorite-quote" className="form-label">Favorite Quote</label>
                  <textarea
                    id="favorite-quote"
                    className="form-control profile-quote-input"
                    value={favoriteQuote}
                    onChange={(e) => setFavoriteQuote(e.target.value)}
                    placeholder="Write a quote that represents you..."
                    maxLength={200}
                    rows={2}
                    disabled={saving}
                  />
                </div>

                <div className="mb-3">
                  <div className="form-label mb-2">Favorite Genres</div>
                  {availableGenres.length === 0 ? (
                    <div className="mb-muted">No genres are available right now.</div>
                  ) : (
                    <div className="genre-selection-grid">
                      {availableGenres.map((genre) => (
                        <button
                          key={genre}
                          type="button"
                          className={`genre-selection-chip ${selectedGenres.includes(genre) ? 'active' : ''}`}
                          onClick={() => toggleGenreSelection(genre)}
                          disabled={saving}
                        >
                          {genre}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <button className="btn btn-outline-light btn-sm" disabled={saving} type="submit">
                  {saving ? 'Saving...' : 'Save preferences'}
                </button>
              </form>
            </div>

            <div className="mb-4 preference-section">
              <h5 className="mb-3">Achievements & Badges</h5>
              {achievements.length === 0 ? (
                <div className="mb-muted">No achievements available yet.</div>
              ) : (
                <>
                  <div className="achievement-grid">
                    {achievements.map((badge) => {
                      const isEquipped = equippedBadges.includes(badge.id);
                      return (
                        <button
                          key={badge.id}
                          type="button"
                          className={`achievement-card ${badge.earned ? 'earned' : 'locked'} ${isEquipped ? 'equipped' : ''}`}
                          onClick={() => toggleEquippedBadge(badge)}
                          disabled={savingBadges || !badge.earned}
                        >
                          <img src={badge.image} alt={badge.title} className="achievement-badge-image" />
                          <div className="achievement-card-content">
                            <h6 className="mb-1">{badge.title}</h6>
                            <p className="mb-1">{badge.description}</p>
                            <small>
                              Progress: {badge.progress}/{badge.target}
                            </small>
                          </div>
                          <span className={`achievement-status ${badge.earned ? 'earned' : 'locked'}`}>
                            {badge.earned ? (isEquipped ? 'Equipped' : 'Unlocked') : 'Locked'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="achievement-footer">
                    <small className="mb-muted">
                      Equipped: {equippedBadges.length}/{maxEquippedBadges}
                    </small>
                    <button
                      type="button"
                      className="btn btn-outline-light btn-sm"
                      disabled={savingBadges}
                      onClick={saveEquippedBadges}
                    >
                      {savingBadges ? 'Saving...' : 'Save badge decoration'}
                    </button>
                  </div>
                </>
              )}
            </div>

             
            <div className="profile-navigation mb-4">
              <h5 className="mb-3">Your Activity</h5>
              <div className="d-flex flex-wrap gap-3">
                <Link to="/watchlist" className="btn btn-outline-success btn-sm">
                  📺 View Watchlist
                </Link>
                <Link to="/profile/reviews" className="btn btn-outline-primary btn-sm">
                  ⭐ My Reviews
                </Link>
                <Link to="/profile/discussions" className="btn btn-outline-info btn-sm">
                  💬 Discussion History
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
