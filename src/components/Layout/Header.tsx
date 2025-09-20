import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Home } from 'lucide-react';

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
}

const Header: React.FC<HeaderProps> = ({ title, showBackButton = true }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <div className="flex items-center space-x-4">
            {showBackButton && !isHome && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
              >
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </button>
            )}
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">
              {title}
            </h1>
          </div>
          
          {!isHome && (
            <button
              onClick={() => navigate('/')}
              className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
            >
              <Home className="h-6 w-6 text-gray-600" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;