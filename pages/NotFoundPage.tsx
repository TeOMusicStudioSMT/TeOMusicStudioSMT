import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC<{ message?: string }> = ({ message }) => (
    <div className="container mx-auto px-4 py-16 text-center flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-6xl font-extrabold text-brand-primary mb-4">404</h1>
        <h2 className="text-3xl font-bold text-white mb-4">Page Not Found</h2>
        <p className="text-brand-text-secondary mb-8">{message || "The page you are looking for does not exist or has been moved."}</p>
        <Link to="/" className="bg-brand-primary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
            Go Back Home
        </Link>
    </div>
);

export default NotFoundPage;
