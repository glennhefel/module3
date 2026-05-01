import React, { useEffect, useState } from 'react';
import { jwtDecode } from 'jwt-decode';
import NavBar from './navbar';
import './addmedia.css';
import { API_BASE_URL } from '../utils/apiBase';

function AddMediaForm() {
  const [form, setForm] = useState({
    title: '',
    release_date: '',
    media: '',
    genre: '',
    director: '',
    description: '',
    poster: '',
    trailerUrl: '',
    spotifyUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setIsAdmin(false);
      return;
    }

    try {
      const decoded = jwtDecode(token);
      setIsAdmin(Boolean(decoded?.isAdmin));
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to add media');
      setLoading(false);
      return;
    }

    try {
      const endpoint = isAdmin
        ? `${API_BASE_URL}/media/add`
        : `${API_BASE_URL}/media/request`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
            body: JSON.stringify(form),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        throw new Error(errorData?.error || errorData?.message || 'Failed to submit request');
      }

      alert(
        isAdmin
          ? 'Media added successfully!'
          : 'Media request submitted! An admin will review it shortly.'
      );

      setForm({
        title: '',
        release_date: '',
        media: '',
        genre: '',
        director: '',
        description: '',
        poster: '',
        trailerUrl: '',
        spotifyUrl: '',
      });
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <NavBar />
      <div className="add-media-page">
        <div className="container py-4">
          <div className="add-media-container">
            <div className="add-media-header">
              <h1 className="header-title">
                {isAdmin ? 'Add New Media' : 'Request New Media'}
              </h1>
              <p className="header-subtitle">
                {isAdmin
                  ? 'Add content directly to the database'
                  : 'Submit a request for admin approval'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="add-media-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input
                    name="title"
                    placeholder="Enter media title"
                    value={form.title}
                    onChange={handleChange}
                    required
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Release Date *</label>
                  <input
                    name="release_date"
                    type="date"
                    value={form.release_date}
                    onChange={handleChange}
                    required
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Media Type *</label>
                  <select
                    name="media"
                    value={form.media}
                    onChange={handleChange}
                    required
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="">Select media type</option>
                    <option value="Anime">Anime</option>
                    <option value="Movies">Movies</option>
                    <option value="TV_series">TV Series</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Genre *</label>
                  <select
                    name="genre"
                    value={form.genre}
                    onChange={handleChange}
                    required
                    className="form-input"
                    disabled={loading}
                  >
                    <option value="">Select genre</option>
                    <option value="Action">Action</option>
                    <option value="Psychological">Psychological</option>
                    <option value="Comedy">Comedy</option>
                    <option value="Romance">Romance</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Cyberpunk">Cyberpunk</option>
                    <option value="Drama">Drama</option>
                    <option value="Fantasy">Fantasy</option>
                    <option value="Adventure">Adventure</option>
                    <option value="Mystery">Mystery</option>
                    <option value="Horror">Horror</option>
                    <option value="Thriller">Thriller</option>
                    <option value="Slice of Life">Slice of Life</option>
                    <option value="Supernatural">Supernatural</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Director *</label>
                  <input
                    name="director"
                    placeholder="Enter director name"
                    value={form.director}
                    onChange={handleChange}
                    required
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Poster URL</label>
                  <input
                    name="poster"
                    placeholder="Enter poster image URL"
                    value={form.poster}
                    onChange={handleChange}
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Trailer URL (YouTube)</label>
                  <input
                    name="trailerUrl"
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={form.trailerUrl}
                    onChange={handleChange}
                    className="form-input"
                    disabled={loading}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Spotify Track URL</label>
                  <input
                    name="spotifyUrl"
                    type="url"
                    placeholder="https://open.spotify.com/track/..."
                    value={form.spotifyUrl}
                    onChange={handleChange}
                    className="form-input"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group-full">
                <label className="form-label">Description</label>
                <textarea
                  name="description"
                  placeholder="Enter a brief description..."
                  value={form.description}
                  onChange={handleChange}
                  className="form-textarea"
                  rows="3"
                  disabled={loading}
                />
              </div>

              <div className="form-submit">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      {isAdmin ? 'Adding...' : 'Submitting...'}
                    </>
                  ) : (
                    <>
                      <span className="btn-icon"></span>
                      {isAdmin ? 'Add Media' : 'Submit Request'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default AddMediaForm;
