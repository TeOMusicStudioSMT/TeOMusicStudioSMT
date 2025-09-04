

import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import { GalleryImage } from '../../types';
import toast from 'react-hot-toast';
import NotFoundPage from '../NotFoundPage';
import ImageGenerationInput from '../../components/admin/ImageGenerationInput';
import TextGenerationInput from '../../components/admin/TextGenerationInput';

const AdminGalleryEditPage: React.FC = () => {
  const { archiveIndex } = ReactRouterDOM.useParams<{ archiveIndex: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const { galleryImages, addGalleryImage, updateGalleryImage } = useContent();
  
  const isEditing = archiveIndex !== undefined;
  const imageIndex = isEditing ? parseInt(archiveIndex, 10) : -1;
  const originalImage = (isEditing && galleryImages[imageIndex]) ? galleryImages[imageIndex] : null;

  const getNewImage = (): GalleryImage => ({
    id: `gallery_${Date.now()}`,
    title: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    imageUrl: '',
    prompt: '',
    userName: 'Admin', // Added required userName
  });

  const [image, setImage] = useState<GalleryImage | null>(null);

  useEffect(() => {
    if (isEditing) {
      if (originalImage && (!image || image.id !== originalImage.id)) {
        setImage({ ...originalImage });
      }
    } else {
      if (!image) {
        setImage(getNewImage());
      }
    }
  }, [archiveIndex, galleryImages, image, isEditing, originalImage]);

  if (!image) {
      return isEditing ? <NotFoundPage message="Gallery image not found" /> : <div>Loading...</div>;
  }

  const handleValueChange = (name: keyof GalleryImage, value: string) => {
    setImage(prev => prev ? { ...prev, [name]: value } : null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    handleValueChange(name as keyof GalleryImage, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!image) return;

    if (isEditing) {
      updateGalleryImage(image, imageIndex);
      toast.success('Gallery image updated successfully!');
    } else {
      addGalleryImage(image);
      toast.success('Image added to gallery successfully!');
    }
    navigate('/admin/gallery');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">
        {isEditing ? 'Edit Gallery Image' : 'Add New Gallery Image'}
      </h1>
      <form onSubmit={handleSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6">
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Title</label>
          <input
            type="text"
            name="title"
            value={image.title}
            onChange={handleChange}
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Date</label>
          <input
            type="date"
            name="date"
            value={image.date}
            onChange={handleChange}
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Image URL</label>
          <ImageGenerationInput
            value={image.imageUrl}
            onValueChange={(newValue) => handleValueChange('imageUrl', newValue)}
            placeholder="https://... or generate"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Original Prompt</label>
          <textarea
            name="prompt"
            value={image.prompt}
            onChange={handleChange}
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[100px]"
          />
        </div>
        <TextGenerationInput
            label="Description"
            value={image.description}
            onValueChange={(newValue) => handleValueChange('description', newValue)}
            placeholder="A short description for the gallery image."
            generationContext={{ title: image.title, prompt: image.prompt }}
        />
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => navigate('/admin/gallery')} className="bg-brand-surface px-6 py-2 rounded-lg hover:bg-opacity-80">
            Cancel
          </button>
          <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
            Save Image
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdminGalleryEditPage;
