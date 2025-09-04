
import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AudioPlayer from './AudioPlayer';
import { useContent } from '../hooks/useContent';

const Layout: React.FC = () => {
  const { currentTrack } = useContent();

  return (
    <div className={`bg-liquid-abstract bg-[length:400%_400%] animate-liquid-gradient min-h-screen flex flex-col text-brand-text animate-site-thump ${currentTrack ? 'pb-28' : ''}`}>
      <Header />
      <main className="flex-grow">
        <ReactRouterDOM.Outlet />
      </main>
      <Footer />
      <AudioPlayer />
    </div>
  );
};

export default Layout;