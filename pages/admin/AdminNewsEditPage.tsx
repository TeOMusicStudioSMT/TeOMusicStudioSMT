

import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import { NewsArticle } from '../../types';
import toast from 'react-hot-toast';
import ImageGenerationInput from '../../components/admin/ImageGenerationInput';
import TextGenerationInput from '../../components/admin/TextGenerationInput';

const AdminNewsEditPage: React.FC = () => {
  const { newsIndex } = ReactRouterDOM.useParams<{ newsIndex: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const { news, addNewsArticle, updateNewsArticle } = useContent();
  
  const isEditing = newsIndex !== undefined;
  const articleIndex = isEditing ? parseInt(newsIndex, 10) : -1;
  const originalArticle = (isEditing && news[articleIndex]) ? news[articleIndex] : null;

  const getNewArticle = (): NewsArticle => ({
    title: '',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    imageUrl: ''
  });

  const [article, setArticle] = useState<NewsArticle | null>(null);

  useEffect(() => {
    // This effect ensures state is set only when loading the component
    // for a specific item, preventing overwrites of user input.
    if (isEditing) {
      if (originalArticle && (!article || article.title !== originalArticle.title)) {
        setArticle({ ...originalArticle });
      }
    } else {
      if (!article) {
        setArticle(getNewArticle());
      }
    }
  }, [newsIndex, news, article, isEditing, originalArticle]);

  if (!article) {
    return <div>Loading...</div>
  }

  const handleValueChange = (name: keyof NewsArticle, value: string) => {
      setArticle(prev => prev ? ({ ...prev, [name]: value }) : null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    handleValueChange(name as keyof NewsArticle, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!article) return;

    if (isEditing) {
      updateNewsArticle(article, articleIndex);
      toast.success('Article updated successfully!');
    } else {
      addNewsArticle(article);
      toast.success('Article added successfully!');
    }
    navigate('/admin/news');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">
        {isEditing ? 'Edit News Article' : 'Add New Article'}
      </h1>
      <form onSubmit={handleSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6">
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Title</label>
          <input
            type="text"
            name="title"
            value={article.title}
            onChange={handleChange}
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Date</label>
          <input
            type="date"
            name="date"
            value={article.date}
            onChange={handleChange}
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Image URL</label>
           <ImageGenerationInput
                value={article.imageUrl}
                onValueChange={(newValue) => handleValueChange('imageUrl', newValue)}
                placeholder="https://... or generate"
            />
        </div>
        <TextGenerationInput
            label="Summary"
            value={article.summary}
            onValueChange={(newValue) => handleValueChange('summary', newValue)}
            placeholder="A concise summary of the news article..."
            generationContext={{ title: article.title, date: article.date }}
        />
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => navigate('/admin/news')} className="bg-brand-surface px-6 py-2 rounded-lg hover:bg-opacity-80">
            Cancel
          </button>
          <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
            Save Article
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminNewsEditPage;
