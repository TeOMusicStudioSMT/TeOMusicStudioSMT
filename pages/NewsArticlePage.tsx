import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../hooks/useContent';
import NotFoundPage from './NotFoundPage';

const NewsArticlePage: React.FC = () => {
    const { newsIndex } = ReactRouterDOM.useParams<{ newsIndex: string }>();
    const { news } = useContent();

    const index = newsIndex ? parseInt(newsIndex, 10) : -1;

    if (isNaN(index) || index < 0 || index >= news.length) {
        return <NotFoundPage message="Article Not Found" />;
    }

    const article = news[index];

    return (
        <div className="bg-brand-bg min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="max-w-4xl mx-auto">
                    <ReactRouterDOM.Link to="/news" className="text-brand-primary hover:text-white mb-8 inline-block">
                        &larr; Back to News Archive
                    </ReactRouterDOM.Link>
                    <div className="bg-brand-dark p-8 md:p-12 rounded-lg">
                        <p className="text-brand-text-secondary mb-2">{article.date}</p>
                        <h1 className="text-4xl font-bold text-white mb-6">{article.title}</h1>
                        <img src={article.imageUrl} alt={article.title} className="w-full h-auto max-h-[500px] object-cover rounded-lg mb-8" />
                        <p className="text-lg text-brand-text leading-relaxed">{article.summary}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewsArticlePage;
