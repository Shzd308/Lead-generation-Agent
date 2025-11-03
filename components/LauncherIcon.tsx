
import React from 'react';

interface LauncherIconProps {
  isOpen: boolean;
  onClick: () => void;
}

const LauncherIcon: React.FC<LauncherIconProps> = ({ isOpen, onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-4 right-4 sm:right-6 md:right-8 w-16 h-16 bg-blue-500 rounded-full text-white flex items-center justify-center shadow-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-transform duration-300 ease-in-out hover:scale-110"
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
    >
      <div className="relative w-8 h-8">
        {/* Chat icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isOpen ? 'opacity-0' : 'opacity-100'}`}
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
        </svg>
        {/* Close icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>
    </button>
  );
};

export default LauncherIcon;
