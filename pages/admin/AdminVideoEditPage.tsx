

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import { SmtVideo } from '../../types';
import toast from 'react-hot-toast';
import NotFoundPage from '../NotFoundPage';
import ImageGenerationInput from '../../components/admin/ImageGenerationInput';
import TextGenerationInput from '../../components/admin/TextGenerationInput';

const AdminVideoEditPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { smtVideos, artists, addSmtVideo, updateSmtVideo } = useContent();
  
  const isEditing = videoId !== undefined;
  const originalVideo = isEditing ? smtVideos.find(v => v.id === videoId) : null;

  const getNewVideo = (): SmtVideo => ({
    id: `vid_${Date.now()}`,
    title: '',
    artistName: artists.length > 0 ? artists[0].name : '',
    videoUrl: '',
    thumbnailUrl: '',
    description: '',
    releaseDate: new Date().toISOString().split('T')[0],
  });

  const [video, setVideo] = useState<SmtVideo | null>(null);

  useEffect(() => {
    if (isEditing) {
      if (originalVideo) {
         if (!video || video.id !== originalVideo.id) {
            setVideo({ ...originalVideo });
        }
      }
    } else {
      if (!video) {
        setVideo(getNewVideo());
      }
    }
  }, [videoId, smtVideos, video, isEditing, originalVideo]);

  if (isEditing && !originalVideo) {
    return <NotFoundPage message="Video not found" />;
  }
  if (!video) {
    return <div>Loading...</div>;
  }

  const handleValueChange = (name: keyof SmtVideo, value: string) => {
    setVideo(prev => prev ? { ...prev, [name]: value } : null);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    handleValueChange(name as keyof SmtVideo, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!video) return;

    if (isEditing) {
      updateSmtVideo(video);
      toast.success('Video updated successfully!');
    } else {
      addSmtVideo(video);
      toast.success('Video added successfully!');
    }
    navigate('/admin/videos');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">
        {isEditing ? `Edit Video: ${video.title}` : 'Add New Video'}
      </h1>
      <form onSubmit={handleSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6">
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Title</label>
          <input type="text" name="title" value={video.title} onChange={handleChange} className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Artist</label>
          <select
            name="artistName"
            value={video.artistName}
            onChange={handleChange}
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
          >
            {artists.map(artist => (
              <option key={artist.id} value={artist.name}>{artist.name}</option>
            ))}
          </select>
        </div>
        <TextGenerationInput
            label="Description"
            value={video.description}
            onValueChange={(newValue) => handleValueChange('description', newValue)}
            placeholder="A description for the video..."
            generationContext={{ title: video.title, artistName: video.artistName, releaseDate: video.releaseDate }}
            minHeight="100px"
        />
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">YouTube Video URL</label>
          <input type="text" name="videoUrl" value={video.videoUrl} onChange={handleChange} placeholder="https://youtube.com/watch?v=..." className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Thumbnail Image URL</label>
          <ImageGenerationInput
            value={video.thumbnailUrl}
            onValueChange={(newValue) => handleValueChange('thumbnailUrl', newValue)}
            placeholder="https://... or generate"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Release Date</label>
          <input type="date" name="releaseDate" value={video.releaseDate} onChange={handleChange} className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        
        <div className="flex justify-end space-x-4">
          <button type="button" onClick={() => navigate('/admin/videos')} className="bg-brand-surface px-6 py-2 rounded-lg hover:bg-opacity-80">Cancel</button>
          <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">Save Video</button>
        </div>
      </form>
    </div>
  );
};

export default AdminVideoEditPage;
