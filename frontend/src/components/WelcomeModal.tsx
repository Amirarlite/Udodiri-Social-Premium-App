import React from 'react';

/**
 * Simple modal that appears once after a user logs in.
 * It shows the full Udodiri logo, a short welcome message and the credit line.
 */
interface Props {
  onClose: () => void;
}

const WelcomeModal: React.FC<Props> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
      <div className="bg-surface-container-high rounded-xl p-8 max-w-md w-full mx-4 text-center animate-fade-in">
        {/* Animated full‑logo */}
        <img
          src="/assets/complete-udodiri-logo.png"
          alt="Udodiri logo"
          className="mx-auto mb-6 w-48 h-auto welcome-logo"
        />
        <h2 className="font-display-lg text-headline-lg text-on-surface mb-4">
          Welcome to Udodiri Young Social Club!
        </h2>
        <p className="font-body-lg text-body-lg text-on-surface-variant mb-6">
          Your premium community experience starts here.
        </p>
        {/* Credit line – mandatory */}
        <p className="font-label-caps text-label-caps text-on-surface-variant">
          SPONSORED BY CHIEF NICODEMUS AKA NICOJET,<br />
          BUILD BY SRDGINTEL.COM
        </p>
        <button
          onClick={onClose}
          className="mt-6 px-6 py-2 bg-primary text-on-primary rounded-full hover:bg-primary-container transition-colors"
        >
          Enter Club
        </button>
      </div>
    </div>
  );
};

export default WelcomeModal;
