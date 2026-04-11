import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import NavBar from './navbar';
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

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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