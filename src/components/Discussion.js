import React, { useState, useEffect, useCallback } from 'react';
import './Discussion.css';

function Discussion({ mediaId, isOpen, onClose }) {
  const [discussions, setDiscussions] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editMessage, setEditMessage] = useState('');

  const fetchDiscussions = useCallback(async () => {
    if (!mediaId) return;
    
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/media/${mediaId}/discussions`);
      if (res.ok) {
        const data = await res.json();
        setDiscussions(data);
      }
    } catch (err) {
      console.error('Error fetching discussions:', err);
    } finally {
      setLoading(false);
    }
  }, [mediaId]);

  useEffect(() => {
    if (isOpen) {
      fetchDiscussions();
    }
  }, [isOpen, fetchDiscussions]);

  const submitMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to participate in discussions');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`http://localhost:5000/media/${mediaId}/discussions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: newMessage }),
      });

      if (res.ok) {
        const newDiscussion = await res.json();
        setDiscussions(prev => [...prev, newDiscussion]);
        setNewMessage('');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to post message');
      }
    } catch (err) {
      console.error('Error posting message:', err);
      alert('Failed to post message');
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (discussion) => {
    setEditingId(discussion._id);
    setEditMessage(discussion.message);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditMessage('');
  };

  const saveEdit = async (discussionId) => {
    if (!editMessage.trim()) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/media/discussions/${discussionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: editMessage }),
      });

      if (res.ok) {
        const updatedDiscussion = await res.json();
        setDiscussions(prev => 
          prev.map(d => d._id === discussionId ? updatedDiscussion : d)
        );
        setEditingId(null);
        setEditMessage('');
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to edit message');
      }
    } catch (err) {
      console.error('Error editing message:', err);
      alert('Failed to edit message');
    }
  };

  const deleteMessage = async (discussionId) => {
    if (!window.confirm('Are you sure you want to delete this message?')) return;

    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/media/discussions/${discussionId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDiscussions(prev => prev.filter(d => d._id !== discussionId));
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete message');
      }
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Failed to delete message');
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const currentUserId = localStorage.getItem('userId');

  if (!isOpen) return null;

  return (
    <div className="discussion-overlay">
      <div className="discussion-modal">
        <div className="discussion-header">
          <h3>💬 Discussion Forum</h3>
          <button onClick={onClose} className="close-btn">✕</button>
        </div>
        
        <div className="discussion-content">
          {loading ? (
            <div className="loading">Loading discussions...</div>
          ) : (
            <div className="messages-container">
              {discussions.length === 0 ? (
                <div className="no-messages">
                  <p>No discussions yet. Start a conversation!</p>
                </div>
              ) : (
                discussions.map((discussion) => (
                  <div key={discussion._id} className="message-item">
                    <div className="message-header">
                      <div className="user-info">
                        <span className="username">{discussion.user.username}</span>
                        <span className="timestamp">
                          {formatTime(discussion.createdAt)}
                          {discussion.isEdited && <span className="edited"> (edited)</span>}
                        </span>
                      </div>
                      
                      {String(discussion.user._id) === String(currentUserId) && (
                        <div className="message-actions">
                          <button onClick={() => startEdit(discussion)} className="edit-btn">
                            Edit
                          </button>
                          <button onClick={() => deleteMessage(discussion._id)} className="delete-btn">
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="message-content">
                      {editingId === discussion._id ? (
                        <div className="edit-form">
                          <textarea
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                            maxLength="500"
                            rows="2"
                          />
                          <div className="edit-actions">
                            <button onClick={() => saveEdit(discussion._id)} className="save-btn">
                              Save
                            </button>
                            <button onClick={cancelEdit} className="cancel-btn">
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <p className="message-text">{discussion.message}</p>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <form onSubmit={submitMessage} className="message-form">
          <div className="input-container">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              maxLength="500"
              rows="2"
              disabled={submitting}
            />
            <div className="form-footer">
              <span className="char-count">{newMessage.length}/500</span>
              <button type="submit" disabled={submitting || !newMessage.trim()}>
                {submitting ? 'Sending...' : 'Send'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default Discussion;
