import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Card, Input, Button, Alert } from '../../components/UI';

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await register(form);
      setSuccess(data.message);
      setTimeout(() => navigate('/dashboard'), 2000);
    } catch (err) {
      const errData = err.response?.data;
      if (errData?.errors) {
        setError(errData.errors.map((e) => e.message).join(', '));
      } else {
        setError(errData?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={pageStyle}>
      <Card style={{ width: '100%', maxWidth: '480px' }}>
        <h1 style={titleStyle}>🎓 Create Account</h1>
        <p style={subStyle}>Register to access the platform</p>
        {error && <Alert type="error">{error}</Alert>}
        {success && <Alert type="success">{success}</Alert>}
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Input
              label="First Name"
              id="firstName"
              name="firstName"
              type="text"
              value={form.firstName}
              onChange={handleChange}
              placeholder="John"
            />
            <Input
              label="Last Name"
              id="lastName"
              name="lastName"
              type="text"
              value={form.lastName}
              onChange={handleChange}
              placeholder="Doe"
            />
          </div>
          <Input
            label="Email Address"
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            required
          />
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Min 8 chars, uppercase, lowercase, number"
            required
          />
          <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: '8px' }}>
            {loading ? 'Creating account...' : 'Create Account'}
          </Button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px', color: '#6b7280', fontSize: '0.9rem' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#2563eb', fontWeight: 600 }}>Sign in</Link>
        </p>
      </Card>
    </div>
  );
}

const pageStyle = {
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'linear-gradient(135deg, #1e40af 0%, #1d4ed8 100%)',
  padding: '24px',
};

const titleStyle = { textAlign: 'center', color: '#111827', marginBottom: '8px', fontSize: '1.8rem' };
const subStyle = { textAlign: 'center', color: '#6b7280', marginBottom: '24px' };
