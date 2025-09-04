
import React from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import toast from 'react-hot-toast';

const AdminVideosListPage: React.FC = () => {
  const { smtVideos, deleteSmtVideo } = useContent();

  const handleDelete = (videoId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete the video "${title}"?`)) {
      deleteSmtVideo(videoId);
      toast.success('Video deleted!');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Manage Videos</h1>
        <Link to="/admin/videos/new" className="bg-brand-primary px-4 py-2 rounded-lg font-semibold hover:opacity-90">
          Add New Video
        </Link>
      </div>
      <div className="bg-brand-bg p-6 rounded-lg">
        <div className="space-y-4">
          {smtVideos.map(video => (
            <div key={video.id} className="bg-brand-surface p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img src={video.thumbnailUrl} alt={video.title} className="w-24 h-16 rounded-md object-cover" />
                <div>
                  <h2 className="text-lg font-semibold text-white">{video.title}</h2>
                  <p className="text-sm text-brand-text-secondary">{video.artistName}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link to={`/admin/videos/${video.id}/edit`} className="text-brand-primary hover:text-white">
                  Edit
                </Link>
                <button onClick={() => handleDelete(video.id, video.title)} className="text-red-500 hover:text-red-400">
                  Delete
                </button>
              </div>
            </div>
          ))}
          {smtVideos.length === 0 && (
            <p className="text-center text-brand-text-secondary py-4">No videos have been added yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminVideosListPage;
