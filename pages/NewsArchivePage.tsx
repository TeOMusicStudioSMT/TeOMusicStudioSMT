import React, { useRef, useEffect } from 'react';
import { useContent } from '../hooks/useContent';
import { Link } from 'react-router-dom';
import { NewsArticle } from '../types';
import WavySeparator from '../components/WavySeparator';

const useTilt = <T extends HTMLElement>() => {
    const ref = useRef<T>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const handleMouseMove = (e: MouseEvent) => {
            const { left, top, width, height } = el.getBoundingClientRect();
            const x = (e.clientX - left) / width - 0.5;
            const y = (e.clientY - top) / height - 0.5;

            const rotateY = x * 20;
            const rotateX = -y * 20;

            el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
            el.style.boxShadow = `${-x * 15}px ${-y * 15}px 30px -5px rgba(0,0,0,0.3)`;
        };

        const handleMouseLeave = () => {
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
            el.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)';
        };
        
        el.style.transition = 'transform 0.2s, box-shadow 0.2s';
        el.style.willChange = 'transform, box-shadow';
        el.addEventListener('mousemove', handleMouseMove);
        el.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            el.removeEventListener('mousemove', handleMouseMove);
            el.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return ref;
};

const NewsCard: React.FC<{ article: NewsArticle, index: number }> = ({ article, index }) => {
    const tiltRef = useTilt<HTMLAnchorElement>();
    return (
        <Link ref={tiltRef} to={`/news/${index}`} className="bg-brand-surface/50 rounded-lg overflow-hidden group shadow-lg flex flex-col">
            <div className="overflow-hidden">
                <img src={article.imageUrl} alt={article.title} className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-6 flex-grow flex flex-col">
                <p className="text-sm text-brand-text-secondary mb-2">{article.date}</p>
                <h3 className="text-xl font-bold text-white mb-2 flex-grow">{article.title}</h3>
                <p className="text-brand-text-secondary text-sm">{article.summary}</p>
            </div>
        </Link>
    )
};

const NewsArchivePage: React.FC = () => {
    const { news } = useContent();

    return (
        <div className="bg-brand-bg min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold bg-text-gradient bg-clip-text text-transparent bg-[size:200%_auto] animate-text-gradient-flow inline-block animate-neon-glow">News Archive</h1>
                    <WavySeparator />
                    <p className="text-lg text-brand-text-secondary mt-4 max-w-3xl mx-auto">
                        Stay up-to-date with all the latest announcements, releases, and behind-the-scenes stories from TeO Music Studio.
                    </p>
                </div>

                {news.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {news.map((article, index) => (
                            <NewsCard key={index} article={article} index={index} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-2xl text-white">No news articles found.</p>
                        <p className="text-brand-text-secondary mt-2">Check back later for updates.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NewsArchivePage;