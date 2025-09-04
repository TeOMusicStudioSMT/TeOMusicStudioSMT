import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import toast from 'react-hot-toast';

const AdminNewsListPage: React.FC = () => {
  const { news, deleteNewsArticle } = useContent();

  const handleDelete = (index: number) => {
    if (window.confirm('Are you sure you want to delete this news article?')) {
      deleteNewsArticle(index);
      toast.success('Article deleted!');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Manage News</h1>
        <ReactRouterDOM.Link to="/admin/news/new" className="bg-brand-primary px-4 py-2 rounded-lg font-semibold hover:opacity-90">
          Add New Article
        </ReactRouterDOM.Link>
      </div>
      <div className="bg-brand-bg p-6 rounded-lg">
        <div className="space-y-4">
          {news.map((article, index) => (
            <div key={index} className="bg-brand-surface p-4 rounded-lg flex items-center justify-between">
              <div>
                <p className="text-sm text-brand-text-secondary">{article.date}</p>
                <h2 className="text-lg font-semibold text-white">{article.title}</h2>
              </div>
              <div className="flex items-center space-x-4">
                <ReactRouterDOM.Link to={`/admin/news/${index}/edit`} className="text-brand-primary hover:text-white">
                  Edit
                </ReactRouterDOM.Link>
                <button onClick={() => handleDelete(index)} className="text-red-500 hover:text-red-400">
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminNewsListPage;
