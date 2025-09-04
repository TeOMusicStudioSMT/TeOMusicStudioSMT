
import React from 'react';
import { useContent } from '../hooks/useContent';
import { PageID } from '../types';
import NotFoundPage from './NotFoundPage';

interface StaticPageProps {
  pageId: PageID;
}

const StaticPage: React.FC<StaticPageProps> = ({ pageId }) => {
  const { pageContents } = useContent();
  const content = pageContents[pageId];

  if (!content) {
    return <NotFoundPage />;
  }

  return (
    <div className="bg-brand-bg min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div 
          className="bg-brand-dark p-8 md:p-12 rounded-lg prose prose-invert prose-lg max-w-none 
                     prose-headings:text-white prose-a:text-brand-primary hover:prose-a:text-brand-accent 
                     prose-strong:text-white prose-ul:list-disc prose-ul:marker:text-brand-primary"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </div>
    </div>
  );
};

export default StaticPage;
