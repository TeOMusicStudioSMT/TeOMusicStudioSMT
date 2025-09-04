
import React, { useState } from 'react';
import toast from 'react-hot-toast';

type Permission = "camera" | "microphone";
const AVAILABLE_PERMISSIONS: Permission[] = ["camera", "microphone"];

// The initial state is hardcoded based on the provided metadata.json.
// In a real app, this would be fetched.
const initialPermissions: Permission[] = []; 

const AdminPermissionsPage: React.FC = () => {
    const [requestedPermissions, setRequestedPermissions] = useState<Set<Permission>>(
        new Set(initialPermissions)
    );
    const [isSaving, setIsSaving] = useState(false);

    const handlePermissionChange = (permission: Permission, isChecked: boolean) => {
        setRequestedPermissions(prev => {
            const newPermissions = new Set(prev);
            if (isChecked) {
                newPermissions.add(permission);
            } else {
                newPermissions.delete(permission);
            }
            return newPermissions;
        });
    };

    const handleSave = () => {
        setIsSaving(true);
        // This is a simulation. The user would need to make a follow-up request
        // asking to apply these changes, at which point the metadata.json file would be updated.
        setTimeout(() => {
            setIsSaving(false);
            toast.success("Permissions settings have been updated! (Simulation)");
        }, 1000);
    };
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">Manage Frame Permissions</h1>
            <div className="bg-brand-bg p-8 rounded-lg space-y-6 max-w-2xl">
                <div>
                    <h2 className="text-xl font-semibold text-white mb-2">Application Permissions</h2>
                    <p className="text-brand-text-secondary mb-4">
                        Select the permissions your application needs to request from the host environment, such as camera or microphone access. These will be included in the <code>metadata.json</code> file.
                    </p>
                </div>

                <div className="space-y-4">
                    {AVAILABLE_PERMISSIONS.map(permission => (
                        <label key={permission} className="flex items-center space-x-3 p-4 bg-brand-surface rounded-lg cursor-pointer hover:bg-brand-surface/70">
                            <input
                                type="checkbox"
                                checked={requestedPermissions.has(permission)}
                                onChange={(e) => handlePermissionChange(permission, e.target.checked)}
                                className="w-5 h-5 accent-brand-primary bg-brand-dark border-brand-surface rounded focus:ring-brand-primary focus:ring-2"
                            />
                            <span className="text-white font-medium capitalize">{permission}</span>
                        </label>
                    ))}
                </div>

                <div className="flex justify-end pt-4 border-t border-brand-surface">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90 disabled:opacity-50 disabled:cursor-wait"
                    >
                        {isSaving ? 'Saving...' : 'Save Permissions'}
                    </button>
                </div>
                 <div className="text-xs text-brand-text-secondary italic mt-4">
                    <strong>Note:</strong> Saving these permissions simulates an update. In a real environment, this action would modify the <code>metadata.json</code> file and might require an application restart or reload to take effect.
                </div>
            </div>
        </div>
    );
};

export default AdminPermissionsPage;
