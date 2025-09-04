import React, { useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const SignUpPage: React.FC = () => {
  const { user, isGoogleReady } = useAuth();
  const navigate = ReactRouterDOM.useNavigate();
  const googleButtonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (isGoogleReady && googleButtonRef.current && googleButtonRef.current.childElementCount === 0) {
      window.google.accounts.id.renderButton(
        googleButtonRef.current,
        { theme: "outline", size: "large", type: "standard", text: "signup_with", shape: "rectangular", logo_alignment: "left" }
      );
    }
  }, [isGoogleReady]);

  return (
    <div className="bg-brand-dark min-h-screen flex items-center justify-center p-4" style={{
      backgroundImage: `radial-gradient(circle at top right, rgba(138, 66, 219, 0.2) 0%, transparent 30%), radial-gradient(circle at bottom left, rgba(217, 74, 140, 0.2) 0%, transparent 30%)`
    }}>
      <div className="w-full max-w-sm mx-auto bg-brand-bg rounded-2xl shadow-2xl shadow-brand-primary/10 p-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">Create Account</h2>
        <p className="text-brand-text-secondary mb-8">
          Join the future of music. Create your account to start collaborating.
        </p>

        <div ref={googleButtonRef} className="flex justify-center my-8"></div>
        
        {!isGoogleReady && <p className="text-center text-sm text-brand-text-secondary animate-pulse">Loading sign-up options...</p>}

        <p className="text-center text-sm text-brand-text-secondary mt-8">
          Already have an account? <ReactRouterDOM.Link to="/signin" className="font-medium text-brand-primary hover:underline">Sign in</ReactRouterDOM.Link>
        </p>
         <p className="text-center text-xs text-brand-text-secondary mt-6">
          By creating an account, you agree to our <ReactRouterDOM.Link to="/terms" className="underline">Terms of Service</ReactRouterDOM.Link> and <ReactRouterDOM.Link to="/privacy" className="underline">Privacy Policy</ReactRouterDOM.Link>.
        </p>
      </div>
    </div>
  );
};

export default SignUpPage;
