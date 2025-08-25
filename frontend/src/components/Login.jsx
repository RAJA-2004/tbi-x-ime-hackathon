import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Login = ({ onSwitchToRegister, onDemoAccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, demoLogin } = useAuth();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Use email as username for backend compatibility
    const loginData = { 
      username: formData.email,
      password: formData.password 
    };
    
    const result = await login(loginData);
    
    if (!result.success) {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    setError('');
    
    const result = await demoLogin();
    if (!result.success) {
      setError('Demo access temporarily unavailable. Please try again.');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen relative bg-cover bg-center bg-no-repeat" 
         style={{ backgroundImage: "url('/images/cargoo.png')" }}>
      {/* Background overlay with responsive gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/60 via-blue-900/50 to-cyan-900/60 
                      sm:from-slate-900/50 sm:via-blue-900/40 sm:to-cyan-900/50"></div>
      
      {/* Content container with responsive positioning */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 
                      sm:justify-end sm:px-6 lg:px-8">
        <div className="w-full max-w-sm sm:max-w-md sm:mr-8 lg:mr-16 xl:mr-24">
          {/* Form Container with responsive blur and sizing */}
          <div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl 
                          shadow-2xl p-4 sm:p-6 lg:p-8">
            {/* Header Section with responsive sizing */}
            <div className="text-center mb-4 sm:mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 
                              bg-gradient-to-br from-blue-500/20 to-cyan-600/20 backdrop-blur-sm 
                              border border-white/30 rounded-full mb-3 sm:mb-4">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              
              {/* Responsive title text */}
              <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-white mb-1 sm:mb-2">
                Maritime Access
              </h1>
              
              {/* Subtitle - hidden on smallest screens */}
              <p className="hidden sm:block text-blue-100 text-xs sm:text-sm mb-1 sm:mb-2">
                SoF Event Extractor Portal
              </p>
              
              <h2 className="text-lg sm:text-xl font-semibold text-white">
                <span className="hidden sm:inline">Board your vessel</span>
                <span className="sm:hidden">Login</span>
              </h2>
            </div>

            {/* Login Form with responsive spacing */}
            <form className="space-y-3 sm:space-y-4" onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/20 backdrop-blur-sm border border-red-300/30 text-red-100 
                                px-3 py-2 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm flex items-start">
                  <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="break-words">{error}</span>
                </div>
              )}

              {/* Email Input */}
              <div>
                <label htmlFor="email" className="block text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-2">
                  <span className="hidden sm:inline">Maritime Email</span>
                  <span className="sm:hidden">Email</span>
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/20 backdrop-blur-sm 
                             border border-white/30 text-white placeholder-white/70 rounded-lg 
                             focus:ring-2 focus:ring-blue-400 focus:border-blue-400 
                             focus:bg-white/30 transition-all duration-200
                             text-sm sm:text-base"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              {/* Password Input */}
              <div>
                <label htmlFor="password" className="block text-xs sm:text-sm font-semibold text-white mb-1 sm:mb-2">
                  <span className="hidden sm:inline">Security Code</span>
                  <span className="sm:hidden">Password</span>
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  className="w-full px-3 py-2 sm:px-4 sm:py-3 bg-white/20 backdrop-blur-sm 
                             border border-white/30 text-white placeholder-white/70 rounded-lg 
                             focus:ring-2 focus:ring-blue-400 focus:border-blue-400 
                             focus:bg-white/30 transition-all duration-200
                             text-sm sm:text-base"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                />
              </div>

              {/* Login Button with responsive sizing */}
              <div className="pt-2 sm:pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 sm:py-3 px-4 
                             bg-gradient-to-r from-blue-600 to-cyan-700 
                             hover:from-blue-700 hover:to-cyan-800 
                             text-white font-semibold rounded-lg shadow-lg hover:shadow-xl 
                             transform hover:scale-105 focus:outline-none focus:ring-2 
                             focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent 
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none 
                             transition-all duration-200 text-sm sm:text-base"
                >
                  {loading ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 text-white" 
                           xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" 
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className="hidden sm:inline">Boarding vessel...</span>
                      <span className="sm:hidden">Logging in...</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      <span className="hidden sm:inline">Board vessel</span>
                      <span className="sm:hidden">Login</span>
                    </div>
                  )}
                </button>
              </div>

              {/* Demo Access Button with responsive styling */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="w-full flex justify-center items-center py-2.5 sm:py-3 px-4 
                             bg-gradient-to-r from-emerald-600/80 to-teal-700/80 
                             hover:from-emerald-700/90 hover:to-teal-800/90 
                             text-white font-semibold rounded-lg shadow-lg hover:shadow-xl 
                             transform hover:scale-105 focus:outline-none focus:ring-2 
                             focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-transparent 
                             disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none 
                             transition-all duration-200 text-sm sm:text-base"
                >
                  <div className="flex items-center">
                    <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="hidden sm:inline">Quick Demo Access</span>
                    <span className="sm:hidden">Demo</span>
                  </div>
                </button>
              </div>

              {/* Registration Link with responsive divider */}
              <div className="text-center pt-3 sm:pt-4 border-t border-white/20">
                <button
                  type="button"
                  onClick={onSwitchToRegister}
                  className="font-semibold text-blue-200 hover:text-blue-100 transition-colors
                             text-sm sm:text-base"
                >
                  <span className="hidden sm:inline">Need maritime credentials? Register vessel →</span>
                  <span className="sm:hidden">Need an account? Sign up →</span>
                </button>
              </div>
            </form>

            {/* Mobile-only footer info */}
            <div className="sm:hidden mt-4 pt-3 border-t border-white/10 text-center">
              <p className="text-white/60 text-xs">SoF Event Extractor</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
