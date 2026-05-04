import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import NavBar from './navbar';
import { API_BASE_URL } from '../utils/apiBase';

function Test() {
   // API_BASE_URL is imported in case it's needed later
   return (
      <>
         <NavBar />
         {/* Add page content here; Link is available if needed */}
      </>
   );
};

export default Test;
