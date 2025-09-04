import React from 'react';
import { useContent } from '../hooks/useContent';
import { useAuth } from '../hooks/useAuth';
import { TeoApp, SubscriptionTier } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
import { LockIcon } from '../components/icons';

const AppCard: React.FC<{ item: TeoApp }> = ({ item }) => (
    <div className="group bg-brand-surface rounded-lg overflow-hidden shadow-lg transition-transform duration-300 hover:-translate-y-2 flex flex-col">
        <div className="aspect-video overflow-hidden">
            <img 
                src={item.iconUrl} 
                alt={item.name} 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
            />
        </div>
        <div className="p-6 flex-grow flex flex-col">
            <h3 className="text-xl font-bold text-white">{item.name}</h3>
            <p className="text-brand-text-secondary mt-2 text-sm flex-grow">
                {item.description}
            </p>
            <a 
                href={item.launchUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-block text-center mt-4 text-sm font-semibold text-white bg-brand-primary rounded-lg py-2 px-4 hover:opacity-90 transition-opacity"
            >
                Launch App
            </a>
        </div>
    </div>
);


const TeoAppPage: React.FC = () => {
    const { teoApps } = useContent();
    const { user } = useAuth();
    
    const hasAccess = user && (user.tier === SubscriptionTier.PREMIUM || user.tier === SubscriptionTier.VIP);

    if (!hasAccess) {
        return (
            <div className="text-center py-20 flex flex-col items-center">
                <LockIcon className="w-16 h-16 text-brand-primary mb-4" />
                <h2 className="text-3xl font-bold text-white">Premium Access Required</h2>
                <p className="text-brand-text-secondary mt-4 max-w-lg">
                    The TeO Apps suite is an exclusive feature for our Premium and VIP members. Upgrade your plan to unlock these creative tools.
                </p>
                <ReactRouterDOM.Link to="/subscriptions" className="mt-8 inline-block bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity">
                    View Subscription Tiers
                </ReactRouterDOM.Link>
            </div>
        )
    }

    return (
        <div className="bg-brand-bg min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-extrabold text-white">TeO Apps</h1>
                    <p className="text-lg text-brand-text-secondary mt-4 max-w-3xl mx-auto">
                        Explore our suite of interactive applications, designed to enhance your musical journey and creative process.
                    </p>
                </div>
                
                {teoApps.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {teoApps.map(item => (
                            <AppCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-2xl text-white">No apps available yet.</p>
                        <p className="text-brand-text-secondary mt-2">Our developers are hard at work. Check back soon!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeoAppPage;
