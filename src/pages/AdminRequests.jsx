import React, { useEffect, useState } from 'react';
import { jwtDecode } from "jwt-decode";
import NavBar from './navbar';
import './Profile.css';

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

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

    if (isAdmin) {
      fetchRequests();
    } else {
      setLoading(false);
    }
  }, [isAdmin]);

  const fetchRequests = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/media/requests', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setRequests(data);
      }
    } catch (err) {
      console.error('Error fetching requests:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (requestId, action, adminNotes = '') => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`http://localhost:5000/media/requests/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ adminNotes })
      });

      if (res.ok) {
        alert(`Request ${action}d successfully!`);
        fetchRequests(); // Refresh the list
      } else {
        alert('Failed to process request');
      }
    } catch (err) {
      console.error('Error processing request:', err);
      alert('Error processing request');
    }
  };

  if (loading) {
    return (
      <>
        <NavBar />
        <div className="homepage-dark" style={{ minHeight: '100vh' }}>
          <div className="container py-4">
            <p>Loading requests...</p>
          </div>
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return (
      <>
        <NavBar />
        <div className="homepage-dark" style={{ minHeight: '100vh' }}>
          <div className="container py-4">
            <h2>Access Denied</h2>
            <p>You need admin privileges to access this page.</p>
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
          <h2>Media Requests</h2>
          <p className="text-muted mb-4">Review and approve media requests from users</p>

          {requests.length === 0 ? (
            <div className="text-center py-5">
              <h4>No pending requests</h4>
              <p className="text-muted">All caught up! No media requests to review.</p>
            </div>
          ) : (
            <div className="row">
              {requests.map((request) => (
                <div key={request._id} className="col-12 mb-4">
                  <div className={`card ${request.status === 'pending' ? 'border-warning' : 
                    request.status === 'approved' ? 'border-success' : 'border-danger'}`}>
                    <div className="card-body">
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 className="card-title">{request.title}</h5>
                          <span className={`badge ${
                            request.status === 'pending' ? 'bg-warning' :
                            request.status === 'approved' ? 'bg-success' : 'bg-danger'
                          }`}>
                            {request.status.toUpperCase()}
                          </span>
                        </div>
                        <small className="text-muted">
                          Requested by: {request.requestedBy?.username || 'Unknown'}
                        </small>
                      </div>

                      <div className="row">
                        <div className="col-md-8">
                          <p><strong>Type:</strong> {request.media}</p>
                          <p><strong>Genre:</strong> {request.genre}</p>
                          <p><strong>Director:</strong> {request.director}</p>
                          <p><strong>Release Date:</strong> {new Date(request.release_date).toLocaleDateString()}</p>
                          <p><strong>Description:</strong> {request.description}</p>
                        </div>
                        <div className="col-md-4">
                          {request.poster && (
                            <img 
                              src={request.poster} 
                              alt={request.title}
                              className="img-fluid rounded"
                              style={{ maxHeight: '200px' }}
                              onError={(e) => {e.target.style.display = 'none'}}
                            />
                          )}
                        </div>
                      </div>

                      {request.status === 'pending' && (
                        <div className="mt-3 d-flex gap-2">
                          <button 
                            onClick={() => handleRequest(request._id, 'approve')}
                            className="btn btn-success btn-sm"
                          >
                            ✅ Approve
                          </button>
                          <button 
                            onClick={() => {
                              const notes = prompt('Rejection reason (optional):');
                              if (notes !== null) {
                                handleRequest(request._id, 'reject', notes);
                              }
                            }}
                            className="btn btn-danger btn-sm"
                          >
                            ❌ Reject
                          </button>
                        </div>
                      )}

                      {request.adminNotes && (
                        <div className="mt-3">
                          <small className="text-muted">
                            <strong>Admin Notes:</strong> {request.adminNotes}
                          </small>
                        </div>
                      )}

                      <div className="mt-2">
                        <small className="text-muted">
                          Submitted: {new Date(request.createdAt).toLocaleString()}
                          {request.reviewedAt && (
                            <span> • Reviewed: {new Date(request.reviewedAt).toLocaleString()}</span>
                          )}
                        </small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
