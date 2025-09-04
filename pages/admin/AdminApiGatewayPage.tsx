
import React, { useState } from 'react';
import { useContent } from '../../hooks/useContent';
import { ApiKeys } from '../../types';
import toast from 'react-hot-toast';
import { InfoIcon } from '../../components/icons';

const AdminApiGatewayPage: React.FC = () => {
    const { apiKeys, updateApiKeys } = useContent();
    const [keys, setKeys] = useState<ApiKeys>(apiKeys);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setKeys(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateApiKeys(keys);
        toast.success("API Keys saved successfully!");
    };

    const ApiKeyInput: React.FC<{ name: keyof ApiKeys, label: string }> = ({ name, label }) => (
        <div>
            <label htmlFor={name} className="text-lg font-semibold text-white mb-2 block">{label}</label>
            <input
                id={name}
                name={name}
                type="password"
                value={keys[name]}
                onChange={handleChange}
                className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                autoComplete="new-password"
            />
        </div>
    );

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">API Gateway</h1>
            <div className="bg-brand-bg p-8 rounded-lg space-y-8 max-w-2xl">
                <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Manage API Keys</h2>
                    <p className="text-brand-text-secondary">
                        Store and manage API keys for external services used by the S.M.T. platform.
                    </p>
                </div>

                <div className="bg-yellow-900/50 border border-yellow-700 text-yellow-300 px-4 py-3 rounded-lg flex gap-3">
                    <InfoIcon className="w-6 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                        <h4 className="font-bold">Security Warning</h4>
                        <p className="text-sm">
                            Storing API keys in local storage is not secure for production environments. For the Gemini API to function, its key must also be set as the <code>API_KEY</code> environment variable in the deployment environment. This panel should be used for reference and development purposes only.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <ApiKeyInput name="gemini" label="Google Gemini API Key" />
                    <ApiKeyInput name="stability" label="Stability.ai API Key" />
                    <ApiKeyInput name="other" label="Other API Key" />

                    <div className="flex justify-end pt-4 border-t border-brand-surface">
                        <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
                            Save Keys
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminApiGatewayPage;
