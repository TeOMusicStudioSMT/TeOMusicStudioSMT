
import React, { useState } from 'react';
import { useContent } from '../../hooks/useContent';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const AdminSettingsPage: React.FC = () => {
  const { 
    featuredVideoUrls, updateFeaturedVideoUrls, 
    showTottCatalog, setShowTottCatalog, 
    portalUrl, updatePortalUrl,
    heroBackgroundImage, updateHeroBackgroundImage
  } = useContent();
  const { changeAdminPassword } = useAuth();
  
  const [videoUrlsText, setVideoUrlsText] = useState(featuredVideoUrls.join('\n'));
  const [localPortalUrl, setLocalPortalUrl] = useState(portalUrl);
  const [localHeroBg, setLocalHeroBg] = useState(heroBackgroundImage);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleVideoSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = videoUrlsText.split('\n').map(u => u.trim()).filter(Boolean);
    updateFeaturedVideoUrls(urls);
    toast.success('Featured Video URLs updated successfully!');
  };
  
  const handlePortalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updatePortalUrl(localPortalUrl);
    toast.success('Portal URL updated successfully!');
  };

  const handleHeroBgSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateHeroBackgroundImage(localHeroBg);
    toast.success('Homepage background image updated successfully!');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match.");
          return;
      }
      if (newPassword.length < 6) {
          toast.error("New password must be at least 6 characters long.");
          return;
      }
      const success = changeAdminPassword(currentPassword, newPassword);
      if(success) {
          toast.success("Admin password changed successfully!");
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
      } else {
          toast.error("Incorrect current password.");
      }
  }
  
  const handleTottToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
      setShowTottCatalog(e.target.checked);
      toast.success(`TOTT Catalog is now ${e.target.checked ? 'visible' : 'hidden'}.`);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Site Settings</h1>
      <div className="space-y-12">
        {/* Featured Video Settings */}
        <form onSubmit={handleVideoSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6 max-w-2xl">
          <div>
            <label htmlFor="featuredVideoUrls" className="text-lg font-semibold text-white mb-2 block">Featured Video URLs</label>
            <p className="text-sm text-brand-text-secondary mb-3">Enter the full YouTube URLs for the videos you want to feature on the homepage, one per line.</p>
            <textarea
              id="featuredVideoUrls"
              value={videoUrlsText}
              onChange={(e) => setVideoUrlsText(e.target.value)}
              className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary min-h-[120px]"
              placeholder="https://www.youtube.com/watch?v=...\nhttps://www.youtube.com/watch?v=..."
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
              Save Video Settings
            </button>
          </div>
        </form>

        {/* Portal URL Settings */}
        <form onSubmit={handlePortalSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6 max-w-2xl">
          <div>
            <label htmlFor="portalUrl" className="text-lg font-semibold text-white mb-2 block">Portal Link URL</label>
            <p className="text-sm text-brand-text-secondary mb-3">Set the destination for the 'Enter' portal button on the homepage.</p>
            <input
              id="portalUrl"
              value={localPortalUrl}
              onChange={(e) => setLocalPortalUrl(e.target.value)}
              className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="https://..."
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
              Save Portal URL
            </button>
          </div>
        </form>

        {/* Hero Background Settings */}
        <form onSubmit={handleHeroBgSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6 max-w-2xl">
          <div>
            <label htmlFor="heroBgUrl" className="text-lg font-semibold text-white mb-2 block">Homepage Hero Background</label>
            <p className="text-sm text-brand-text-secondary mb-3">Set the background image for the main hero section on the homepage.</p>
            <input
              id="heroBgUrl"
              value={localHeroBg}
              onChange={(e) => setLocalHeroBg(e.target.value)}
              className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
              placeholder="https://... or data:image/..."
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
              Save Background
            </button>
          </div>
        </form>

        {/* Admin Security Settings */}
        <form onSubmit={handlePasswordSubmit} className="bg-brand-bg p-8 rounded-lg space-y-6 max-w-2xl">
          <div>
            <label className="text-lg font-semibold text-white mb-2 block">Admin Security</label>
            <p className="text-sm text-brand-text-secondary mb-3">Change the password for the S.M.T. Control Room.</p>
          </div>
          <div className="space-y-4">
              <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current Password" className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
              <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="New Password" className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
              <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm New Password" className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"/>
          </div>
           <div className="flex justify-end">
            <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
              Change Password
            </button>
          </div>
        </form>

        {/* TOTT Catalog Management */}
         <div className="bg-brand-bg p-8 rounded-lg space-y-6 max-w-2xl">
           <div>
            <label className="text-lg font-semibold text-white mb-2 block">Zarządzanie Katalogiem "The Tip Of The Tip..."</label>
            <p className="text-sm text-brand-text-secondary mb-3">Control the visibility of the exclusive TOTT music catalog on the public site.</p>
           </div>
           <label className="flex items-center space-x-3 cursor-pointer">
              <input type="checkbox" checked={showTottCatalog} onChange={handleTottToggle} className="w-5 h-5 accent-brand-primary"/>
              <span className="text-white">Pokazuj katalog TOTT na stronie publicznej</span>
           </label>
        </div>


        {/* Treasury Integration Settings */}
        <div className="bg-brand-bg p-8 rounded-lg space-y-6 max-w-2xl opacity-50">
           <div>
            <label htmlFor="treasuryApi" className="text-lg font-semibold text-white mb-2 block">Treasury Integration</label>
            <p className="text-sm text-brand-text-secondary mb-3">Configure the S.M.T. Coin and blockchain wallet connection. (This feature is currently disabled).</p>
            <input
              id="treasuryApi"
              type="text"
              className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none cursor-not-allowed"
              placeholder="Wallet API Endpoint"
              disabled
            />
          </div>
          <div className="flex justify-end">
            <button type="button" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold cursor-not-allowed" disabled>
              Connect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;
