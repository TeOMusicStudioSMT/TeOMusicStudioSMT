import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import { PageID } from '../../types';
import toast from 'react-hot-toast';
import NotFoundPage from '../NotFoundPage';

const AdminPageEditPage: React.FC = () => {
  const { pageId } = ReactRouterDOM.useParams<{ pageId: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const { pageContents, updatePageContent } = useContent();
  
  const [content, setContent] = useState<string | null>(null);
  const [pageName, setPageName] = useState('');
  
  const isValidPageId = (id: string | undefined): id is PageID => {
      return id === 'about' || id === 'store' || id === 'support' || id === 'press';
  }

  useEffect(() => {
    // Only set state when loading a new page to edit
    if (isValidPageId(pageId)) {
        if(content === null || pageName !== (pageId.charAt(0).toUpperCase() + pageId.slice(1) + " Page")) {
            setContent(pageContents[pageId]);
            setPageName(pageId.charAt(0).toUpperCase() + pageId.slice(1) + " Page");
        }
    }
  }, [pageId, pageContents, content, pageName]);

  if (!isValidPageId(pageId) || content === null) {
    return <NotFoundPage message="Page not found for editing" />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePageContent(pageId, content);
    toast.success(`${pageName} content updated!`);
    navigate('/admin/pages');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">
        Edit: <span className="text-brand-primary">{pageName}</span>
      </h1>
      <form onSubmit={handleSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6">
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Page Content (HTML supported)</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[50vh] font-mono"
            placeholder="Enter your content here. You can use HTML tags like <h1>, <p>, <ul>, etc."
          />
        </div>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => navigate('/admin/pages')} className="bg-brand-surface px-6 py-2 rounded-lg hover:bg-opacity-80">
            Cancel
          </button>
          <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
            Save Content
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminPageEditPage;
