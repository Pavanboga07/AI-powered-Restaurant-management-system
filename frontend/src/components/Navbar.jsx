import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSelector from './common/LanguageSelector';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-3 sm:px-4">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <Link to="/" className="text-lg sm:text-2xl font-bold text-primary-600 flex items-center">
            🍽️ <span className="hidden sm:inline ml-1">Restaurant Manager</span>
            <span className="sm:hidden ml-1">RM</span>
          </Link>

          <div className="flex items-center space-x-3 sm:space-x-6 overflow-x-auto scrollbar-hide">
            {user && (
              <>
                <Link to="/dashboard" className="text-slate-700 hover:text-primary-600 transition-colors text-sm sm:text-base whitespace-nowrap">
                  {t('nav.dashboard')}
                </Link>
                <Link to="/menu" className="text-slate-700 hover:text-primary-600 transition-colors text-sm sm:text-base whitespace-nowrap hidden md:inline">
                  {t('nav.menu')}
                </Link>
                <Link to="/orders" className="text-slate-700 hover:text-primary-600 transition-colors text-sm sm:text-base whitespace-nowrap">
                  {t('nav.orders')}
                </Link>
                <Link to="/tables" className="text-slate-700 hover:text-primary-600 transition-colors text-sm sm:text-base whitespace-nowrap hidden lg:inline">
                  {t('nav.tables')}
                </Link>
                <Link to="/reservations" className="text-slate-700 hover:text-primary-600 transition-colors text-sm sm:text-base whitespace-nowrap hidden xl:inline">
                  {t('nav.reservations')}
                </Link>
                
                <div className="hidden sm:block">
                  <LanguageSelector />
                </div>
                
                <div className="flex items-center space-x-2 sm:space-x-4 border-l pl-2 sm:pl-6">
                  <div className="text-xs sm:text-sm hidden md:block">
                    <p className="font-semibold truncate max-w-[100px]">{user.username}</p>
                    <p className="text-slate-500 capitalize">{user.role}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="btn-secondary text-xs sm:text-sm px-2 sm:px-4 py-1 sm:py-2"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
