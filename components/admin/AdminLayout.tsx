import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { BrainCircuitIcon, MusicNoteIcon, FileTextIcon, UsersIcon, SettingsIcon } from '../icons';

const AdminLayout: React.FC = () => {

    const navItemClasses = ({ isActive }: { isActive: boolean }) => 
        `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
            isActive ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:bg-brand-surface hover:text-white'
        }`;

    return (
        <div className="flex h-screen bg-brand-dark text-white">
            <aside className="w-64 bg-brand-surface flex flex-col p-4">
                <h1 className="text-2xl font-bold text-white mb-8 px-2">Admin Panel</h1>
                <nav className="flex-grow space-y-2">
                    <NavLink to="/admin/jason-dashboard" className={navItemClasses}>
                        <BrainCircuitIcon className="w-5 h-5" />
                        <span>Jason's Dashboard</span>
                    </NavLink>
                    <NavLink to="/admin/content-manager" className={navItemClasses}>
                        <MusicNoteIcon className="w-5 h-5" />
                        <span>Content Manager</span>
                    </NavLink>
                    <NavLink to="/admin/users" className={navItemClasses}>
                        <UsersIcon className="w-5 h-5" />
                        <span>User Management</span>
                    </NavLink>
                    <NavLink to="/admin/pages" className={navItemClasses}>
                        <FileTextIcon className="w-5 h-5" />
                        <span>Static Pages</span>
                    </NavLink>
                </nav>
                <div>
                     <NavLink to="/admin/settings" className={navItemClasses}>
                        <SettingsIcon className="w-5 h-5" />
                        <span>Settings</span>
                    </NavLink>
                </div>
            </aside>
            <main className="flex-1 p-8 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;