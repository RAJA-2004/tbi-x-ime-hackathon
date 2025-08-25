import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-md border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-2 sm:py-3 md:py-4 lg:py-6 space-y-2 sm:space-y-0">
          {/* Logo/Title Section */}
          <div className="flex items-center justify-between sm:justify-start">
            <div className="flex-shrink-0">
              <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-maritime-navy leading-tight">
                <span className="hidden sm:inline">SoF Event Extractor</span>
                <span className="sm:hidden">SoF Extractor</span>
              </h1>
            </div>
            
            {/* Mobile logout button */}
            <div className="sm:hidden">
              {user && (
                <button
                  onClick={logout}
                  className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md text-maritime-blue bg-maritime-blue bg-opacity-10 hover:bg-opacity-20 transition-colors"
                >
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              )}
            </div>
          </div>
          
          {/* User Info Section - Desktop */}
          <div className="hidden sm:flex items-center space-x-3 md:space-x-4">
            {user && (
              <>
                <div className="flex items-center space-x-2 md:space-x-3">
                  <div className="text-xs sm:text-sm">
                    <span className="text-maritime-gray-500">Welcome,</span>
                    <span className="font-medium text-maritime-navy ml-1 whitespace-nowrap">
                      {user.full_name}
                    </span>
                  </div>
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-maritime-blue bg-opacity-10 flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-medium text-maritime-blue">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
                <button
                  onClick={logout}
                  className="inline-flex items-center px-2 sm:px-3 py-1 sm:py-2 border border-transparent text-xs sm:text-sm leading-4 font-medium rounded-md text-maritime-blue bg-maritime-blue bg-opacity-10 hover:bg-opacity-20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-maritime-blue transition-colors"
                >
                  <svg className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="hidden sm:inline">Sign Out</span>
                  <span className="sm:hidden">Out</span>
                </button>
              </>
            )}
          </div>

          {/* User Info Section - Mobile */}
          <div className="sm:hidden">
            {user && (
              <div className="flex items-center justify-between py-1.5 px-2 bg-maritime-gray-50 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="h-5 w-5 rounded-full bg-maritime-blue bg-opacity-10 flex items-center justify-center">
                    <span className="text-xs font-medium text-maritime-blue">
                      {user.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs">
                    <span className="text-maritime-gray-500">Logged in as </span>
                    <span className="font-medium text-maritime-navy">{user.full_name}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
