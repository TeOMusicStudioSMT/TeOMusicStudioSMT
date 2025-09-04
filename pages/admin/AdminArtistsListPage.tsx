import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import { ArrowRightIcon } from '../../components/icons';

const AdminArtistsListPage: React.FC = () => {
  const { artists } = useContent();

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Manage Artists</h1>
      <div className="bg-brand-bg p-6 rounded-lg">
        <div className="space-y-4">
          {artists.map(artist => (
            <div key={artist.id} className="bg-brand-surface p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img src={artist.imageUrl} alt={artist.name} className="w-16 h-16 rounded-md object-cover" />
                <div>
                  <h2 className="text-lg font-semibold text-white">{artist.name}</h2>
                  <p className="text-sm text-brand-text-secondary">{artist.genre}</p>
                </div>
              </div>
              <ReactRouterDOM.Link
                to={`/admin/artists/${artist.id}/edit`}
                className="flex items-center space-x-2 text-brand-primary hover:text-white transition-colors"
              >
                <span>Edit</span>
                <ArrowRightIcon className="w-4 h-4" />
              </ReactRouterDOM.Link>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminArtistsListPage;
