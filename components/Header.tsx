
import React, { useState, useRef, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { SubscriptionTier, User } from '../types';
import { MusicNoteIcon, HomeIcon, UsersIcon, StoreIcon, CreditCardIcon, MessageCircleIcon, InfoIcon, SearchIcon, LogInIcon, CrownIcon, MicIcon, StarIcon, GridIcon, PlaylistIcon, GlobeIcon, FileTextIcon, MoreHorizontalIcon, AppWindowIcon, SparklesIcon, FolderIcon, VideoIcon } from './icons';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; exact?: boolean; onClick?: () => void }> = ({ to, icon, label, exact = false, onClick }) => {
    const navLinkClasses = ({ isActive }: { isActive: boolean }) =>
        `group flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors duration-200 text-sm ${isActive ? 'bg-brand-primary/20 text-white' : 'text-brand-text-secondary hover:bg-liquid-abstract hover:text-white hover:bg-[length:200%_200%] hover:animate-nav-hover-gradient'}`;

    return (
        <ReactRouterDOM.NavLink to={to} className={navLinkClasses} end={exact} onClick={onClick}>
            <span className="inline-block group-hover:animate-icon-jiggle">{icon}</span>
            <span>{label}</span>
        </ReactRouterDOM.NavLink>
    );
};

const UserPill: React.FC<{ user: User }> = ({ user }) => {
    return (
        <ReactRouterDOM.Link to="/my-account" className="flex items-center space-x-2 bg-brand-surface rounded-full p-1 pr-4 text-sm transition-colors hover:bg-brand-primary/20">
            <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white bg-brand-primary/50 overflow-hidden">
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.vanityName || user.name} className="w-full h-full object-cover" />
                ) : (
                    <span>{user.avatarInitial}</span>
                )}
            </div>
            <div className="text-left">
                <div className="flex items-center space-x-1.5">
                    <span className="text-white font-semibold">{user.vanityName || user.name}</span>
                    {user.tier === SubscriptionTier.PREMIUM && <StarIcon className="w-4 h-4 text-brand-accent" />}
                    {user.tier === SubscriptionTier.VIP && <CrownIcon className="w-4 h-4 text-yellow-400" />}
                </div>
                 <div className="text-xs text-brand-text-secondary">
                   {user.points.toLocaleString()} SMT Points
                </div>
            </div>
        </ReactRouterDOM.Link>
    );
};


const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { showTottCatalog } = useContent();
  const [isMoreMenuOpen, setMoreMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  const hasPremiumAccess = user && (user.tier === SubscriptionTier.PREMIUM || user.tier === SubscriptionTier.VIP);

  return (
    <header className="bg-brand-dark/80 backdrop-blur-sm sticky top-0 z-50 border-b border-brand-surface/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <ReactRouterDOM.Link to="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-full flex items-center justify-center animate-nebula-pulse">
                <MusicNoteIcon className="w-8 h-8 text-brand-primary group-hover:scale-110 transition-transform" />
            </div>
            <div>
              <span className="text-xl font-bold text-white">TeO Music Studio</span>
              <p className="text-xs text-brand-text-secondary">S.M.T.</p>
            </div>
          </ReactRouterDOM.Link>

          <nav className="hidden md:flex items-center space-x-1">
            <NavItem to="/" icon={<HomeIcon className="w-5 h-5" />} label="Home" exact />
            <NavItem to="/artists" icon={<UsersIcon className="w-5 h-5" />} label="Artists" />
            <NavItem to="/playlists" icon={<PlaylistIcon className="w-5 h-5" />} label="Playlists" />
            <NavItem to="/videos" icon={<VideoIcon className="w-5 h-5" />} label="Videos" />
            <NavItem to="/studio" icon={<MicIcon className="w-5 h-5" />} label="Studio" />
            
            {/* More Menu */}
            <div className="relative" ref={menuRef}>
                <button 
                    onClick={() => setMoreMenuOpen(!isMoreMenuOpen)}
                    className="group flex items-center space-x-2 px-4 py-2 rounded-lg text-brand-text-secondary hover:bg-liquid-abstract hover:text-white hover:bg-[length:200%_200%] hover:animate-nav-hover-gradient"
                >
                    <span className="inline-block group-hover:animate-icon-jiggle"><MoreHorizontalIcon className="w-5 h-5"/></span>
                </button>
                {isMoreMenuOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-brand-bg rounded-lg shadow-lg p-2 z-50">
                        {user && <NavItem to="/my-account" icon={<UsersIcon className="w-5 h-5" />} label="My Account" onClick={() => setMoreMenuOpen(false)} />}
                        {user && <NavItem to="/my-projects" icon={<FolderIcon className="w-5 h-5" />} label="My Projects" onClick={() => setMoreMenuOpen(false)} />}
                        {user && <NavItem to="/my-playlists" icon={<PlaylistIcon className="w-5 h-5" />} label="My Playlists" onClick={() => setMoreMenuOpen(false)} />}
                        {user?.tier === SubscriptionTier.VIP && <NavItem to="/vip-lounge" icon={<CrownIcon className="w-5 h-5" />} label="VIP Lounge" onClick={() => setMoreMenuOpen(false)} />}
                        
                        <hr className="my-2 border-brand-surface/50" />

                        <NavItem to="/image-generator" icon={<SparklesIcon className="w-5 h-5" />} label="Creative Feed" onClick={() => setMoreMenuOpen(false)} />
                        <NavItem to="/chat" icon={<MessageCircleIcon className="w-5 h-5" />} label="Chat" onClick={() => setMoreMenuOpen(false)} />
                        <NavItem to="/constellation" icon={<GridIcon className="w-5 h-5" />} label="Constellation" onClick={() => setMoreMenuOpen(false)} />
                        {hasPremiumAccess && <NavItem to="/apps" icon={<AppWindowIcon className="w-5 h-5" />} label="TeO Apps" onClick={() => setMoreMenuOpen(false)} />}
                        {showTottCatalog && <NavItem to="/tott-catalog" icon={<StarIcon className="w-5 h-5" />} label="TOTT Catalog" onClick={() => setMoreMenuOpen(false)} />}
                        
                        <hr className="my-2 border-brand-surface/50" />
                        
                        <NavItem to="/subscriptions" icon={<CreditCardIcon className="w-5 h-5" />} label="Subscriptions" onClick={() => setMoreMenuOpen(false)} />
                        <NavItem to="/store" icon={<StoreIcon className="w-5 h-5" />} label="Store" onClick={() => setMoreMenuOpen(false)} />
                        <NavItem to="/about" icon={<InfoIcon className="w-5 h-5" />} label="About" onClick={() => setMoreMenuOpen(false)} />
                        <NavItem to="/support" icon={<GlobeIcon className="w-5 h-5" />} label="Support" onClick={() => setMoreMenuOpen(false)} />
                        <NavItem to="/press" icon={<FileTextIcon className="w-5 h-5" />} label="Press" onClick={() => setMoreMenuOpen(false)} />
                    </div>
                )}
            </div>

          </nav>

          <div className="flex items-center space-x-4">
            <button className="text-brand-text-secondary hover:text-white transition-colors">
              <SearchIcon className="w-5 h-5" />
            </button>
            {user ? (
              <div className="flex items-center space-x-4">
                <UserPill user={user} />
                 <button onClick={logout} className="text-sm text-brand-text-secondary hover:text-white">Logout</button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <ReactRouterDOM.Link to="/signin" className="flex items-center space-x-2 text-sm text-brand-text-secondary hover:text-white transition-colors">
                  <LogInIcon className="w-5 h-5" />
                  <span>Sign In</span>
                </ReactRouterDOM.Link>
                <ReactRouterDOM.Link to="/signup" className="flex items-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-4 py-2 rounded-full text-sm hover:opacity-90 transition-opacity">
                  <span>Sign Up</span>
                </ReactRouterDOM.Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;