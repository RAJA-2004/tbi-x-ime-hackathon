import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Register = ({ onSwitchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '', // Will be set to email for backend compatibility
    email: '',
    full_name: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Security codes do not match');
      return false;
    }
    
    if (formData.password.length < 8) {
      setError('Security code must be at least 8 characters long');
      return false;
    }

    const hasUpper = /[A-Z]/.test(formData.password);
    const hasLower = /[a-z]/.test(formData.password);
    const hasNumber = /\d/.test(formData.password);

    if (!hasUpper || !hasLower || !hasNumber) {
      setError('Security code must contain uppercase, lowercase, and numeric characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const { confirmPassword, ...registrationData } = formData;
    // Use email as username for backend compatibility
    registrationData.username = registrationData.email;
    const result = await register(registrationData);
    
    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onSwitchToLogin();
      }, 2000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen relative bg-cover bg-center bg-no-repeat" style={{
        backgroundImage: "url('/images/cargoo.png')"
      }}>
        {/* Background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/50 via-blue-900/40 to-cyan-900/50"></div>
        
        {/* Success Content */}
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="w-full max-w-md">
            <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-emerald-500/20 to-green-600/20 backdrop-blur-sm border border-white/30 rounded-full mb-6">
                <svg className="w-10 h-10 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">Vessel Registered!</h2>
              <p className="text-emerald-100 mb-4">Your maritime credentials have been successfully created.</p>
              <p className="text-sm text-white/70">Redirecting to the bridge...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative bg-cover bg-center bg-no-repeat" style={{
      backgroundImage: "url('/images/cargoo.png')"
    }}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/40 via-teal-900/30 to-cyan-900/40"></div>
      
      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-end px-4 sm:px-6 lg:px-8">
        <div className="w-full max-w-md mr-8 lg:mr-16 xl:mr-24">
          {/* Form Container with blur effect */}
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-teal-500/20 to-cyan-600/20 backdrop-blur-sm border border-white/30 rounded-full mb-4">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-2">Maritime Registry</h1>
              <p className="text-teal-100 text-sm mb-2">Vessel Registration Portal</p>
              <h2 className="text-xl font-semibold text-white">Register your vessel</h2>
            </div>

            <form className="space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 text-red-100 px-4 py-3 rounded-lg text-sm flex items-start">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label htmlFor="full_name" className="block text-sm font-semibold text-white mb-2">
                  Captain Name
                </label>
                <input
                  id="full_name"
                  name="full_name"
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:bg-white/30 transition-all duration-200"
                  placeholder="Enter your full name"
                  value={formData.full_name}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                  Maritime Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:bg-white/30 transition-all duration-200"
                  placeholder="Enter your maritime email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                  Security Code
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:bg-white/30 transition-all duration-200"
                  placeholder="Create your security code"
                  value={formData.password}
                  onChange={handleChange}
                />
                <p className="mt-1 text-xs text-white/70">
                  Must be 8+ characters with uppercase, lowercase, and numbers
                </p>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-white mb-2">
                  Confirm Security Code
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/70 rounded-lg focus:ring-2 focus:ring-teal-400 focus:border-teal-400 focus:bg-white/30 transition-all duration-200"
                  placeholder="Confirm your security code"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3 px-4 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all duration-200"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Registering vessel...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                      Register vessel
                    </div>
                  )}
                </button>
              </div>

              <div className="text-center pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="font-semibold text-teal-200 hover:text-teal-100 transition-colors"
                >
                  Already have maritime credentials? Board vessel →
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
