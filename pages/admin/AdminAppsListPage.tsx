
import React from 'react';
import { Link } from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import toast from 'react-hot-toast';
import { TeoApp } from '../../types';

const AdminAppsListPage: React.FC = () => {
  const { teoApps, deleteTeoApp } = useContent();

  const handleDelete = (appId: string) => {
    const appToDelete = teoApps.find(app => app.id === appId);
    if (appToDelete && window.confirm(`Are you sure you want to delete the app "${appToDelete.name}"?`)) {
      deleteTeoApp(appId);
      toast.success('App deleted!');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Manage TeO Apps</h1>
        <Link to="/admin/apps/new" className="bg-brand-primary px-4 py-2 rounded-lg font-semibold hover:opacity-90">
          Add New App
        </Link>
      </div>
      <div className="bg-brand-bg p-6 rounded-lg">
        <div className="space-y-4">
          {teoApps.map(app => (
            <div key={app.id} className="bg-brand-surface p-4 rounded-lg flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <img src={app.iconUrl} alt={app.name} className="w-16 h-16 rounded-md object-cover" />
                <div>
                  <h2 className="text-lg font-semibold text-white">{app.name}</h2>
                  <p className="text-sm text-brand-text-secondary">{app.description}</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <Link to={`/admin/apps/${app.id}/edit`} className="text-brand-primary hover:text-white">
                  Edit
                </Link>
                <button onClick={() => handleDelete(app.id)} className="text-red-500 hover:text-red-400">
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

export default AdminAppsListPage;
