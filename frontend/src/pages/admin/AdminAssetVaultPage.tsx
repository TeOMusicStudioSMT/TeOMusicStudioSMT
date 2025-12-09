

import React, { useState, useMemo } from 'react';
import { useContent } from '../../hooks/useContent';
import toast from 'react-hot-toast';
import { Asset, AssetType, SoundStemCategory } from '../../types';
import { COAI_ARTISTS, SOUND_CATALOG } from '../../constants';
import { FolderIcon, ImageIcon, MusicNoteIcon, CopyIcon, Trash2Icon, ChevronRightIcon } from '../../components/icons';

const BUCKET_URL = 'gs://ai-studio-bucket-457528627948-us-west1';

const AdminAssetVaultPage: React.FC = () => {
    const { assetVault, addAsset, deleteAsset } = useContent();
    const [selectedPath, setSelectedPath] = useState('/services/ImageSMT');
    const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set(['/services/CoAi']));

    const directories = useMemo(() => ([
        { 
            name: 'CoAi', 
            path: '/services/CoAi', 
            children: COAI_ARTISTS.map(artist => ({ name: artist.name, path: `/services/CoAi/${artist.name}`, children: [] })) 
        },
        { name: 'SoundTempts', path: '/services/SoundTempts', children: [] },
        { name: 'ImageSMT', path: '/services/ImageSMT', children: [] },
        { name: 'ImageUsers', path: '/services/ImageUsers', children: [] },
    ]), []);

    const filesInCurrentPath = useMemo(() => {
        let files: (Asset & { source?: string })[] = [];
        
        if (selectedPath.startsWith('/services/CoAi/')) {
            const artistName = selectedPath.split('/')[3];
            const artist = COAI_ARTISTS.find(a => a.name === artistName);
            if (artist) {
                artist.discography.forEach(release => {
                    files.push({
                        id: release.id,
                        name: `${release.title.replace(/\s+/g, '_')}_Cover.jpg`,
                        type: AssetType.IMAGE,
                        url: release.coverImageUrl,
                    });
                });
                 artist.gallery.forEach((url, i) => {
                    files.push({
                        id: `${artist.id}-gallery-${i}`,
                        name: `gallery_image_${i + 1}.jpg`,
                        type: AssetType.IMAGE,
                        url: url
                    })
                })
            }
        } else if (selectedPath === '/services/SoundTempts') {
            files = SOUND_CATALOG.map(stem => ({ ...stem, type: AssetType.AUDIO, source: 'Catalog' }));
        } else if (selectedPath === '/services/ImageSMT') {
            files = assetVault.filter(a => a.type === AssetType.IMAGE);
        } else if (selectedPath === '/services/ImageUsers') {
            // Future: populate with user-generated images
        }
        
        return files;
    }, [selectedPath, assetVault]);
    
    const toggleDir = (path: string) => {
        setExpandedDirs(prev => {
            const newSet = new Set(prev);
            if (newSet.has(path)) {
                newSet.delete(path);
            } else {
                newSet.add(path);
            }
            return newSet;
        });
    };

    const handleDelete = (asset: Asset & { source?: string }) => {
        if (asset.source === 'Catalog') {
            toast.error("Catalog sounds cannot be deleted from the vault view.");
            return;
        }
        if (window.confirm(`Are you sure you want to delete "${asset.name}" from the vault?`)) {
            deleteAsset(asset.id);
            toast.success('Asset deleted!');
        }
    };
    
    const UploadSection = () => {
        const [selectedFile, setSelectedFile] = useState<File | null>(null);
        const [selectedCategory, setSelectedCategory] = useState<SoundStemCategory | ''>('');

        const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0] || null;
            setSelectedFile(file);
            if (file && !file.type.startsWith('audio/')) {
                setSelectedCategory('');
            }
        };

        const handleUpload = () => {
            if (!selectedFile) {
                toast.error("Please select a file first.");
                return;
            }

            const assetType = selectedFile.type.startsWith('image/') ? AssetType.IMAGE :
                              selectedFile.type.startsWith('audio/') ? AssetType.AUDIO :
                              selectedFile.type.startsWith('video/') ? AssetType.VIDEO : AssetType.IMAGE;

            const newAsset: Asset = {
                id: `asset_${Date.now()}`,
                name: selectedFile.name,
                type: assetType,
                url: URL.createObjectURL(selectedFile), // This is temporary for local display
                category: assetType === AssetType.AUDIO ? selectedCategory || undefined : undefined,
            };

            addAsset(newAsset);
            toast.success("Asset uploaded to vault!");
            setSelectedFile(null);
            setSelectedCategory('');
        };

        return (
            <div className="bg-brand-dark p-4 rounded-lg mt-8">
                <h3 className="font-bold text-white mb-4">Upload New Asset</h3>
                <input type="file" onChange={handleFileChange} className="text-sm text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-brand-primary file:text-white hover:file:bg-brand-accent"/>
                {selectedFile && selectedFile.type.startsWith('audio/') && (
                    <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value as SoundStemCategory)} className="mt-2 bg-brand-surface p-2 rounded-lg text-white">
                        <option value="">Select Category (optional)</option>
                        {Object.values(SoundStemCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                )}
                <button onClick={handleUpload} disabled={!selectedFile} className="mt-4 bg-brand-primary px-4 py-2 rounded-lg disabled:opacity-50">Upload</button>
            </div>
        );
    };

    const renderDir = (dir: { name: string, path: string, children: any[] }, level: number = 0) => (
        <div key={dir.path}>
            <div 
                onClick={() => { setSelectedPath(dir.path); if(dir.children.length > 0) toggleDir(dir.path) }} 
                className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer ${selectedPath === dir.path ? 'bg-brand-primary/20' : 'hover:bg-brand-surface/50'}`}
                style={{ paddingLeft: `${1 + level * 1.5}rem`}}
            >
                {dir.children.length > 0 && <ChevronRightIcon className={`w-4 h-4 transition-transform ${expandedDirs.has(dir.path) ? 'rotate-90' : ''}`} />}
                <FolderIcon className="w-5 h-5 text-brand-primary" />
                <span className="font-semibold text-white">{dir.name}</span>
            </div>
            {dir.children.length > 0 && expandedDirs.has(dir.path) && (
                <div>
                    {dir.children.map(child => renderDir(child, level + 1))}
                </div>
            )}
        </div>
    );

    return (
        <div>
            <h1 className="text-4xl font-extrabold text-white mb-8">Asset Vault</h1>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                <div className="md:col-span-3 bg-brand-surface p-4 rounded-lg">
                    <h2 className="font-bold text-lg text-white mb-4 px-2">Directories</h2>
                    <div className="space-y-1">
                        {directories.map(dir => renderDir(dir))}
                    </div>
                </div>
                <div className="md:col-span-9">
                    <div className="bg-brand-surface p-6 rounded-lg">
                        <h2 className="text-xl font-bold text-white mb-4">Files in <span className="text-brand-primary">{selectedPath}</span></h2>
                        <div className="space-y-2">
                            {filesInCurrentPath.map(file => (
                                <div key={file.id} className="flex items-center gap-4 p-3 bg-brand-bg rounded-lg">
                                    {file.type === AssetType.IMAGE ? <ImageIcon className="w-6 h-6 text-brand-accent"/> : <MusicNoteIcon className="w-6 h-6 text-brand-secondary"/>}
                                    <div className="flex-grow">
                                        <p className="font-semibold text-white">{file.name}</p>
                                        <p className="text-xs text-brand-text-secondary truncate max-w-md">{file.url}</p>
                                    </div>
                                    <button onClick={() => { navigator.clipboard.writeText(file.url); toast.success("URL copied!"); }} className="p-2 text-brand-text-secondary hover:text-white"><CopyIcon/></button>
                                    <button onClick={() => handleDelete(file)} className="p-2 text-brand-text-secondary hover:text-red-500"><Trash2Icon/></button>
                                </div>
                            ))}
                            {filesInCurrentPath.length === 0 && <p className="text-brand-text-secondary">No files in this directory.</p>}
                        </div>
                    </div>
                    <UploadSection />
                </div>
            </div>
        </div>
    );
};
// FIX: Add default export to make the component importable.
export default AdminAssetVaultPage;