import React, { useState } from 'react';
import LoginForm from '../components/Login';
import SignupForm from '../components/SignupForm';

function AuthPage() {
  const [showSignup, setShowSignup] = useState(false);

  return (
    <div className="homepage-dark" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ maxWidth: 400, width: '100%', background: 'rgba(30,30,47,0.97)', borderRadius: 12, boxShadow: '0 4px 24px #0008', padding: 32, marginTop: 40 }}>
        <h1 style={{ textAlign: 'center', marginBottom: 30, color: '#ffc107', letterSpacing: 1 }}>Welcome to Media Hub</h1>
        {!showSignup ? (
          <>
            <h2 style={{ textAlign: 'center', color: '#f8f9fa' }}>Login</h2>
            <LoginForm />
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => setShowSignup(true)}
                className="btn btn-outline-primary btn-sm mb-3 px-3 py-2 rounded"
                style={{ marginLeft: 8 }}
              >
                Sign up
              </button>
            </p>
          </>
        ) : (
          <>
            <h2 style={{ textAlign: 'center', color: '#f8f9fa' }}>Sign Up</h2>
            <SignupForm />
            <p style={{ marginTop: '1rem', textAlign: 'center' }}>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => setShowSignup(false)}
                className="btn btn-outline-primary btn-sm mb-3 px-3 py-2 rounded"
                style={{ marginLeft: 8 }}
              >
                Log in
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default AuthPage;