import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserProject, UserProjectType } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
import { ImageIcon, MicIcon, FolderIcon } from '../components/icons';

const ProjectCard: React.FC<{ project: UserProject }> = ({ project }) => {
    const navigate = ReactRouterDOM.useNavigate();
    const isImage = project.type === UserProjectType.SAVED_IMAGE;
    const isStudioProject = project.type === UserProjectType.STUDIO_PROJECT;

    const handleClick = () => {
        if (isStudioProject) {
            navigate('/studio', { state: { savedProject: project } });
        }
        // Future enhancement: click image projects to open a modal view.
    };

    return (
        <div 
            onClick={handleClick}
            className={`bg-brand-surface rounded-lg p-4 flex flex-col group hover:shadow-lg hover:shadow-brand-primary/20 transition-shadow ${isStudioProject ? 'cursor-pointer' : ''}`}
        >
            {isImage && project.content.imageUrl && (
                <img src={project.content.imageUrl} alt={project.title} className="w-full h-40 object-cover rounded-md mb-4"/>
            )}
            <div className="flex-grow">
                <div className="flex items-center gap-2 text-brand-primary text-sm font-bold mb-1">
                    {isImage ? <ImageIcon className="w-4 h-4"/> : <MicIcon className="w-4 h-4"/>}
                    <span>{project.type}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{project.title}</h3>
                <p className="text-sm text-brand-text-secondary mt-1 line-clamp-2">{project.description}</p>
            </div>
             <p className="text-xs text-brand-text-secondary mt-3 pt-3 border-t border-brand-primary/10">
                Saved on: {new Date(project.timestamp).toLocaleDateString()}
            </p>
        </div>
    )
}

const MyProjectsPage: React.FC = () => {
    const { user } = useAuth();

    if (!user) {
        return (
            <div className="text-center py-20">
                <h2 className="text-3xl font-bold text-white">My Projects</h2>
                <p className="text-brand-text-secondary mt-4">You need to be signed in to view your projects.</p>
                <ReactRouterDOM.Link to="/signin" className="mt-6 inline-block bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                    Sign In
                </ReactRouterDOM.Link>
            </div>
        );
    }

    const savedProjects = user.projects || [];

    return (
        <div className="bg-brand-bg min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-white">My Creative Projects</h1>
                    <p className="text-lg text-brand-text-secondary mt-4 max-w-3xl mx-auto">
                        Your personal space for saved images, studio drafts, and other creative assets.
                    </p>
                </div>
                
                {savedProjects.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {savedProjects.map(project => (
                            <ProjectCard key={project.id} project={project} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 border-2 border-dashed border-brand-surface rounded-lg">
                        <FolderIcon className="w-16 h-16 text-brand-text-secondary mx-auto mb-4"/>
                        <p className="text-2xl text-white">Your Project Space is Empty</p>
                        <p className="text-brand-text-secondary mt-2">
                            Go to the <ReactRouterDOM.Link to="/image-generator" className="text-brand-primary hover:underline">Image Generator</ReactRouterDOM.Link> to save your first creation.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MyProjectsPage;
