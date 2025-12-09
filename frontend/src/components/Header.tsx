import React, { useState, useRef, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useContent } from '../hooks/useContent';
import { SubscriptionTier, User } from '../types';
import { MusicNoteIcon, HomeIcon, UsersIcon, StoreIcon, CreditCardIcon, MessageCircleIcon, InfoIcon, SearchIcon, LogInIcon, CrownIcon, MicIcon, StarIcon, GridIcon, PlaylistIcon, GlobeIcon, FileTextIcon, MoreHorizontalIcon, AppWindowIcon, SparklesIcon, FolderIcon, VideoIcon, MenuIcon, XIcon } from './icons';

const NavItem: React.FC<{ to: string; icon: React.ReactNode; label: string; exact?: boolean; onClick?: () => void; isMobile?: boolean; }> = ({ to, icon, label, exact = false, onClick, isMobile = false }) => {
    const navLinkClasses = ({ isActive }: { isActive: boolean }) => {
        const baseClasses = `group flex items-center space-x-2 rounded-lg transition-colors duration-200`;
        const mobileClasses = `text-2xl py-4 w-full justify-center ${isActive ? 'text-brand-primary' : 'text-brand-text-secondary hover:text-white'}`;
        const desktopClasses = `px-4 py-2 text-sm ${isActive ? 'bg-brand-primary/20 text-white' : 'text-brand-text-secondary hover:bg-liquid-abstract hover:text-white hover:bg-[length:200%_200%] hover:animate-nav-hover-gradient'}`;
        return `${baseClasses} ${isMobile ? mobileClasses : desktopClasses}`;
    }

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
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  useEffect(() => {
    if (isMobileMenuOpen) {
        document.body.style.overflow = 'hidden';
    } else {
        document.body.style.overflow = 'unset';
    }
    return () => {
        document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const hasPremiumAccess = user && (user.tier === SubscriptionTier.PREMIUM || user.tier === SubscriptionTier.VIP);
  
  const MobileMenu: React.FC = () => {
      const handleLinkClick = () => setMobileMenuOpen(false);

      return (
          <div className="fixed inset-0 bg-brand-dark z-[100] flex flex-col p-4 animate-fade-in-up">
              <div className="flex items-center justify-between">
                  <ReactRouterDOM.Link to="/" onClick={handleLinkClick} className="flex items-center space-x-3 group">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                        <MusicNoteIcon className="w-8 h-8 text-brand-primary" />
                    </div>
                  </ReactRouterDOM.Link>
                  <button onClick={() => setMobileMenuOpen(false)} aria-label="Close menu" className="p-2">
                      <XIcon className="w-8 h-8 text-white" />
                  </button>
              </div>

              <nav className="flex flex-col items-center justify-center flex-grow space-y-2 overflow-y-auto">
                  <NavItem to="/" icon={<HomeIcon className="w-6 h-6" />} label="Home" exact onClick={handleLinkClick} isMobile />
                  <NavItem to="/artists" icon={<UsersIcon className="w-6 h-6" />} label="Artists" onClick={handleLinkClick} isMobile />
                  <NavItem to="/playlists" icon={<PlaylistIcon className="w-6 h-6" />} label="Playlists" onClick={handleLinkClick} isMobile />
                  <NavItem to="/videos" icon={<VideoIcon className="w-6 h-6" />} label="Videos" onClick={handleLinkClick} isMobile />
                  <NavItem to="/studio" icon={<MicIcon className="w-6 h-6" />} label="Studio" onClick={handleLinkClick} isMobile />
                  <NavItem to="/image-generator" icon={<SparklesIcon className="w-6 h-6" />} label="Creative Feed" onClick={handleLinkClick} isMobile />
                  <NavItem to="/chat" icon={<MessageCircleIcon className="w-6 h-6" />} label="Chat" onClick={handleLinkClick} isMobile />
                  <NavItem to="/subscriptions" icon={<CreditCardIcon className="w-6 h-6" />} label="Subscriptions" onClick={handleLinkClick} isMobile />
              </nav>

              <div className="pb-8">
                  {user ? (
                      <div className="flex flex-col items-center space-y-4">
                          <UserPill user={user} />
                          <button onClick={() => { logout(); handleLinkClick(); }} className="text-sm text-brand-text-secondary hover:text-white">Logout</button>
                      </div>
                  ) : (
                      <div className="flex flex-col items-center space-y-4">
                           <ReactRouterDOM.Link to="/signin" onClick={handleLinkClick} className="w-full max-w-xs text-center flex items-center justify-center space-x-2 text-lg text-white transition-colors py-3 rounded-full bg-brand-surface">
                              <LogInIcon className="w-5 h-5" />
                              <span>Sign In</span>
                            </ReactRouterDOM.Link>
                            <ReactRouterDOM.Link to="/signup" onClick={handleLinkClick} className="w-full max-w-xs text-center flex items-center justify-center space-x-2 bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold py-3 rounded-full text-lg hover:opacity-90 transition-opacity">
                              <span>Sign Up</span>
                            </ReactRouterDOM.Link>
                      </div>
                  )}
              </div>
          </div>
      );
  }

  return (
    <>
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
            <button className="text-brand-text-secondary hover:text-white transition-colors hidden md:block">
              <SearchIcon className="w-5 h-5" />
            </button>
            <div className="hidden md:flex items-center">
                {user ? (
                  <div className="flex items-center space-x-4">
                    <UserPill user={user} />
                     <button onClick={logout} className="text-sm text-brand-text-secondary hover:text-white">Logout</button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
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
            <div className="md:hidden">
                <button onClick={() => setMobileMenuOpen(true)} className="text-white p-2" aria-label="Open menu">
                    <MenuIcon className="w-6 h-6" />
                </button>
            </div>
          </div>
        </div>
      </div>
    </header>
    {isMobileMenuOpen && <MobileMenu />}
    </>
  );
};

export default Header;
