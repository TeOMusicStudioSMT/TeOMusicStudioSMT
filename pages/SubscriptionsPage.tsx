
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { SUBSCRIPTION_TIERS_DATA } from '../constants';
import { SubscriptionTierInfo } from '../types';
import { StarIcon, CrownIcon, CopyIcon, XIcon, InfoIcon } from '../components/icons';
import toast from 'react-hot-toast';

type BillingCycle = 'monthly' | 'annually';

const PaymentInstructionsModal: React.FC<{
    tierInfo: SubscriptionTierInfo;
    billingCycle: BillingCycle;
    userEmail: string;
    onClose: () => void;
}> = ({ tierInfo, billingCycle, userEmail, onClose }) => {
    const isAnnual = billingCycle === 'annually' && tierInfo.yearlyPrice;
    const displayPrice = isAnnual ? tierInfo.yearlyPrice : tierInfo.price;
    const priceNumber = isAnnual ? tierInfo.yearlyPrice?.replace('$', '') : tierInfo.price.replace('$', '');

    const copyToClipboard = (text: string, message: string = "Copied to clipboard!") => {
        navigator.clipboard.writeText(text);
        toast.success(message);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-brand-bg rounded-xl shadow-2xl w-full max-w-2xl p-8 relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-4 right-4 text-brand-text-secondary hover:text-white"><XIcon className="w-6 h-6"/></button>
                <h2 className="text-3xl font-bold text-white mb-4">Manual Subscription Activation</h2>
                <p className="text-brand-text-secondary mb-6">
                    Thank you for supporting this artistic project! As we are in an early development phase, subscriptions are handled manually. Please follow the steps below to activate your <span className="text-brand-primary font-bold">{tierInfo.tier} ({billingCycle})</span> plan.
                </p>

                <div className="space-y-4 text-brand-text">
                    <div className="bg-brand-surface p-4 rounded-lg">
                        <p className="font-bold text-lg">1. Transfer Payment</p>
                        <p className="text-sm text-brand-text-secondary">Transfer <span className="font-bold text-white text-base">{priceNumber} EUR</span> to the following bank account:</p>
                        <div className="mt-3 bg-brand-dark p-3 rounded-md space-y-2">
                            <p className="text-xs">Recipient: <span className="font-mono text-white">Studio Teo</span></p>
                            <div className="flex justify-between items-center">
                                <p className="text-xs">IBAN: <span className="font-mono text-white">DE47 3245 0000 5499 00</span></p>
                                <button onClick={() => copyToClipboard('DE4732450000549900', 'IBAN Copied!')} className="p-1 text-brand-text-secondary hover:text-white"><CopyIcon className="w-4 h-4"/></button>
                            </div>
                            <div className="flex justify-between items-center">
                                <p className="text-xs">BIC: <span className="font-mono text-white">WELADED1KLE</span></p>
                                <button onClick={() => copyToClipboard('WELADED1KLE', 'BIC Copied!')} className="p-1 text-brand-text-secondary hover:text-white"><CopyIcon className="w-4 h-4"/></button>
                            </div>
                            <p className="text-xs">Bank: <span className="font-mono text-white">Sparkasse Rhein-Maas</span></p>
                        </div>
                    </div>
                    <div className="bg-brand-surface p-4 rounded-lg">
                        <p className="font-bold text-lg">2. Include Your Email in Transfer Description</p>
                        <p className="text-sm text-brand-text-secondary">This is a crucial step for us to identify your payment. Please include this email in the payment reference/description:</p>
                         <div className="mt-2 flex justify-between items-center bg-brand-dark p-2 rounded-md">
                            <p className="font-mono text-brand-accent">{userEmail}</p>
                            <button onClick={() => copyToClipboard(userEmail, 'Email Copied!')} className="p-1 text-brand-text-secondary hover:text-white"><CopyIcon className="w-4 h-4"/></button>
                         </div>
                    </div>
                     <div className="bg-brand-surface p-4 rounded-lg">
                        <p className="font-bold text-lg">3. Activation</p>
                        <p className="text-sm text-brand-text-secondary">Once payment is confirmed, we will manually upgrade your account within 24-48 hours. To speed up the process, you can send the transaction receipt to <a href="mailto:support@teo.center" className="text-brand-primary hover:underline">support@teo.center</a>.</p>
                    </div>
                </div>
                
                <button onClick={onClose} className="mt-6 w-full py-3 bg-brand-primary rounded-lg font-semibold hover:opacity-90 text-lg">
                    I Understand
                </button>
            </div>
        </div>
    );
};


const TierCard: React.FC<{ 
    tierInfo: SubscriptionTierInfo, 
    billingCycle: BillingCycle,
    onChoosePlan: (tierInfo: SubscriptionTierInfo) => void 
}> = ({ tierInfo, billingCycle, onChoosePlan }) => {
    const { user } = useAuth();
    const isCurrentPlan = user?.tier === tierInfo.tier;

    const isAnnual = billingCycle === 'annually';
    const displayPrice = isAnnual && tierInfo.yearlyPrice ? tierInfo.yearlyPrice : tierInfo.price;
    const displayPriceDesc = isAnnual && tierInfo.yearlyPriceDescription ? tierInfo.yearlyPriceDescription : tierInfo.priceDescription;
    const discount = isAnnual ? tierInfo.yearlyDiscount : null;
    const canBeAnnual = tierInfo.tier !== 'Free' && tierInfo.yearlyPrice;

    return (
        <div className={`relative border rounded-xl p-8 flex flex-col ${
            tierInfo.isFeatured ? 'border-brand-primary bg-brand-surface shadow-2xl shadow-brand-primary/20' : 'border-brand-surface bg-brand-bg'
        }`}>
            {discount && (
                <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-brand-secondary text-white text-xs font-bold px-3 py-1 rounded-full uppercase">
                    {discount}
                </div>
            )}
            <div className="flex-grow">
                <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                    {tierInfo.tier === 'VIP' && <CrownIcon className="w-6 h-6 text-yellow-400" />}
                    {tierInfo.tier}
                </h3>
                <p className="text-4xl font-extrabold text-white my-4">{canBeAnnual ? displayPrice : tierInfo.price} 
                    <span className="text-base font-normal text-brand-text-secondary"> {canBeAnnual ? displayPriceDesc : tierInfo.priceDescription}</span>
                </p>
                <ul className="space-y-3 text-brand-text-secondary">
                    {tierInfo.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                           <StarIcon className="w-4 h-4 text-brand-primary mr-3 mt-1 flex-shrink-0" />
                           <span>{feature}</span>
                        </li>
                    ))}
                </ul>
            </div>
            <button
                onClick={() => onChoosePlan(tierInfo)}
                disabled={isCurrentPlan || tierInfo.tier === 'Free'}
                className={`mt-8 w-full py-3 rounded-lg font-semibold text-lg transition-colors duration-200 ${
                    isCurrentPlan 
                        ? 'bg-brand-surface text-brand-text-secondary cursor-not-allowed'
                        : tierInfo.tier === 'Free'
                        ? 'bg-brand-surface text-brand-text-secondary cursor-not-allowed'
                        : tierInfo.isFeatured
                        ? 'bg-gradient-to-r from-brand-primary to-brand-secondary text-white hover:opacity-90'
                        : 'bg-brand-surface text-white hover:bg-brand-primary'
                }`}
            >
                {isCurrentPlan ? 'Current Plan' : tierInfo.tier === 'Free' ? 'Your Plan' : 'Choose Plan'}
            </button>
        </div>
    );
};


const SubscriptionsPage: React.FC = () => {
    const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');
    const [modalInfo, setModalInfo] = useState<{ tierInfo: SubscriptionTierInfo; billingCycle: BillingCycle; } | null>(null);
    const { user } = useAuth();
    const navigate = useNavigate();

    const handleChoosePlan = (tierInfo: SubscriptionTierInfo) => {
        if (!user) {
            toast('Please sign in or create an account to subscribe.');
            navigate('/signin');
            return;
        }
        setModalInfo({ tierInfo, billingCycle });
    };

    return (
        <div className="bg-brand-dark min-h-screen">
            {modalInfo && user && (
                <PaymentInstructionsModal
                    tierInfo={modalInfo.tierInfo}
                    billingCycle={modalInfo.billingCycle}
                    userEmail={user.email}
                    onClose={() => setModalInfo(null)}
                />
            )}
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <div className="text-center mb-12">
                    <h1 className="text-5xl md:text-6xl font-extrabold text-white">Choose Your Access</h1>
                    <p className="text-lg text-brand-text-secondary mt-4 max-w-3xl mx-auto">
                        Unlock the full potential of TeO Music Studio. Join our community and support the future of AI-driven music creation.
                    </p>
                </div>
                 <div className="flex justify-center items-center space-x-2 bg-brand-dark p-1.5 rounded-xl mb-12 max-w-xs mx-auto">
                    <button onClick={() => setBillingCycle('monthly')} className={`w-full py-2 rounded-lg font-semibold transition-colors ${billingCycle === 'monthly' ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:text-white'}`}>
                        Monthly
                    </button>
                    <button onClick={() => setBillingCycle('annually')} className={`w-full py-2 rounded-lg font-semibold transition-colors ${billingCycle === 'annually' ? 'bg-brand-primary text-white' : 'text-brand-text-secondary hover:text-white'}`}>
                        Annually
                    </button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                    {SUBSCRIPTION_TIERS_DATA.map(tierInfo => (
                        <TierCard 
                            key={tierInfo.tier} 
                            tierInfo={tierInfo} 
                            billingCycle={billingCycle}
                            onChoosePlan={handleChoosePlan}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SubscriptionsPage;
