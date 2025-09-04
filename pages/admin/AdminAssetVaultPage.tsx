import React, { useState, useMemo } from 'react';
import { useContent } from '../../hooks/useContent';
import toast from 'react-hot-toast';
import { Asset, AssetType, SoundStemCategory } from '../../types';
import { COAI_ARTISTS, SOUND_CATALOG } from '../../constants';
import { FolderIcon, ImageIcon, MusicNoteIcon, CopyIcon, Trash2Icon, ChevronRightIcon } from '../../components/icons';

const BUCKET_URL = 'gs://run-sources-cs-poc-31qxw5uyzvr3wofztvtsfan-europe-west3';

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
            
            if (assetType === AssetType.AUDIO && !selectedCategory) {
                toast.error("Please select a category for the audio file.");
                return;
            }

            const fileName = selectedFile.name.replace(/\s+/g, '_');
            const gcsUrl = `https://storage.googleapis.com/${BUCKET_URL.replace('gs://', '')}${selectedPath}/${fileName}`;

            const newAsset: Asset = {
                id: `asset_${Date.now()}`,
                name: selectedFile.name,
                type: assetType,
                url: gcsUrl,
                ...(assetType === AssetType.AUDIO && { category: selectedCategory as SoundStemCategory })
            };

            addAsset(newAsset);
            toast.success(`Simulated upload of "${selectedFile.name}" to ${selectedPath}`);

            setSelectedFile(null);
            setSelectedCategory('');
        };

        return (
             <div className="bg-brand-surface p-4 rounded-lg mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">Upload to <span className="font-mono text-brand-primary">{selectedPath}</span></h3>
                <div className="space-y-4">
                     <input
                        type="file"
                        key={selectedFile ? selectedFile.name : 'file-input'}
                        onChange={handleFileChange}
                        className="block w-full text-sm text-brand-text-secondary
                            file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0
                            file:text-sm file:font-semibold file:bg-brand-primary file:text-white
                            hover:file:bg-brand-primary/80"
                    />
                    {selectedFile && selectedFile.type.startsWith('audio/') && (
                        <div>
                             <select 
                                value={selectedCategory} 
                                onChange={(e) => setSelectedCategory(e.target.value as SoundStemCategory)}
                                className="w-full bg-brand-dark rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-brand-primary"
                            >
                                <option value="" disabled>Select an audio category...</option>
                                {Object.values(SoundStemCategory).map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                             </select>
                        </div>
                    )}
                    {selectedFile && (
                        <button onClick={handleUpload} className="bg-brand-secondary text-white font-semibold px-4 py-2 rounded-lg hover:opacity-90">
                            Add to Vault
                        </button>
                    )}
                </div>
             </div>
        )
    };
    
    const DirectoryItem: React.FC<{item: {name: string, path: string, children: any[]}, level: number}> = ({ item, level }) => (
        <>
            <div 
                className={`flex items-center justify-between p-2 rounded-md cursor-pointer ${selectedPath === item.path ? 'bg-brand-primary/20 text-white' : 'hover:bg-brand-surface text-brand-text-secondary'}`}
                onClick={() => {
                    if (item.children.length > 0) toggleDir(item.path);
                    setSelectedPath(item.path);
                }}
                style={{ paddingLeft: `${1 + level * 1.5}rem` }}
            >
                <div className="flex items-center gap-2">
                     {item.children.length > 0 && <ChevronRightIcon className={`w-4 h-4 transition-transform ${expandedDirs.has(item.path) ? 'rotate-90' : ''}`} />}
                    <FolderIcon className="w-5 h-5" />
                    <span>{item.name}</span>
                </div>
            </div>
            {item.children.length > 0 && expandedDirs.has(item.path) && (
                <div className="space-y-1">
                    {item.children.map(child => <DirectoryItem key={child.path} item={child} level={level + 1} />)}
                </div>
            )}
        </>
    );

    return (
        <div className="h-full flex flex-col">
            <h1 className="text-3xl font-bold text-white mb-4">S.M.T. Asset Vault</h1>
            <div className="bg-brand-surface p-4 rounded-lg mb-6 flex items-center justify-between">
                 <p className="text-sm text-brand-text-secondary">Cloud Bucket: <span className="font-mono text-white">{BUCKET_URL}</span></p>
                 <button onClick={() => { navigator.clipboard.writeText(BUCKET_URL); toast.success('Bucket URL copied!'); }} className="p-2 text-brand-text-secondary hover:text-white"><CopyIcon/></button>
            </div>

            <div className="flex-grow flex gap-6 overflow-hidden">
                {/* Left Panel: Directory Tree */}
                <div className="w-1/3 bg-brand-bg p-4 rounded-lg flex flex-col">
                    <h2 className="text-lg font-semibold text-white mb-3 px-2">Directories</h2>
                    <div className="flex-grow overflow-y-auto space-y-1 pr-2">
                        {directories.map(dir => <DirectoryItem key={dir.path} item={dir} level={0} />)}
                    </div>
                </div>

                {/* Right Panel: Content */}
                <div className="w-2/3 bg-brand-bg p-4 rounded-lg flex flex-col">
                    <UploadSection />
                    <h2 className="text-lg font-semibold text-white mb-3 px-2">Contents of: <span className="font-mono text-brand-primary">{selectedPath}</span></h2>
                    <div className="flex-grow overflow-y-auto space-y-2 pr-2">
                        {filesInCurrentPath.length > 0 ? filesInCurrentPath.map(asset => (
                             <div key={asset.id} className="bg-brand-surface p-3 rounded-lg flex items-center justify-between">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    {asset.type === AssetType.IMAGE && <ImageIcon className="w-6 h-6 text-brand-accent flex-shrink-0"/>}
                                    {asset.type === AssetType.AUDIO && <MusicNoteIcon className="w-6 h-6 text-brand-blue flex-shrink-0"/>}
                                    <div className="overflow-hidden">
                                        <p className="font-semibold text-white truncate">{asset.name}</p>
                                        <p className="text-xs text-brand-text-secondary truncate">{asset.url}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <button onClick={() => { navigator.clipboard.writeText(asset.url); toast.success('URL Copied');}} className="p-2 text-brand-text-secondary hover:text-white"><CopyIcon className="w-4 h-4"/></button>
                                    {asset.source !== 'Catalog' && (
                                         <button onClick={() => handleDelete(asset)} className="p-2 text-red-500 hover:text-red-400"><Trash2Icon className="w-4 h-4"/></button>
                                    )}
                                </div>
                             </div>
                        )) : (
                            <div className="text-center py-10 text-brand-text-secondary">
                                This directory is empty.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminAssetVaultPage;