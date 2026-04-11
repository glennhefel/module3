import React, { useState } from 'react';
import InputField from './InputField';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function LoginForm() {
  const [form, setForm] = useState({ username: '', password: '' });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.post('http://localhost:5000/users/login', {
        username: form.username,
        password: form.password,
      });
      const user = res.data.user;
      console.log('Login Response:', res.data);
      console.log('User Object:', res.data.user);
      
      alert('Login successful!');
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('username', form.username || form.name);
      localStorage.setItem('email', user.email);
      localStorage.setItem('userId', user._id);
      

      
     
      navigate('/home');
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  const handleProceed = (e) => {
    e.preventDefault();
    navigate('/home');
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputField
        label="Username"
        type="text"
        name="username"
        placeholder="Type your Username"
        value={form.username}
        onChange={handleChange}
        required
      />
      <InputField
        label="Password"
        type="password"
        name="password"
        placeholder="Type your Password"
        value={form.password}
        onChange={handleChange}
        required
      />
      <button type="submit" className="btn btn-outline-warning btn-sm mb-3 px-3 py-2 rounded">Log In</button>
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleProceed} className="btn btn-outline-secondary btn-sm px-3 py-2 rounded">
          Proceed without sign in
        </button>
      </div>
    </form>
  );
}

export default LoginForm;