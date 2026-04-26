import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import MediaDetail from './pages/Media';
import Top100Page from './pages/Top100';
import AddMediaForm from './pages/addmedia';
import SearchResults from './pages/SearchResults';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile.jsx';
import WatchlistPage from './pages/Watchlist';
import UserReviews from './pages/UserReviews';
import UserDiscussions from './pages/UserDiscussions';
import AdminRequests from './pages/AdminRequests';
import CategoryPage from './pages/CategoryPage';
import TasteMatches from './pages/TasteMatches';
import SiteAssistant from './components/SiteAssistant';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Routes>
            <Route path="/" element={<AuthPage />} />
            <Route path="/home" element={<HomePage />} />
            <Route path="/media/:id" element={<MediaDetail />} />
            <Route path="/top100" element={<Top100Page />} />
            <Route path="/addmedia" element={<AddMediaForm />} />
            <Route path="/search" element={<SearchResults />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/reviews" element={<UserReviews />} />
            <Route path="/profile/discussions" element={<UserDiscussions />} />
            <Route path="/find-users" element={<TasteMatches />} />
            <Route path="/profile/matches" element={<TasteMatches />} />
            <Route path="/admin/requests" element={<AdminRequests />} />
            <Route path="/users/:id" element={<UserProfile />} />
            <Route path="/watchlist" element={<WatchlistPage />} />
            <Route path="/users/:id/watchlist" element={<WatchlistPage />} />
            <Route path="/users/:id/reviews" element={<UserReviews />} />
            <Route path="/users/:id/discussions" element={<UserDiscussions />} />
            <Route path="/categories/:categoryKey" element={<CategoryPage />} />
          </Routes>
        </header>
        <SiteAssistant />
      </div>
    </Router>
  );
}

export default App;
