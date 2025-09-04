
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useContent } from '../../hooks/useContent';
import { FooterContent, FooterColumn, FooterLinkItem, FooterContactItem } from '../../types';
import toast from 'react-hot-toast';
import { Trash2Icon } from '../../components/icons';

const AdminFooterEditPage: React.FC = () => {
    const navigate = useNavigate();
    const { footerContent, updateFooterContent } = useContent();
    const [localContent, setLocalContent] = useState<FooterContent>(() => JSON.parse(JSON.stringify(footerContent)));

    useEffect(() => {
        setLocalContent(JSON.parse(JSON.stringify(footerContent)));
    }, [footerContent]);

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setLocalContent(prev => ({ ...prev, [name]: value }));
    };

    const handleNestedChange = (path: (string | number)[], value: any) => {
        setLocalContent(prev => {
            const newContent = { ...prev };
            let current: any = newContent;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newContent;
        });
    };

    const addLink = (colIndex: number) => {
        const newLink: FooterLinkItem = { label: 'New Link', url: '#' };
        const newLinks = [...localContent.columns[colIndex].links, newLink];
        handleNestedChange(['columns', colIndex, 'links'], newLinks);
    };

    const removeLink = (colIndex: number, linkIndex: number) => {
        const newLinks = localContent.columns[colIndex].links.filter((_, i) => i !== linkIndex);
        handleNestedChange(['columns', colIndex, 'links'], newLinks);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateFooterContent(localContent);
        toast.success('Footer content updated successfully!');
        navigate('/admin');
    };

    return (
        <div>
            <h1 className="text-3xl font-bold text-white mb-8">Edit Footer Content</h1>
            <form onSubmit={handleSubmit} className="space-y-8">
                {/* General Info */}
                <div className="bg-brand-bg p-6 rounded-lg space-y-4">
                    <h2 className="text-xl font-semibold text-white">General Information</h2>
                    <div>
                        <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Main Description</label>
                        <textarea name="description" value={localContent.description} onChange={handleTextChange} className="input-field" rows={3} />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Artistic Project Note</label>
                        <input type="text" name="artisticProjectNote" value={localContent.artisticProjectNote} onChange={handleTextChange} className="input-field" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium text-brand-text-secondary mb-2 block">YouTube URL</label>
                            <input type="text" value={localContent.socialLinks.youtube} onChange={e => handleNestedChange(['socialLinks', 'youtube'], e.target.value)} className="input-field" />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Website/Globe URL</label>
                            <input type="text" value={localContent.socialLinks.globe} onChange={e => handleNestedChange(['socialLinks', 'globe'], e.target.value)} className="input-field" />
                        </div>
                    </div>
                </div>

                {/* Link Columns */}
                <div className="bg-brand-bg p-6 rounded-lg space-y-4">
                     <h2 className="text-xl font-semibold text-white">Link Columns</h2>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         {localContent.columns.map((col, colIndex) => (
                             <div key={colIndex} className="bg-brand-surface p-4 rounded-md space-y-3">
                                 <input
                                     type="text"
                                     value={col.title}
                                     onChange={(e) => handleNestedChange(['columns', colIndex, 'title'], e.target.value)}
                                     className="input-field font-bold"
                                 />
                                 {col.links.map((link, linkIndex) => (
                                     <div key={linkIndex} className="flex items-center gap-2">
                                         <input type="text" placeholder="Label" value={link.label} onChange={e => handleNestedChange(['columns', colIndex, 'links', linkIndex, 'label'], e.target.value)} className="input-field text-sm"/>
                                         <input type="text" placeholder="URL" value={link.url} onChange={e => handleNestedChange(['columns', colIndex, 'links', linkIndex, 'url'], e.target.value)} className="input-field text-sm"/>
                                         <button type="button" onClick={() => removeLink(colIndex, linkIndex)} className="text-red-500 hover:text-red-400 p-2"><Trash2Icon className="w-4 h-4"/></button>
                                     </div>
                                 ))}
                                 <button type="button" onClick={() => addLink(colIndex)} className="text-sm text-brand-primary hover:text-white mt-2">+ Add Link</button>
                             </div>
                         ))}
                     </div>
                </div>
                
                {/* Contact Info */}
                <div className="bg-brand-bg p-6 rounded-lg space-y-4">
                    <h2 className="text-xl font-semibold text-white">Contact Information</h2>
                    <input
                        type="text"
                        value={localContent.contactInfo.title}
                        onChange={(e) => handleNestedChange(['contactInfo', 'title'], e.target.value)}
                        className="input-field font-bold"
                    />
                    {localContent.contactInfo.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="grid grid-cols-3 gap-2 items-center">
                            <input type="text" placeholder="Label" value={item.label} onChange={e => handleNestedChange(['contactInfo', 'items', itemIndex, 'label'], e.target.value)} className="input-field text-sm"/>
                            <input type="text" placeholder="Value" value={item.value} onChange={e => handleNestedChange(['contactInfo', 'items', itemIndex, 'value'], e.target.value)} className="input-field text-sm"/>
                            <label className="flex items-center gap-2 text-sm text-white">
                                <input type="checkbox" checked={item.isLink} onChange={e => handleNestedChange(['contactInfo', 'items', itemIndex, 'isLink'], e.target.checked)} className="accent-brand-primary"/>
                                Is Link?
                            </label>
                        </div>
                    ))}
                </div>

                {/* Copyright */}
                 <div className="bg-brand-bg p-6 rounded-lg space-y-4">
                    <h2 className="text-xl font-semibold text-white">Bottom Bar</h2>
                    <div>
                        <label className="text-sm font-medium text-brand-text-secondary mb-2 block">Copyright Text (Year is automatic)</label>
                        <input type="text" name="copyrightText" value={localContent.copyrightText} onChange={handleTextChange} className="input-field" />
                    </div>
                     <div>
                        <label className="text-sm font-medium text-brand-text-secondary mb-2 block">"Made With" Text</label>
                        <input type="text" name="poweredByText" value={localContent.poweredByText} onChange={handleTextChange} className="input-field" />
                    </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                    <button type="button" onClick={() => navigate('/admin')} className="bg-brand-surface px-6 py-2 rounded-lg hover:bg-opacity-80">
                        Cancel
                    </button>
                    <button type="submit" className="bg-brand-primary px-6 py-2 rounded-lg font-semibold hover:opacity-90">
                        Save Footer
                    </button>
                </div>
            </form>
            <style>{`.input-field {
                width: 100%;
                background-color: #242038;
                border-radius: 0.5rem;
                padding: 0.5rem 0.75rem;
                color: white;
                border: 1px solid #1A1625;
            }
            .input-field:focus {
                outline: none;
                border-color: #8A42DB;
            }`}</style>
        </div>
    );
};

export default AdminFooterEditPage;
