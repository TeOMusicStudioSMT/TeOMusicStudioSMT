

import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { ArrowRightIcon } from '../../components/icons';
import { PageID } from '../../types';

const pagesToManage: { id: PageID; name: string }[] = [
    { id: 'about', name: 'About Us Page' },
    { id: 'store', name: 'Store Page' },
    { id: 'support', name: 'Support Page' },
    { id: 'press', name: 'Press Page' },
    { id: 'privacy', name: 'Privacy Policy' },
    { id: 'terms', name: 'Terms of Service' },
    { id: 'cookies', name: 'Cookie Policy' },
    { id: 'dmca', name: 'DMCA Policy' },
];

const AdminPagesListPage: React.FC = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Manage Static Pages</h1>
      <div className="bg-brand-bg p-6 rounded-lg">
        <div className="space-y-4">
          {pagesToManage.map(page => (
            <div key={page.id} className="bg-brand-surface p-4 rounded-lg flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">{page.name}</h2>
              <ReactRouterDOM.Link
                to={`/admin/pages/${page.id}/edit`}
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

export default AdminPagesListPage;
