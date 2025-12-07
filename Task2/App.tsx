import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';
import { MessageSquarePlus, LayoutDashboard, Moon, Sun, Menu, X } from 'lucide-react';

const APP_MODE = process.env.VITE_APP_MODE || 'DEV'; // 'USER', 'ADMIN', or 'DEV'

const NavLink: React.FC<{ to: string; icon: React.ElementType; children: React.ReactNode; onClick?: () => void }> = ({ to, icon: Icon, children, onClick }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link 
      to={to} 
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-blue-600 text-white shadow-md' 
          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span className="font-medium">{children}</span>
    </Link>
  );
};

const Navigation = () => {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  return (
    <nav className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-50 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mr-8">
                {APP_MODE === 'ADMIN' ? 'FeedbackAI Admin' : 'FeedbackAI'}
              </span>
            </Link>
            {/* Navigation links only show in DEV mode */}
            {APP_MODE === 'DEV' && (
              <div className="hidden sm:flex space-x-2">
                <NavLink to="/" icon={MessageSquarePlus}>User Dashboard</NavLink>
                <NavLink to="/admin" icon={LayoutDashboard}>Admin Dashboard</NavLink>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              aria-label="Toggle Dark Mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            
            {APP_MODE === 'DEV' && (
              <div className="sm:hidden">
                <button 
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                >
                  {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Menu (Dev Only) */}
      {isMobileMenuOpen && APP_MODE === 'DEV' && (
        <div className="sm:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 absolute w-full shadow-lg">
          <div className="p-4 space-y-2">
            <NavLink to="/" icon={MessageSquarePlus} onClick={() => setIsMobileMenuOpen(false)}>User Dashboard</NavLink>
            <NavLink to="/admin" icon={LayoutDashboard} onClick={() => setIsMobileMenuOpen(false)}>Admin Dashboard</NavLink>
          </div>
        </div>
      )}
    </nav>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 transition-colors duration-300">
        <Navigation />
        
        <main className="py-8 animate-in fade-in duration-500">
          <Routes>
            {/* Logic to determine which dashboard to show based on Deployment Mode */}
            {APP_MODE === 'USER' && (
              <Route path="*" element={<UserDashboard />} />
            )}
            
            {APP_MODE === 'ADMIN' && (
              <Route path="*" element={<AdminDashboard />} />
            )}

            {APP_MODE === 'DEV' && (
              <>
                <Route path="/" element={<UserDashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
};

export default App;