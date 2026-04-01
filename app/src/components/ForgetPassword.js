import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { setPrimaryTheme } from "../utils/setTheme";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [domain, setDomain] = useState(''); // New state for domain
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [logo, setLogo] = useState('/service-desk/logo.png');

  useEffect(() => {
    if (window.welloServiceDesk) {
      const { logo_primary, domain, color_primary } = window.welloServiceDesk;
      setLogo(logo_primary);
      setDomain(domain);
      setPrimaryTheme(color_primary);
    }
  }, []);

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    try {
      // API request to send password reset email
      await axios.get(
        `api/Contact/SendPasswordReminder?domain=${domain}&e_login=${email}`
      );
      setMessage('A password reset link has been sent to your email.');
      setError('');
      setEmail(''); // Clear email after successful submission
      //setDomain(''); // Clear domain after successful submission

      // Navigate to home page after 5 seconds
      setTimeout(() => {
        navigate('/');
      }, 5000);

    } catch (err) {
      setError('Failed to send reset link. Please try again later.');
      setMessage('');
    }
  };

  return (
    <div className="flex w-full flex-col items-center justify-center h-screen bg-gray-100">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
        <div className="flex justify-center mb-2">
          <img src={logo} alt="Logo" className="w-40" />
        </div>
        <h2 className="text-2xl font-semibold mb-6 text-primary">Forgot Password</h2>
        {message && <p className="text-green-600 mb-4">{message}</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleForgotPassword}>
          {/* <div className="mb-6">
            <label htmlFor="domain" className="block text-base font-medium text-gray-600">Domain</label>
            <input
              type="text"
              id="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="mt-1 p-2 w-full border rounded-md shadow-sm"
              required
            />
          </div> */}
          <div className="mb-6">
            <label htmlFor="email" className="block text-base font-medium text-primary">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 p-2 w-full border rounded-md shadow-sm"
              required
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700">
            Send Reset Link
          </button>
          <button type="button"
            onClick={() => navigate(-1)} // Navigate back one step in history
            className="w-full text-center bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/50 mt-2"
          >
            Back
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;