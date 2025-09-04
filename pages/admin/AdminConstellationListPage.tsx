

import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import toast from 'react-hot-toast';
import { ConstellationItem } from '../../types';

const AdminConstellationListPage: React.FC = () => {
  const { constellationItems, updateConstellationOrder, deleteConstellationItem } = useContent();

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...constellationItems];
    const item = newItems[index];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;

    if (swapIndex < 0 || swapIndex >= newItems.length) {
      return;
    }

    newItems[index] = newItems[swapIndex];
    newItems[swapIndex] = item;
    
    updateConstellationOrder(newItems);
    toast.success('Order updated!');
  };

  const handleDelete = (item: ConstellationItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      deleteConstellationItem(item.id);
      toast.success('Item deleted from Constellation!');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Constellation</h1>
        <ReactRouterDOM.Link to="/admin/constellation/new" className="bg-brand-primary px-4 py-2 rounded-lg font-semibold hover:opacity-90">
          Add New Item
        </ReactRouterDOM.Link>
      </div>
      <div className="bg-brand-bg p-6 rounded-lg">
        <div className="space-y-4">
          {constellationItems.map((item, index) => (
            <div key={item.id} className="bg-brand-surface p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-4">
                 <div className="flex flex-col space-y-1">
                    <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="disabled:opacity-20">▲</button>
                    <button onClick={() => moveItem(index, 'down')} disabled={index === constellationItems.length - 1} className="disabled:opacity-20">▼</button>
                </div>
                <img src={item.imageUrl} alt={item.title} className="w-24 h-16 rounded-md object-cover" />
                <div>
                  <h2 className="text-lg font-semibold text-white">{item.title}</h2>
                  <p className="text-sm text-brand-text-secondary truncate max-w-xs">{item.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <ReactRouterDOM.Link to={`/admin/constellation/${item.id}/edit`} className="text-brand-primary hover:text-white">
                  Edit
                </ReactRouterDOM.Link>
                <button onClick={() => handleDelete(item)} className="text-red-500 hover:text-red-400">
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

export default AdminConstellationListPage;
