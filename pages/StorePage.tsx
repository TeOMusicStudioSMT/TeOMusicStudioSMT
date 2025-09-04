import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { POINT_PACKAGES, DAILY_POINT_ALLOWANCE } from '../constants';
import { PointPackage, SubscriptionTier } from '../types';
import * as ReactRouterDOM from 'react-router-dom';
import toast from 'react-hot-toast';
import { StarIcon, BitcoinIcon, InfoIcon } from '../components/icons';

const PackageCard: React.FC<{ pkg: PointPackage, onPurchase: (points: number) => void, isLoggedIn: boolean }> = ({ pkg, onPurchase, isLoggedIn }) => {
    return (
        <div className={`relative border rounded-xl p-8 flex flex-col transition-all duration-300 ${
            pkg.bestValue ? 'border-brand-primary bg-brand-surface shadow-2xl shadow-brand-primary/20 scale-105' : 'border-brand-surface bg-brand-bg hover:bg-brand-surface/50'
        }`}>
            {pkg.bestValue && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-primary text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                    Best Value
                </div>
            )}
            <div className="flex-grow">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    {pkg.points.toLocaleString()} SMT
                </h3>
                <p className="text-brand-text-secondary">Points Package</p>
                <p className="text-4xl font-extrabold text-white my-4">${pkg.price} <span className="text-base font-normal text-brand-text-secondary">{pkg.currency}</span></p>
            </div>
            {isLoggedIn ? (
                <button
                    onClick={() => onPurchase(pkg.points)}
                    className={`mt-8 w-full py-3 rounded-lg font-semibold text-lg transition-colors duration-200 ${
                        pkg.bestValue
                        ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:opacity-90'
                        : 'bg-brand-surface text-white hover:bg-brand-primary'
                    }`}
                >
                    Buy Now
                </button>
            ) : (
                 <ReactRouterDOM.Link to="/signin"
                    className="mt-8 w-full block text-center py-3 rounded-lg font-semibold text-lg transition-colors duration-200 bg-brand-surface text-white hover:bg-brand-primary"
                 >
                    Sign In to Buy
                </ReactRouterDOM.Link>
            )}
        </div>
    );
};


const StorePage: React.FC = () => {
    const { user, updateUser } = useAuth();

    const handlePurchase = (points: number) => {
        if (!user) return;
        toast.loading('Processing transaction...', {id: 'purchase-toast'});
        setTimeout(() => {
            updateUser({ ...user, points: user.points + points });
            toast.success(`Successfully added ${points.toLocaleString()} SMT Points!`, {id: 'purchase-toast'});
        }, 1500);
    };
    
    const dailyAllowance = user ? DAILY_POINT_ALLOWANCE[user.tier] : 0;

    return (
        <div className="bg-brand-dark min-h-screen">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white">S.M.T. Points Store</h1>
                    <p className="text-lg text-brand-text-secondary mt-4 max-w-3xl mx-auto">
                        Fuel your creativity. Purchase S.M.T. Points to use in the Studio, Image Generator, and other creative apps.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-center">
                    {POINT_PACKAGES.map(pkg => (
                        <PackageCard key={pkg.id} pkg={pkg} onPurchase={handlePurchase} isLoggedIn={!!user} />
                    ))}
                </div>

                {user && (
                    <div className="max-w-4xl mx-auto mt-16 bg-brand-surface border border-brand-primary/30 rounded-lg p-6 text-center">
                        <h3 className="text-xl font-bold text-white">Your Daily Allowance</h3>
                        <p className="text-brand-text-secondary mt-2">
                           As a <span className="font-bold text-brand-primary">{user.tier}</span> member, you receive <span className="font-bold text-white">{dailyAllowance} SMT Points</span> every day for free! Need more? Top up with one of the packages above.
                        </p>
                    </div>
                )}
                
                <div className="max-w-4xl mx-auto mt-12 bg-brand-bg border border-yellow-400/30 rounded-lg p-8 flex items-center gap-6">
                    <BitcoinIcon className="w-16 h-16 text-yellow-400 flex-shrink-0" />
                    <div>
                        <h3 className="text-2xl font-bold text-yellow-400">Building the Future S.M.Tcoin Treasury</h3>
                        <p className="text-brand-text-secondary mt-2">
                           Your support is foundational. 50% of all proceeds from S.M.T. Point sales are allocated directly to our secure treasury, building the underlying value for the future launch of our official cryptocurrency, S.M.Tcoin.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StorePage;
