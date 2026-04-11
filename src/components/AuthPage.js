import React from 'react';
import LoginForm from '../components/Login';
import SignupForm from '../components/SignupForm';


function AuthPage() {
  return (
    <div style={{ maxWidth: 400, margin: '0 auto', padding: 20 }}>
      
      <h2>Login</h2>
      <LoginForm />
      <hr style={{ margin: '2rem 0' }} />
      <h3>Or Sign Up</h3>
      <SignupForm />
    </div>
  );
}

export default AuthPage;