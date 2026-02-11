
import React from 'react';
import Logo from './Logo';

interface HeaderProps {
  onHome: () => void;
  isSubPage: boolean;
}

const Header: React.FC<HeaderProps> = ({ onHome, isSubPage }) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 py-4">
      <div className="container mx-auto flex justify-between items-center">
        <div 
          onClick={onHome} 
          className="flex items-center space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
            <Logo className="text-white w-6 h-6" />
          </div>
          <div className="flex flex-col leading-tight">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              FileMorph
            </span>
            <span className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">Premium Utility</span>
          </div>
        </div>

        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
          <button onClick={onHome} className="hover:text-white transition-colors">Tools</button>
          <button className="hover:text-white transition-colors">Pricing</button>
          <button className="hover:text-white transition-colors">Privacy</button>
          <button className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2 rounded-lg transition-all shadow-lg shadow-indigo-600/20">
            Upgrade Pro
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
