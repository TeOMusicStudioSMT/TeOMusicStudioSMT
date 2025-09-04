import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import { FriendArtist } from '../../types';
import toast from 'react-hot-toast';
import NotFoundPage from '../NotFoundPage';
import ImageGenerationInput from '../../components/admin/ImageGenerationInput';
import TextGenerationInput from '../../components/admin/TextGenerationInput';

const AdminFriendArtistEditPage: React.FC = () => {
  const { friendId } = ReactRouterDOM.useParams<{ friendId: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const { friendArtists, addFriendArtist, updateFriendArtist } = useContent();
  
  const isEditing = friendId !== undefined;
  const originalFriend = isEditing ? friendArtists.find(f => f.id === friendId) : null;

  const getNewFriend = (): FriendArtist => ({
      id: `friend_${Date.now()}`,
      name: '',
      role: '',
      description: '',
      imageUrl: '',
      websiteUrl: ''
  });

  const [friend, setFriend] = useState<FriendArtist | null>(null);

  useEffect(() => {
    if (isEditing) {
      if (originalFriend && (!friend || friend.id !== originalFriend.id)) {
        setFriend({ ...originalFriend });
      }
    } else {
      if (!friend) {
        setFriend(getNewFriend());
      }
    }
  }, [friendId, friendArtists, friend, isEditing, originalFriend]);

  if (isEditing && !originalFriend) {
    return <NotFoundPage message="Friend not found" />;
  }
  if (!friend) {
      return <div>Loading...</div>;
  }

  const handleValueChange = (name: keyof FriendArtist, value: string) => {
    setFriend(prev => prev ? { ...prev, [name]: value } : null);
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    handleValueChange(name as keyof FriendArtist, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!friend || !friend.name || !friend.role) {
        toast.error("Name and Role are required fields.");
        return;
    };

    if (isEditing) {
      updateFriendArtist(friend);
      toast.success('Friend updated successfully!');
    } else {
      addFriendArtist(friend);
      toast.success('Friend added successfully!');
    }
    navigate('/admin/friends');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">
        {isEditing ? `Edit Friend: ${friend.name}` : 'Add New Friend'}
      </h1>
      <form onSubmit={handleSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6 max-w-lg">
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Name</label>
          <input type="text" name="name" value={friend.name} onChange={handleChange} className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Role / Title</label>
          <input type="text" name="role" value={friend.role} onChange={handleChange} className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        <TextGenerationInput
            label="Description"
            value={friend.description || ''}
            onValueChange={(newValue) => handleValueChange('description', newValue)}
            placeholder="A short description of this friend or collaborator."
            generationContext={{ name: friend.name, role: friend.role }}
            minHeight="100px"
        />
         <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Image URL</label>
          <ImageGenerationInput
            value={friend.imageUrl}
            onValueChange={(newValue) => handleValueChange('imageUrl', newValue)}
            placeholder="https://... or generate"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Website URL</label>
          <input type="text" name="websiteUrl" value={friend.websiteUrl} onChange={handleChange} placeholder="https://..." className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
        </div>
        
        <div className="flex justify-end space-x-4 pt-4">
            <button type="button" onClick={() => navigate('/admin/friends')} className="bg-brand-surface px-6 py-2 rounded-lg hover:bg-opacity-80">
                Cancel
            </button>
            <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
                Save Friend
            </button>
        </div>
      </form>
    </div>
  );
};

export default AdminFriendArtistEditPage;
