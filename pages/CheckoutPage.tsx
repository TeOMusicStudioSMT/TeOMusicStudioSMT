import React from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { CreditCardIcon } from '../components/icons';

const CheckoutPage: React.FC = () => {
    return (
        <div className="bg-brand-dark min-h-screen flex items-center justify-center p-4">
            <div className="w-full max-w-2xl mx-auto bg-brand-bg rounded-2xl p-8 text-center">
                <CreditCardIcon className="w-16 h-16 text-brand-primary mx-auto mb-6" />
                <h1 className="text-3xl font-bold text-white">Automated Checkout is Under Development</h1>
                <p className="text-brand-text-secondary mt-4 mb-8">
                    As S.M.T. is currently an artistic project, we are handling subscriptions manually. To upgrade your plan, please return to the subscriptions page and follow the instructions provided there.
                </p>
                <ReactRouterDOM.Link 
                    to="/subscriptions" 
                    className="inline-block bg-gradient-to-r from-brand-primary to-brand-secondary text-white font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition-opacity"
                >
                    Return to Subscriptions
                </ReactRouterDOM.Link>
            </div>
        </div>
    );
};

export default CheckoutPage;
