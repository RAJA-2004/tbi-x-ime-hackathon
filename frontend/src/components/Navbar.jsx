import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <nav className="bg-transparent relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12">
        <div className="flex justify-between items-center py-6">
          
          {/* Logo - Maritime Design */}
          <Link to="/" className="flex items-center space-x-3 flex-shrink-0">
            <div className="h-10 w-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">⚓</span>
            </div>
            <div className="hidden sm:block">
              <div className="text-white font-bold text-lg leading-tight">SoF Event Extractor</div>
              <div className="text-cyan-200 text-xs font-medium">Maritime AI Processing</div>
            </div>
            <div className="block sm:hidden">
              <span className="text-white font-semibold text-sm">SoF Extractor</span>
            </div>
          </Link>

          {/* Desktop Navigation & User Section */}
          <div className="hidden sm:flex items-center justify-end flex-1 ml-8">
            {/* User Section */}
            {user && (
              <div className="flex items-center space-x-4">
                <div className="text-right hidden lg:block">
                  <div className="text-cyan-200 text-xs">Welcome back</div>
                  <div className="text-white text-sm font-semibold">{user.full_name}</div>
                </div>
                
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg">
                  <span className="text-sm font-bold text-white">
                    {user.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                
                <button
                  onClick={logout}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-full text-white bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013 3v1" />
                  </svg>
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="sm:hidden flex items-center space-x-2">
            {user && (
              <div className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {user.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <button
              type="button"
              className="p-2 rounded-md text-cyan-200 hover:text-white hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-5 w-5" />
              ) : (
                <Bars3Icon className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu - Clean and Organized */}
        {mobileMenuOpen && (
          <div className="sm:hidden">
            <div className="px-4 py-4 space-y-4 border-t border-cyan-500/30">
              {/* User Info Section */}
              {user && (
                <div>
                  <div className="flex items-center space-x-3 px-4 py-3 bg-slate-800/60 rounded-lg border border-cyan-500/20">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {user.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-medium text-sm truncate">{user.full_name}</div>
                      <div className="text-cyan-200 text-xs truncate">{user.email}</div>
                    </div>
                  </div>
                  
                  {/* Sign Out Button */}
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        logout();
                        setMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-lg hover:from-red-700 hover:to-red-800 transition-colors duration-200 shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      <span className="font-medium">Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
