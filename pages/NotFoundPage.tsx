

import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';

interface NotFoundPageProps {
  message?: string;
  subMessage?: string;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ message, subMessage }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center h-full py-20">
      <h1 className="text-6xl font-extrabold text-brand-primary">{message ? 'Coming Soon' : '404'}</h1>
      <h2 className="text-2xl font-bold text-white mt-4">
        {message || 'Page Not Found'}
      </h2>
      <p className="text-brand-text-secondary mt-2">
        {subMessage || "Sorry, we couldn't find the page you're looking for."}
      </p>
      <ReactRouterDOM.Link
        to="/"
        className="mt-8 inline-block bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
      >
        Go Back Home
      </ReactRouterDOM.Link>
    </div>
  );
};

export default NotFoundPage;
