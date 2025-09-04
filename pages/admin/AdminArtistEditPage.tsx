

import React, { useState, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import { Artist, Release, Track, AssetType } from '../../types';
import toast from 'react-hot-toast';
import NotFoundPage from '../NotFoundPage';
import { ImageGenerationInput as AssetInput } from '../../components/admin/ImageGenerationInput';
import TextGenerationInput from '../../components/admin/TextGenerationInput';
import { generateTrackDescription } from '../../services/geminiService';
import { SparklesIcon } from '../../components/icons';

const AdminArtistEditPage: React.FC = () => {
  const { artistId } = ReactRouterDOM.useParams<{ artistId: string }>();
  const navigate = ReactRouterDOM.useNavigate();
  const { artists, updateArtist } = useContent();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [generatingDescForTrack, setGeneratingDescForTrack] = useState<string | null>(null);

  useEffect(() => {
    // Only set the local state if the component is loading a new artist.
    // This prevents overwriting the user's input on re-renders.
    const foundArtist = artists.find(a => a.id === artistId);
    if (foundArtist) {
        if (!artist || artist.id !== foundArtist.id) {
             setArtist(JSON.parse(JSON.stringify(foundArtist)));
        }
    } else {
        setArtist(null);
    }
  }, [artistId, artists, artist]);

  if (!artist) {
    return <NotFoundPage message="Artist not found" />;
  }

  const handleArtistValueChange = (name: keyof Artist, value: string | string[]) => {
      setArtist(prev => prev ? { ...prev, [name]: value } : null);
  }

  const handleArtistChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    handleArtistValueChange(name as keyof Artist, value);
  };
  
  const handleReleaseChange = (releaseId: string, field: keyof Release, value: string) => {
    setArtist(prev => {
        if (!prev) return null;
        const newDiscography = prev.discography.map(release => 
            release.id === releaseId ? { ...release, [field]: value } : release
        );
        return { ...prev, discography: newDiscography };
    });
  };

  const handleTrackChange = (releaseId: string, trackId: string, field: keyof Track, value: string) => {
     setArtist(prev => {
        if (!prev) return null;
        const newDiscography = prev.discography.map(release => {
            if (release.id === releaseId) {
                const newTracks = release.tracks.map(track => 
                    track.id === trackId ? { ...track, [field]: value } : track
                );
                return { ...release, tracks: newTracks };
            }
            return release;
        });
        return { ...prev, discography: newDiscography };
    });
  };

  const handleAddRelease = () => {
    setArtist(prev => {
        if (!prev) return null;
        const newRelease: Release = {
            id: `release-${Date.now()}`,
            title: 'New Release',
            type: 'Single',
            coverImageUrl: '',
            tracks: []
        };
        return { ...prev, discography: [...prev.discography, newRelease]};
    });
  };

  const handleDeleteRelease = (releaseId: string) => {
      if (!window.confirm("Are you sure you want to delete this entire release and all its tracks?")) return;
      setArtist(prev => {
          if (!prev) return null;
          return { ...prev, discography: prev.discography.filter(r => r.id !== releaseId)};
      });
  };

  const handleAddTrack = (releaseId: string) => {
      setArtist(prev => {
          if (!prev) return null;
          const newTrack: Track = {
              id: `track-${Date.now()}`,
              title: 'New Track',
              sourceUrl: ''
          };
          const newDiscography = prev.discography.map(release => {
              if (release.id === releaseId) {
                  return { ...release, tracks: [...release.tracks, newTrack]};
              }
              return release;
          });
          return { ...prev, discography: newDiscography };
      });
  };

  const handleDeleteTrack = (releaseId: string, trackId: string) => {
      setArtist(prev => {
          if (!prev) return null;
           const newDiscography = prev.discography.map(release => {
              if (release.id === releaseId) {
                  const newTracks = release.tracks.filter(t => t.id !== trackId);
                  return { ...release, tracks: newTracks };
              }
              return release;
          });
          return { ...prev, discography: newDiscography };
      });
  };

  const handleGalleryChange = (index: number, value: string) => {
    setArtist(prev => {
        if (!prev) return null;
        const newGallery = [...prev.gallery];
        newGallery[index] = value;
        return { ...prev, gallery: newGallery };
    });
  };

  const handleAddGalleryImage = () => {
      setArtist(prev => {
          if (!prev) return null;
          return { ...prev, gallery: [...prev.gallery, ''] };
      });
  };

  const handleDeleteGalleryImage = (index: number) => {
      if (!window.confirm("Are you sure you want to delete this gallery image?")) return;
      setArtist(prev => {
          if (!prev) return null;
          return { ...prev, gallery: prev.gallery.filter((_, i) => i !== index) };
      });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (artist) {
      updateArtist(artist);
      toast.success(`${artist.name}'s profile updated successfully!`);
      navigate('/admin/artists');
    }
  };

  const handleGenerateDescription = async (releaseId: string, track: Track) => {
    if (!artist) return;
    setGeneratingDescForTrack(track.id);
    try {
        const description = await generateTrackDescription(track.title, artist);
        handleTrackChange(releaseId, track.id, 'description', description);
        toast.success(`Description generated for "${track.title}"!`);
    } catch (e: any) {
        toast.error(e.message || "Failed to generate description.");
    } finally {
        setGeneratingDescForTrack(null);
    }
}

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Edit Artist: <span className="text-brand-primary">{artist.name}</span></h1>
      <form onSubmit={handleSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6">
        {/* Artist Details */}
        <fieldset className="space-y-4 border-b border-brand-surface pb-6">
            <legend className="text-xl font-semibold text-white mb-4">Artist Details</legend>
            <div>
                <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Artist Name</label>
                <input type="text" name="name" value={artist.name} onChange={handleArtistChange} placeholder="Artist Name" className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <div>
                <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Genre</label>
                <input type="text" name="genre" value={artist.genre} onChange={handleArtistChange} placeholder="Genre" className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary" />
            </div>
            <AssetInput
                assetType={AssetType.IMAGE}
                value={artist.imageUrl}
                onValueChange={(newValue) => handleArtistValueChange('imageUrl', newValue)}
                placeholder="https://... or select/generate"
            />
            <AssetInput
                assetType={AssetType.IMAGE}
                value={artist.headerImageUrl}
                onValueChange={(newValue) => handleArtistValueChange('headerImageUrl', newValue)}
                placeholder="https://... or select/generate"
            />
            <TextGenerationInput
                label="Biography"
                value={artist.bio}
                onValueChange={(newValue) => handleArtistValueChange('bio', newValue)}
                placeholder="A short, engaging biography for the artist..."
                generationContext={{ name: artist.name, genre: artist.genre, personality: artist.personality }}
                minHeight="200px"
            />
        </fieldset>

        {/* Gallery Management */}
        <fieldset className="space-y-4 border-b border-brand-surface pb-6">
            <legend className="text-xl font-semibold text-white mb-4">Gallery Management</legend>
            <div className="space-y-4">
                {artist.gallery.map((imgSrc, index) => (
                    <div key={index} className="flex items-center gap-4">
                        <img src={imgSrc || 'https://via.placeholder.com/150x96'} alt={`Gallery item ${index + 1}`} className="w-24 h-16 rounded object-cover bg-brand-dark flex-shrink-0" />
                        <div className="flex-grow">
                            <AssetInput
                                assetType={AssetType.IMAGE}
                                value={imgSrc}
                                onValueChange={(newValue) => handleGalleryChange(index, newValue)}
                                placeholder="Image URL or select/generate..."
                                inputClassName="w-full bg-brand-dark rounded-md px-3 py-2 pr-20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                        <button 
                            type="button" 
                            onClick={() => handleDeleteGalleryImage(index)} 
                            className="text-red-500 hover:text-red-400 font-semibold flex-shrink-0"
                        >
                            Delete
                        </button>
                    </div>
                ))}
            </div>
            <button 
                type="button" 
                onClick={handleAddGalleryImage} 
                className="mt-6 bg-brand-primary/20 text-brand-primary font-semibold px-4 py-2 rounded-lg hover:bg-brand-primary hover:text-white transition-colors"
            >
                + Add Gallery Image
            </button>
        </fieldset>


        {/* Discography Management */}
        <fieldset className="space-y-4 pt-6">
            <legend className="text-xl font-semibold text-white mb-4">Discography Management</legend>
            <div className="space-y-6">
            {artist.discography.map((release) => (
                <div key={release.id} className="bg-brand-surface p-4 rounded-lg space-y-4 border border-brand-primary/20">
                    <div className="flex justify-between items-start">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow">
                            <input type="text" value={release.title} onChange={(e) => handleReleaseChange(release.id, 'title', e.target.value)} placeholder="Release Title" className="bg-brand-dark rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
                            <select value={release.type} onChange={(e) => handleReleaseChange(release.id, 'type', e.target.value)} className="bg-brand-dark rounded-md px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary">
                                <option value="Album">Album</option>
                                <option value="EP">EP</option>
                                <option value="Single">Single</option>
                            </select>
                            <AssetInput
                                assetType={AssetType.IMAGE}
                                value={release.coverImageUrl}
                                onValueChange={(newValue) => handleReleaseChange(release.id, 'coverImageUrl', newValue)}
                                placeholder="https://... or select/generate"
                                inputClassName="w-full bg-brand-dark rounded-md px-3 py-2 pr-20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            />
                        </div>
                        <button type="button" onClick={() => handleDeleteRelease(release.id)} className="ml-4 text-red-500 hover:text-red-400 font-semibold">Delete Release</button>
                    </div>

                    <div className="border-t border-brand-primary/10 pt-4 space-y-2">
                        <h4 className="text-sm font-semibold text-brand-text-secondary">Tracks in this release:</h4>
                        {release.tracks.map((track) => (
                            <div key={track.id} className="bg-brand-dark p-3 rounded-md space-y-2">
                                <div className="flex items-center gap-2">
                                    <input type="text" value={track.title} onChange={(e) => handleTrackChange(release.id, track.id, 'title', e.target.value)} placeholder="Track Title" className="flex-grow bg-brand-bg rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
                                    <AssetInput
                                        assetType={AssetType.AUDIO}
                                        value={track.sourceUrl || ''}
                                        onValueChange={(newValue) => handleTrackChange(release.id, track.id, 'sourceUrl', newValue)}
                                        placeholder="Source URL or select from vault"
                                        inputClassName="flex-grow bg-brand-bg rounded-md px-3 py-2 pr-20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                    />
                                    <button type="button" onClick={() => handleDeleteTrack(release.id, track.id)} className="text-red-500 hover:text-red-400 text-xs">Delete</button>
                                </div>
                                <div className="flex items-center gap-2">
                                    <textarea
                                        value={track.description || ''}
                                        onChange={(e) => handleTrackChange(release.id, track.id, 'description', e.target.value)}
                                        placeholder="Track description..."
                                        className="flex-grow bg-brand-bg rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary"
                                        rows={2}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleGenerateDescription(release.id, track)}
                                        disabled={generatingDescForTrack === track.id}
                                        className="p-2 rounded-full bg-brand-primary/20 text-brand-primary hover:bg-brand-primary hover:text-white transition-colors disabled:opacity-50"
                                        title="Generate Description"
                                    >
                                        {generatingDescForTrack === track.id
                                            ? <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                                            : <SparklesIcon className="w-5 h-5"/>
                                        }
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button type="button" onClick={() => handleAddTrack(release.id)} className="text-sm text-brand-primary hover:text-white mt-2">+ Add Track</button>
                    </div>
                </div>
            ))}
            </div>
            <button type="button" onClick={handleAddRelease} className="mt-6 bg-brand-primary/20 text-brand-primary font-semibold px-4 py-2 rounded-lg hover:bg-brand-primary hover:text-white transition-colors">
                + Add New Release
            </button>
        </fieldset>

        <div className="flex justify-end space-x-4 pt-6">
            <button type="button" onClick={() => navigate('/admin/artists')} className="bg-brand-surface px-6 py-2 rounded-lg hover:bg-opacity-80">Cancel</button>
            <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">Save Changes</button>
        </div>
      </form>
    </div>
  );
};

export default AdminArtistEditPage;