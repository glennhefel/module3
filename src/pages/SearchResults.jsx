import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import NavBar from './navbar';

function matchesGenre(itemGenre, selectedGenre) {
  return String(itemGenre || '').trim().toLowerCase() === String(selectedGenre || '').trim().toLowerCase();
}

export default function SearchResults() {
  const searchParams = new URLSearchParams(useLocation().search);
  const query = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalMedia, setTotalMedia] = useState(null);

  const checkTotalMedia = () => {
    fetch('http://localhost:5000/media/')
      .then(res => res.json())
      .then(data => {
        
        setTotalMedia(data.length);
      })
      .catch(err => console.error('Error fetching total media:', err));
  };

  useEffect(() => {
    if (!query && !genre) {
      setResults([]);
      return;
    }

    setLoading(true);

    const requestUrl = genre
      ? `http://localhost:5000/media?genre=${encodeURIComponent(genre)}`
      : `http://localhost:5000/media/search?q=${encodeURIComponent(query)}`;

    fetch(requestUrl)
      .then((res) => {
        return res.ok ? res.json() : Promise.reject(res);
      })
      .then((data) => {
        let normalizedResults = [];

        if (Array.isArray(data)) normalizedResults = data;
        else if (Array.isArray(data.results)) normalizedResults = data.results;
        else if (data && (data._id || data.id)) normalizedResults = [data];

        if (genre) {
          normalizedResults = normalizedResults.filter((item) => matchesGenre(item.genre, genre));
        }

        setResults(normalizedResults);
      })
      .catch((err) => {
        console.error('Search error:', err);
        setResults([]);
      })
      .finally(() => setLoading(false));
  }, [query, genre]);

  if (!query && !genre) return (
    <>
      <NavBar />
      <div className="container mt-4">
        <p>Type a query in the search box.</p>
        <button onClick={checkTotalMedia} className="btn btn-info btn-sm">
          Check If Anything Exists
        </button>
        {totalMedia !== null && <p>Yes, in fact there are {totalMedia} things in here</p>}
      </div>
    </>
  );
  
  if (loading) return (
    <>
      <NavBar />
      <div className="container mt-4">Loading...</div>
    </>
  );
  
  if (!results || results.length === 0) return (
    <>
      <NavBar />
      <div className="container mt-4">
        <p>
          {genre ? 'No recommendations found right now.' : `No results for "${query}".`}
        </p>
        <button onClick={checkTotalMedia} className="btn btn-info btn-sm">
         Check If Anything Exists
        </button>
        {totalMedia !== null && <p>Yes, in fact there are {totalMedia} things in here</p>}
      </div>
    </>
  );

  return (
    <>
      <NavBar />
      <div className="container mt-4">
        <h3 style={{ marginBottom: '24px' }}>
          {genre ? 'Recommended for you' : `Results for "${query}"`}
        </h3>
        <div className="row g-3">
          {results.map((item) => (
            <div key={item._id || item.id} className="col-md-4">
              <div className="card bg-dark text-light">
                <img src={item.poster} alt={item.title} style={{ height: 180, objectFit: 'cover' }} className="card-img-top" />
                <div className="card-body">
                  <h5 className="card-title">{item.title}</h5>
                  <Link to={`/media/${item._id || item.id}`} className="btn btn-sm btn-outline-primary">View</Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}