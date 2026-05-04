import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import NavBar from './navbar';
import { API_BASE_URL } from '../utils/apiBase';

function Test() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch(`${API_BASE_URL}/media`)
      .then((res) => {
         if (!res.ok) throw new Error('Fetch failed'); 
         return res.json(); 
      })
      .then((data) => {      setMedia(data);
        setLoading(false);})
      .catch((err) => {
        console.error('Error fetching media:', err);
        setLoading(false);
      });
  }, []);

  // API_BASE_URL is imported in case it's needed later
  return (
    <>
      <div className="homepage-dark catalog-homepage">
      <NavBar />
      
      {<div className= "catalog-container">
         <div className="category-grid">
         <h2> Media </h2>
         {media.map((item) => (
            <article className="catalog-card" key={item._id}>
            <img 
               
               alt = {item.title}
               src = {item.poster}
               className = "card-img-top"
               style={{ height: 180, objectFit: 'cover' }}
               />
                          <div className="card-body">
                           <div className="catalog-card-body">
                  <h5 className="catalog-card-title">{item.title}</h5>
                  <p className="card-text">{item.genre}</p>
                  </div>
                </div> 
                </article>    
 
               
         ))}
         </div>
      </div>}
      
      </div>

    </>
  );
}

export default Test;

