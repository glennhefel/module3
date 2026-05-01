import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import NavBar from './navbar';
import './Profile.css';
import { API_BASE_URL } from '../utils/apiBase';

const DEFAULT_AVATAR = '/logo192.png';

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

export default function TasteMatches() {
  const token = localStorage.getItem('token');
  const decoded = safeDecodeToken(token);
  const currentUserId = decoded?.id || decoded?._id || localStorage.getItem('userId') || '';
  const [matches, setMatches] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingChat, setLoadingChat] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [messageInput, setMessageInput] = useState('');
  const [chatError, setChatError] = useState('');

  const selectedMatch = useMemo(
    () => matches.find((match) => String(match.user?._id) === String(selectedUserId)) || null,
    [matches, selectedUserId]
  );

  useEffect(() => {
    const fetchMatches = async () => {
      if (!token) {
        setLoadingMatches(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE_URL}/users/me/taste-matches`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data.matches) ? data.matches : [];
        setMatches(list);
        if (list.length > 0) setSelectedUserId(String(list[0].user._id));
      } catch (err) {
        console.error('Failed to fetch taste matches:', err);
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchMatches();
  }, [token]);

  useEffect(() => {
    const fetchConversation = async () => {
      if (!token || !selectedUserId) return;
      setLoadingChat(true);
      setChatError('');
      try {
        const res = await fetch(`${API_BASE_URL}/users/me/dms/${selectedUserId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP ${res.status}: ${errorText}`);
        }
        const data = await res.json();
        setChatMessages(Array.isArray(data.conversation?.messages) ? data.conversation.messages : []);
      } catch (err) {
        console.error('Failed to fetch conversation:', err);
        setChatMessages([]);
        setChatError('Could not load this conversation right now.');
      } finally {
        setLoadingChat(false);
      }
    };

    fetchConversation();
  }, [selectedUserId, token]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!selectedUserId || !messageInput.trim() || !token) return;

    setSendingMessage(true);
    setChatError('');
    try {
      const res = await fetch(`${API_BASE_URL}/users/me/dms/${selectedUserId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: messageInput.trim() }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errorText}`);
      }

      const data = await res.json();
      const nextMessages = Array.isArray(data.conversation?.messages) ? data.conversation.messages : [];
      setChatMessages(nextMessages);
      setMessageInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setChatError('Could not send the message. Please try again.');
    } finally {
      setSendingMessage(false);
    }
  };

  if (!token) {
    return (
      <>
        <NavBar />
        <div className="homepage-dark" style={{ minHeight: '100vh' }}>
          <div className="container py-4">
            <p>Please log in to view your taste matches.</p>
            <Link to="/" className="btn btn-sm btn-primary">Login</Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="homepage-dark" style={{ minHeight: '100vh' }}>
        <div className="container py-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2>Find Users</h2>
            <Link to="/home" className="btn btn-outline-secondary btn-sm">
              ← Back to Home
            </Link>
          </div>

          {loadingMatches ? (
            <p>Finding users with similar taste...</p>
          ) : matches.length === 0 ? (
            <div className="text-center py-5">
              <h4>No close taste matches yet</h4>
              <p className="text-muted">Rate more media and update your favorite genres to improve matching.</p>
            </div>
          ) : (
            <div className="taste-match-layout">
              <div className="taste-match-list">
                {matches.map((match) => (
                  <button
                    key={match.user._id}
                    type="button"
                    className={`taste-match-card ${String(selectedUserId) === String(match.user._id) ? 'active' : ''}`}
                    onClick={() => setSelectedUserId(String(match.user._id))}
                  >
                    <div className="taste-match-card-header">
                      <img
                        src={match.user.avatar || DEFAULT_AVATAR}
                        alt={match.user.username}
                        className="taste-match-avatar"
                      />
                      <div className="taste-match-user-info">
                        <h6 className="mb-0">{match.user.username}</h6>
                        <span className="taste-match-score">{match.matchScore}% match</span>
                      </div>
                    </div>

                    {match.user.favoriteQuote ? (
                      <p className="taste-match-quote">"{match.user.favoriteQuote}"</p>
                    ) : null}

                    {Array.isArray(match.commonGenres) && match.commonGenres.length > 0 ? (
                      <div className="taste-common-genres">
                        {match.commonGenres.map((genre) => (
                          <span key={`${match.user._id}-${genre}`} className="profile-genre-pill">
                            {genre}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </button>
                ))}
              </div>

              <div className="taste-match-chat">
                {selectedMatch ? (
                  <>
                    <div className="taste-chat-header">
                      <div className="d-flex align-items-center gap-2">
                        <img
                          src={selectedMatch.user.avatar || DEFAULT_AVATAR}
                          alt={selectedMatch.user.username}
                          className="taste-chat-avatar"
                        />
                        <div>
                          <h5 className="mb-0">{selectedMatch.user.username}</h5>
                          <small className="text-muted">{selectedMatch.matchScore}% taste compatibility</small>
                        </div>
                      </div>
                      <Link to={`/users/${selectedMatch.user._id}`} className="btn btn-outline-info btn-sm">
                        View Profile
                      </Link>
                    </div>

                    <div className="taste-chat-body">
                      {loadingChat ? (
                        <p>Loading conversation...</p>
                      ) : chatMessages.length === 0 ? (
                        <p className="text-muted">No messages yet. Say hi and start chatting.</p>
                      ) : (
                        chatMessages.map((message) => {
                          const senderId = String(message?.sender?._id || message?.sender || '');
                          const isMine = senderId === String(currentUserId);
                          return (
                            <div
                              key={message._id}
                              className={`taste-message-row ${isMine ? 'mine' : 'other'}`}
                            >
                              <div className="taste-message-bubble">
                                <div className="taste-message-text">{message.text}</div>
                                <div className="taste-message-time">
                                  {new Date(message.createdAt).toLocaleString()}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <form className="taste-chat-form" onSubmit={sendMessage}>
                      <input
                        type="text"
                        className="form-control"
                        placeholder={`Message ${selectedMatch.user.username}...`}
                        value={messageInput}
                        maxLength={500}
                        onChange={(e) => setMessageInput(e.target.value)}
                        disabled={sendingMessage}
                      />
                      <button
                        type="submit"
                        className="btn btn-outline-primary"
                        disabled={sendingMessage || !messageInput.trim()}
                      >
                        {sendingMessage ? 'Sending...' : 'Send'}
                      </button>
                    </form>

                    {chatError ? <div className="taste-chat-error">{chatError}</div> : null}
                  </>
                ) : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

