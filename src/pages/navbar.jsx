import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";
import '../components/navbar.css';
import { API_BASE_URL } from '../utils/apiBase';


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
  const [scrapeStatus, setScrapeStatus] = useState('');
  const [lastRunId, setLastRunId] = useState(() => {
    try { return localStorage.getItem('lastScrapeRunId') || ''; } catch (e) { return ''; }
  });
  const [showScrapeLog, setShowScrapeLog] = useState(false);
  const [scrapeLogs, setScrapeLogs] = useState([]);
  const [eventSource, setEventSource] = useState(null);
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
               Watchlists
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

        <Link className="find-users-button-professional me-3" to="/find-users">
          Find Users
        </Link>
        {isAdmin && (
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginRight: 6 }}>
            <button
              title="Run scraper"
              onClick={async () => {
                const token = localStorage.getItem('token');
                if (!token) return alert('Not authenticated');
                setScrapeStatus('Starting...');
                // open log modal and start SSE
                setShowScrapeLog(true);
                setScrapeLogs([]);
                try {
                  const es = new EventSource(`${API_BASE_URL}/admin/scrape/events?token=${encodeURIComponent(token)}`);
                  es.onmessage = (ev) => {
                    try {
                      const payload = JSON.parse(ev.data);
                      setScrapeLogs((prev) => [...prev, payload]);
                    } catch (e) {}
                  };
                  es.onerror = () => {
                    // keep modal open; errors will be reflected in logs
                  };
                  setEventSource(es);
                } catch (e) {
                  console.error('SSE error', e);
                }
                try {
                  const res = await fetch(`${API_BASE_URL}/admin/scrape`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ limit: 100 }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setScrapeStatus('Started');
                    if (data.runId) {
                      setLastRunId(data.runId);
                      try { localStorage.setItem('lastScrapeRunId', data.runId); } catch (e) {}
                    }
                  } else {
                    setScrapeStatus(data.error || 'Failed');
                  }
                } catch (err) {
                  console.error(err);
                  setScrapeStatus('Error');
                }
                setTimeout(() => setScrapeStatus(''), 4000);
              }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                background: '#f6c23e',
                border: 'none',
                color: '#000',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              +
            </button>

            <button
              title="Revert last scrape"
              onClick={async () => {
                const token = localStorage.getItem('token');
                if (!token) return alert('Not authenticated');
                const runId = lastRunId || '';
                if (!runId) return alert('No runId available to revert');
                setScrapeStatus('Reverting...');
                try {
                  const res = await fetch(`${API_BASE_URL}/admin/revert`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({ runId }),
                  });
                  const data = await res.json();
                  if (res.ok) {
                    setScrapeStatus(data.message || 'Reverted');
                    setLastRunId('');
                    try { localStorage.removeItem('lastScrapeRunId'); } catch (e) {}
                  } else {
                    setScrapeStatus(data.error || 'Failed');
                  }
                } catch (err) {
                  console.error(err);
                  setScrapeStatus('Error');
                }
                setTimeout(() => setScrapeStatus(''), 4000);
              }}
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                background: '#e74a3b',
                border: 'none',
                color: '#fff',
                fontWeight: '700',
                cursor: 'pointer'
              }}
            >
              −
            </button>
            {scrapeStatus && <small style={{ marginLeft: 6 }}>{scrapeStatus}</small>}
          </div>
        )}

        {showScrapeLog && (
          <div className="scrape-log-modal-overlay" style={{position:'fixed',left:0,top:0,right:0,bottom:0,background:'rgba(0,0,0,0.6)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999}}>
            <div style={{width:'min(800px,95%)',maxHeight:'70vh',background:'#0f0f10',color:'#fff',borderRadius:8,padding:12,overflow:'auto'}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                <strong>Scrape logs</strong>
                <div>
                  <button className="btn btn-sm btn-secondary" onClick={() => {
                    if (eventSource) { eventSource.close(); setEventSource(null); }
                    setShowScrapeLog(false);
                  }}>Close</button>
                </div>
              </div>
              <div style={{fontSize:13,lineHeight:1.4}}>
                {scrapeLogs.length === 0 ? <div style={{opacity:0.7}}>Waiting for logs...</div> : scrapeLogs.map((l, idx) => (
                  <div key={idx} style={{padding:'6px 0',borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                    <div style={{fontSize:12,opacity:0.75}}>{l.type}{l.page ? ` • page ${l.page}` : ''}{l.runId ? ` • run ${l.runId}` : ''}</div>
                    <div>{l.type === 'saved' ? `Saved: ${l.title}` : l.type === 'skipped' ? `Skipped: ${l.title}` : l.type === 'error' ? `Error (${l.message})` : JSON.stringify(l)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      
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
