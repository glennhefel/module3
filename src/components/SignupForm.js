import React, { useState } from 'react';
import InputField from './InputField';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function SignupForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

     try {
    const res = await axios.post('http://localhost:5000/users/signup', {
      username: form.name,
      password: form.password,
      email: form.email,
    });

    const user = res.data.user;


      alert("Signup successful!");
      localStorage.setItem('userId', user._id);
      localStorage.setItem('username', form.username || form.name);
      localStorage.setItem('token', res.data.token);

      navigate('/home');
    } catch (err) {
      alert(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Signup failed"
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <InputField
        label="Username"
        type="text"
        name="name"
        placeholder="Username"
        value={form.name}
        onChange={handleChange}
        required
      />
      <InputField
        label="Email"
        type="email"
        name="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
        required
      />
      <InputField
        label="Password"
        type="password"
        name="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
        required
      />
      <InputField
        label="Confirm Password"
        type="password"
        name="confirmPassword"
        placeholder="Confirm Password"
        value={form.confirmPassword}
        onChange={handleChange}
        required
      />
      <button type="submit" className="btn btn-outline-warning btn-sm mb-3 px-3 py-2 rounded">Sign Up</button>
    </form>
  );
}

export default SignupForm;