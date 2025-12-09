import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AudioPlayer from './AudioPlayer';
import { useContent } from '../hooks/useContent';

const Layout: React.FC = () => {
  const { currentTrack } = useContent();

  return (
    <div className={`bg-liquid-abstract bg-[length:400%_400%] animate-liquid-gradient min-h-screen flex flex-col text-brand-text animate-site-thump ${currentTrack ? 'pb-24' : ''}`}>
      <Header />
      <main className="flex-grow">
        <ReactRouterDOM.Outlet />
      </main>
      <Footer />
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <AudioPlayer />
      </div>
    </div>
  );
};

export default Layout;
