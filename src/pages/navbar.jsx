import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import '../components/navbar.css';

const GENRE_ORDER = [
  'Horror',
  'Thriller',
  'Drama',
  'Romance',
  'Comedy',
  'Slice of Life',
  'Sci-Fi',
  'Action',
  'Fantasy',
];

const RECOMMENDATION_QUESTIONS = [
  {
    title: 'What kind of story do you prefer?',
    options: [
      { key: 'A', text: 'Something scary and intense', points: { Horror: 3, Thriller: 1 } },
      { key: 'B', text: 'Emotional and heart-touching', points: { Drama: 3, Romance: 2 } },
      { key: 'C', text: 'Funny and light-hearted', points: { Comedy: 2, 'Slice of Life': 1 } },
      { key: 'D', text: 'Slow burn', points: { 'Slice of Life': 3 } },
    ],
  },
  {
    title: 'Which setting sounds most interesting?',
    options: [
      { key: 'A', text: 'High school life', points: { Romance: 3, 'Slice of Life': 2 } },
      { key: 'B', text: 'Post-apocalyptic world', points: { 'Sci-Fi': 3, Action: 2 } },
      { key: 'C', text: 'Haunted house', points: { Horror: 3 } },
      { key: 'D', text: 'Medieval fantasy kingdom', points: { Fantasy: 3, Drama: 1 } },
    ],
  },
  {
    title: 'What kind of conflict interests you?',
    options: [
      { key: 'A', text: 'Romantic misunderstandings', points: { Romance: 3 } },
      { key: 'B', text: 'Big battles', points: { Action: 3 } },
      { key: 'C', text: 'Psychological mind games', points: { Thriller: 3 } },
      { key: 'D', text: 'Supernatural curse', points: { Horror: 3, Fantasy: 2 } },
      { key: 'E', text: 'Daily life struggles', points: { Drama: 3, 'Slice of Life': 2 } },
    ],
  },
  {
    title: 'What visuals attract you most?',
    options: [
      { key: 'A', text: 'Dark and creepy atmosphere', points: { Horror: 3 } },
      { key: 'C', text: 'Modern setting', points: { Drama: 3 } },
      { key: 'D', text: 'Futuristic technology', points: { 'Sci-Fi': 3 } },
      { key: 'E', text: 'School festival', points: { Romance: 3, Comedy: 2 } },
    ],
  },
];

function getInitialScores() {
  return GENRE_ORDER.reduce((acc, genre) => {
    acc[genre] = 0;
    return acc;
  }, {});
}

function getTopGenre(scores) {
  let bestGenre = GENRE_ORDER[0];
  let bestScore = Number.NEGATIVE_INFINITY;
  for (const genre of GENRE_ORDER) {
    const score = typeof scores[genre] === 'number' ? scores[genre] : 0;
    if (score > bestScore) {
      bestScore = score;
      bestGenre = genre;
    }
  }
  return bestGenre;
}

function NavBar() {
  const username = localStorage.getItem('username');
  const [search, setSearch] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [recommendationStep, setRecommendationStep] = useState(0);
  const [recommendationScores, setRecommendationScores] = useState(getInitialScores);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is admin
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsAdmin(decoded.isAdmin || false);
      } catch (e) {
        setIsAdmin(false);
      }
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault(); 
    const q = search.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
    setSearch('');
  };

  const handleLogout = () => {
    
    localStorage.clear();
    sessionStorage.clear();
    
  };

  const openRecommendation = () => {
    setRecommendationScores(getInitialScores());
    setRecommendationStep(0);
    setIsRecommendationOpen(true);
  };

  const closeRecommendation = () => {
    setIsRecommendationOpen(false);
    setRecommendationStep(0);
    setRecommendationScores(getInitialScores());
  };

  const handleRecommendationAnswer = (option) => {
    const nextScores = { ...recommendationScores };
    for (const [genre, points] of Object.entries(option.points || {})) {
      nextScores[genre] = (nextScores[genre] || 0) + points;
    }

    const isLast = recommendationStep >= RECOMMENDATION_QUESTIONS.length - 1;
    if (isLast) {
      const topGenre = getTopGenre(nextScores);
      setRecommendationScores(nextScores);
      setIsRecommendationOpen(false);
      setRecommendationStep(0);
      navigate(`/search?genre=${encodeURIComponent(topGenre)}`);
      return;
    }

    setRecommendationScores(nextScores);
    setRecommendationStep((prev) => prev + 1);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark px-4 py-2 professional-navbar">
      <div className="container-fluid">
        
        <Link className="navbar-brand navbar-brand-professional" to="/home">
          🎬 VoidRift
        </Link>

       
        <ul className="navbar-nav me-auto mb-0" style={{ gap: '0.5rem' }}>
          <li className="nav-item">
            <Link className="nav-link nav-link-professional" to="/home">
               Home
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link nav-link-professional" to="/top100">
               Top 100
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link nav-link-professional" to="/addmedia">
               Add Media
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link nav-link-professional" to="/profile">
               Dashboard
            </Link>
          </li>
          <li className="nav-item">
            <Link className="nav-link nav-link-professional" to="/watchlist">
               Watchlist
            </Link>
          </li>
          {isAdmin && (
            <li className="nav-item">
              <Link className="nav-link nav-link-professional" to="/admin/requests">
                 Requests
              </Link>
            </li>
          )}

          <li className="nav-item">
            <button
              type="button"
              className="nav-link nav-link-professional recommendation-link-professional"
              onClick={openRecommendation}
            >
              Recommendation
            </button>
          </li>
        </ul>

      
        <form className="d-flex me-3 search-container-professional" onSubmit={handleSearch}>
          <div className="input-group">
            <input
              className="form-control search-input-professional"
              type="search"
              placeholder="Search"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="btn search-button-professional" type="submit">
                 Search 
            </button>
          </div>
        </form>

      
        <div className="d-flex align-items-center" style={{ gap: '12px' }}>
          <div className="user-section-professional">
            Welcome,
            <Link className="username-link-professional" to="/profile">
              {username || "Guest"}
            </Link>
          </div>
          <Link className="logout-button-professional" to="/" onClick={handleLogout}>
            Logout
          </Link>
        </div>
      </div>

      {isRecommendationOpen && (
        <div className="recommendation-modal-overlay" role="dialog" aria-modal="true">
          <div className="recommendation-modal">
            <div className="recommendation-modal-header">
              <h3 className="recommendation-modal-title">
                {RECOMMENDATION_QUESTIONS[recommendationStep]?.title}
              </h3>
              <button
                type="button"
                className="recommendation-close-button"
                onClick={closeRecommendation}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="recommendation-modal-body">
              <div className="recommendation-step">
                Question {recommendationStep + 1} of {RECOMMENDATION_QUESTIONS.length}
              </div>
              <div className="recommendation-options">
                {(RECOMMENDATION_QUESTIONS[recommendationStep]?.options || []).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    className="recommendation-option-button"
                    onClick={() => handleRecommendationAnswer(opt)}
                  >
                    <span className="recommendation-option-key">{opt.key})</span>
                    <span className="recommendation-option-text">{opt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavBar;
