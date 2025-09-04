import React, { useState, useRef } from 'react';
import { useAuth } from '../hooks/useAuth';
import * as ReactRouterDOM from 'react-router-dom';
import { SubscriptionTier, User } from '../types';
import toast from 'react-hot-toast';
import { CrownIcon, StarIcon, WalletIcon } from '../components/icons';

const MyAccountPage: React.FC = () => {
    const { user, updateUser, logout } = useAuth();
    const navigate = ReactRouterDOM.useNavigate();
    
    const [editableUser, setEditableUser] = useState<Partial<User>>({
        vanityName: user?.vanityName || user?.name,
        avatarUrl: user?.avatarUrl,
    });
    const [newAvatarFile, setNewAvatarFile] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!user) {
        return (
            <div className="text-center py-20">
                <h2 className="text-3xl font-bold text-white">My Account</h2>
                <p className="text-brand-text-secondary mt-4">You need to be signed in to view your account details.</p>
                <ReactRouterDOM.Link to="/signin" className="mt-6 inline-block bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                    Sign In
                </ReactRouterDOM.Link>
            </div>
        );
    }
    
    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const result = event.target?.result as string;
                setNewAvatarFile(result);
                setEditableUser(prev => ({ ...prev, avatarUrl: result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleProfileSave = () => {
        const updatedUserData = {
            ...user,
            vanityName: editableUser.vanityName || user.name,
            avatarUrl: newAvatarFile || user.avatarUrl,
        };
        updateUser(updatedUserData);
        toast.success("Profile updated successfully!");
    };
    
    const handleLogout = () => {
        logout();
        navigate('/');
        toast.success("You have been logged out.");
    };

    const handleDowngrade = () => {
        if (window.confirm("Are you sure you want to downgrade to the Free plan? You will lose access to premium features.")) {
            updateUser({ ...user, tier: SubscriptionTier.FREE });
            toast.success("You have been downgraded to the Free plan.");
        }
    };

    const currentAvatar = newAvatarFile || user.avatarUrl;

    return (
        <div className="bg-brand-bg min-h-screen">
            <style>{`
                .btn-secondary-outline {
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    font-weight: 600;
                    transition: all 0.2s;
                    border-width: 1px;
                    white-space: nowrap;
                }
            `}</style>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                 <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-white">My Account</h1>
                    <p className="text-lg text-brand-text-secondary mt-4 max-w-3xl mx-auto">
                       Manage your profile, subscription, and preferences.
                    </p>
                </div>
                
                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Profile Card */}
                    <div className="lg:col-span-1 bg-brand-dark p-6 rounded-xl flex flex-col items-center text-center shadow-lg">
                        <div className="relative">
                            <div className="w-32 h-32 rounded-full bg-brand-primary/20 flex items-center justify-center font-bold text-white text-5xl overflow-hidden">
                                {currentAvatar ? (
                                    <img src={currentAvatar} alt="User Avatar" className="w-full h-full object-cover"/>
                                ) : (
                                    <span>{user.avatarInitial}</span>
                                )}
                            </div>
                            <button onClick={() => fileInputRef.current?.click()} className="absolute bottom-0 right-0 bg-brand-primary text-white p-2 rounded-full hover:opacity-90 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                </svg>
                            </button>
                            <input type="file" ref={fileInputRef} onChange={handleAvatarChange} className="hidden" accept="image/*" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mt-4">{editableUser.vanityName || user.name}</h2>
                        <p className="text-sm text-brand-text-secondary">{user.email}</p>
                        <div className="mt-6 w-full space-y-4">
                            <div className="bg-brand-surface p-3 rounded-lg">
                                <p className="text-xs text-brand-text-secondary">Subscription</p>
                                <p className="text-white font-semibold flex items-center justify-center gap-1.5">
                                    {user.tier}
                                    {user.tier === SubscriptionTier.PREMIUM && <StarIcon className="w-4 h-4 text-brand-accent" />}
                                    {user.tier === SubscriptionTier.VIP && <CrownIcon className="w-4 h-4 text-yellow-400" />}
                                </p>
                            </div>
                            <div className="bg-brand-surface p-3 rounded-lg">
                                <p className="text-xs text-brand-text-secondary">SMT Points</p>
                                <p className="text-white font-semibold">{user.points.toLocaleString()}</p>
                            </div>
                            <div className="bg-brand-surface p-3 rounded-lg">
                                <p className="text-xs text-brand-text-secondary">Member Since</p>
                                <p className="text-white font-semibold">{user.memberSince}</p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Settings */}
                    <div className="lg:col-span-2 bg-brand-dark p-8 rounded-xl shadow-lg">
                       <div className="space-y-6">
                           <div>
                               <h3 className="text-xl font-bold text-white mb-2">Profile Settings</h3>
                               <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Display Name</label>
                               <input 
                                   type="text"
                                   value={editableUser.vanityName || ''}
                                   onChange={(e) => setEditableUser(prev => ({...prev, vanityName: e.target.value}))}
                                   className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white border border-transparent focus:outline-none focus:ring-2 focus:ring-brand-primary"
                               />
                           </div>
                           <div className="flex justify-end">
                               <button onClick={handleProfileSave} className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
                                   Save Profile
                               </button>
                           </div>
                       </div>
                       <div className="border-t border-brand-surface my-8"></div>
                       <div className="space-y-6">
                            <h3 className="text-xl font-bold text-white mb-2">Subscription & Billing</h3>
                            <div className="bg-brand-surface p-4 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <p className="text-brand-text-secondary">Your current plan is <span className="text-white font-bold">{user.tier}</span>.</p>
                                    <p className="text-sm text-brand-text-secondary">Manage billing or change your plan.</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <ReactRouterDOM.Link to="/subscriptions" className="btn-secondary-outline border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white">
                                        Change Plan
                                    </ReactRouterDOM.Link>
                                    {user.tier !== SubscriptionTier.FREE && (
                                        <button onClick={handleDowngrade} className="btn-secondary-outline border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black">
                                            Downgrade to Free
                                        </button>
                                    )}
                                </div>
                            </div>
                             <div className="bg-brand-surface p-4 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="text-white font-bold">SMT Point Wallet</p>
                                    <p className="text-sm text-brand-text-secondary">View your balance and purchase more points.</p>
                                </div>
                                <ReactRouterDOM.Link to="/store" className="bg-brand-surface border border-brand-primary px-4 py-2 rounded-lg font-semibold text-brand-primary hover:bg-brand-primary hover:text-white transition-colors flex items-center gap-2">
                                    <WalletIcon className="w-5 h-5" /> Go to Store
                                </ReactRouterDOM.Link>
                            </div>
                       </div>
                        <div className="border-t border-brand-surface my-8"></div>
                        <div>
                             <h3 className="text-xl font-bold text-white mb-2">Account Actions</h3>
                             <button onClick={handleLogout} className="text-red-500 hover:text-red-400 font-semibold">
                                 Logout
                             </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyAccountPage;
