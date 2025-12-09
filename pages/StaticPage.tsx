import React from 'react';
import { useContent } from '../hooks/useContent';
import { PageID } from '../types';

interface StaticPageProps {
  pageId: PageID;
}

const StaticPage: React.FC<StaticPageProps> = ({ pageId }) => {
  const { pageContents } = useContent();
  const content = pageContents[pageId];

  return (
    <div className="bg-brand-bg min-h-screen">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
            {content ? (
                <div dangerouslySetInnerHTML={{ __html: content }} />
            ) : (
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-white">Content Not Found</h1>
                    <p className="text-brand-text-secondary mt-4">The content for this page could not be loaded.</p>
                </div>
            )}
        </div>
    </div>
  );
};

export default StaticPage;
