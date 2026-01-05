
import React from 'react';

interface LogoProps {
  className?: string;
}

const Logo: React.FC<LogoProps> = ({ className = "w-10 h-10" }) => {
  const LOGO_URL = "/logo.png";
  
  return (
    <div className={`relative flex items-center justify-center overflow-hidden rounded-xl ${className}`}>
      <img 
        src={LOGO_URL} 
        alt="BioMistrz Logo" 
        className="w-full h-full object-contain"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
        }}
      />
    </div>
  );
};

export default Logo;
