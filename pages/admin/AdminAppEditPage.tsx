

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import { TeoApp } from '../../types';
import toast from 'react-hot-toast';
import NotFoundPage from '../NotFoundPage';
import ImageGenerationInput from '../../components/admin/ImageGenerationInput';
import TextGenerationInput from '../../components/admin/TextGenerationInput';

const AdminAppEditPage: React.FC = () => {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const { teoApps, addTeoApp, updateTeoApp } = useContent();
  
  const isEditing = appId !== undefined;
  const originalApp = isEditing ? teoApps.find(p => p.id === appId) : null;

  const getNewApp = (): TeoApp => ({
    id: `app_${Date.now()}`,
    name: '',
    description: '',
    iconUrl: '',
    launchUrl: '',
  });

  const [app, setApp] = useState<TeoApp | null>(null);

  useEffect(() => {
    if (isEditing) {
      if (originalApp && (!app || app.id !== originalApp.id)) {
        setApp({ ...originalApp });
      }
    } else {
      if (!app) {
        setApp(getNewApp());
      }
    }
  }, [appId, teoApps, app, isEditing, originalApp]);

  if (isEditing && !originalApp) {
      return <NotFoundPage message="App not found" />;
  }
  if (!app) {
      return <div>Loading...</div>;
  }

  const handleValueChange = (name: keyof TeoApp, value: string) => {
    setApp(prev => prev ? { ...prev, [name]: value } : null);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    handleValueChange(name as keyof TeoApp, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!app || !app.name || !app.description) {
      toast.error("Please fill out all fields.");
      return;
    }

    if (isEditing) {
      updateTeoApp(app);
      toast.success('App updated successfully!');
    } else {
      addTeoApp(app);
      toast.success('App added successfully!');
    }
    navigate('/admin/apps');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">
        {isEditing ? `Edit App: ${app.name}` : 'Add New App'}
      </h1>
      <form onSubmit={handleSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6">
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">App Name</label>
          <input type="text" name="name" value={app.name} onChange={handleChange} className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <TextGenerationInput
            label="Description"
            value={app.description}
            onValueChange={(newValue) => handleValueChange('description', newValue)}
            placeholder="A description for the TeO App..."
            generationContext={{ name: app.name }}
            minHeight="100px"
        />
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Icon URL</label>
          <ImageGenerationInput
            value={app.iconUrl}
            onValueChange={(newValue) => handleValueChange('iconUrl', newValue)}
            placeholder="https://... or generate"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Launch URL</label>
          <input type="text" name="launchUrl" value={app.launchUrl} onChange={handleChange} placeholder="/apps/my-cool-app/" className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => navigate('/admin/apps')} className="bg-brand-surface px-6 py-2 rounded-lg hover:bg-opacity-80">Cancel</button>
          <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">Save App</button>
        </div>
      </form>
    </div>
  );
};

export default AdminAppEditPage;
