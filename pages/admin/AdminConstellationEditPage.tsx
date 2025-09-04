

import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import { ConstellationItem } from '../../types';
import toast from 'react-hot-toast';
import NotFoundPage from '../NotFoundPage';
import ImageGenerationInput from '../../components/admin/ImageGenerationInput';
import TextGenerationInput from '../../components/admin/TextGenerationInput';

const AdminConstellationEditPage: React.FC = () => {
  const { itemId } = ReactRouterDOM.useParams<{ itemId: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const { constellationItems, addConstellationItem, updateConstellationItem } = useContent();
  
  const isEditing = itemId !== undefined;
  const originalItem = isEditing ? constellationItems.find(i => i.id === itemId) : null;

  const getNewItem = (): ConstellationItem => ({
      id: `item_${Date.now()}`, title: '', description: '', imageUrl: '', linkUrl: ''
  });

  const [item, setItem] = useState<ConstellationItem | null>(null);

  useEffect(() => {
    if (isEditing) {
      if (originalItem && (!item || item.id !== originalItem.id)) {
        setItem({ ...originalItem });
      }
    } else {
      if (!item) {
        setItem(getNewItem());
      }
    }
  }, [itemId, constellationItems, item, isEditing, originalItem]);

  if (!item) {
    return isEditing ? <NotFoundPage message="Constellation item not found" /> : <div>Loading...</div>;
  }

  const handleValueChange = (name: keyof ConstellationItem, value: string) => {
      setItem(prev => prev ? { ...prev, [name]: value } : null);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    handleValueChange(name as keyof ConstellationItem, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item) return;

    if (isEditing) {
      updateConstellationItem(item);
      toast.success('Constellation item updated successfully!');
    } else {
      addConstellationItem(item);
      toast.success('Item added to Constellation successfully!');
    }
    navigate('/admin/constellation');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">
        {isEditing ? `Edit Item: ${item.title}` : 'Add New Constellation Item'}
      </h1>
      <form onSubmit={handleSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6">
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Title</label>
          <input type="text" name="title" value={item.title} onChange={handleChange} className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <TextGenerationInput
            label="Description"
            value={item.description}
            onValueChange={(newValue) => handleValueChange('description', newValue)}
            placeholder="A description for the constellation item..."
            generationContext={{ title: item.title }}
            minHeight="100px"
        />
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Image URL</label>
          <ImageGenerationInput
            value={item.imageUrl}
            onValueChange={(newValue) => handleValueChange('imageUrl', newValue)}
            placeholder="https://... or generate"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Link URL (where the tile clicks to)</label>
          <input type="text" name="linkUrl" value={item.linkUrl} onChange={handleChange} placeholder="https://..." className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => navigate('/admin/constellation')} className="bg-brand-surface px-6 py-2 rounded-lg hover:bg-opacity-80">Cancel</button>
          <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">Save Item</button>
        </div>
      </form>
    </div>
  );
};

export default AdminConstellationEditPage;
