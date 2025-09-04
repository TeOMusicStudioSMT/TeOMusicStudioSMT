
import React, { useState } from 'react';
import { useContent } from '../../hooks/useContent';
import { StudioActionCosts } from '../../types';
import toast from 'react-hot-toast';

const AdminAccountingPage: React.FC = () => {
  const { studioCosts, updateStudioCosts } = useContent();
  const [costs, setCosts] = useState<StudioActionCosts>(studioCosts);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue >= 0) {
        setCosts(prev => ({ ...prev, [name]: numValue }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateStudioCosts(costs);
    toast.success("Studio costs updated successfully!");
  };

  const CostInput: React.FC<{ name: keyof StudioActionCosts, label: string, description: string }> = ({ name, label, description }) => (
    <div>
        <label htmlFor={name} className="text-lg font-semibold text-white mb-1 block">{label}</label>
        <p className="text-sm text-brand-text-secondary mb-2">{description}</p>
        <input
            id={name}
            name={name}
            type="number"
            value={costs[name]}
            onChange={handleChange}
            className="w-full bg-brand-surface rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
            min="0"
        />
    </div>
  );

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Points Accounting Sheet</h1>
      <form onSubmit={handleSubmit} className="bg-brand-bg p-8 rounded-lg space-y-8 max-w-2xl">
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Studio Generation Costs</h2>
          <p className="text-brand-text-secondary">
            Set the S.M.T. Point cost for each creative action in the AI Co-Creation Studio. These values will be shown to users and deducted from their balance upon use.
          </p>
        </div>
        
        <CostInput 
            name="ideaAndLyrics"
            label="Idea & Lyrics"
            description="Cost to generate the initial creative concept, lyrics, and Suno parameters."
        />
        <CostInput 
            name="soundPalette"
            label="Sound Palette"
            description="Cost to generate a set of audio stems based on an existing idea."
        />
        <CostInput 
            name="videoStoryboard"
            label="Video Storyboard"
            description="Cost to generate a 4-scene storyboard with 8 still images based on an existing idea."
        />
        <CostInput 
            name="fullProject"
            label="Full Project (All-in-One)"
            description="Cost for the one-click action to generate all components (Idea, Lyrics, Sound, Video) at once."
        />
        
        <div className="flex justify-end pt-4 border-t border-brand-surface">
            <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
                Save Cost Sheet
            </button>
        </div>
      </form>
    </div>
  );
};

export default AdminAccountingPage;
