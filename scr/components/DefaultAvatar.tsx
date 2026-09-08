import React, { useState } from 'react';
import { Gender } from '../types';

interface DefaultAvatarProps {
  avatarUrl?: string;
  gender: Gender;
  fullName: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const DefaultAvatar: React.FC<DefaultAvatarProps> = ({
  avatarUrl,
  gender,
  fullName,
  className = '',
  size = 'md',
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  const isFemale = gender === 'female';

  if (avatarUrl && !imgError) {
    return (
      <img
        src={avatarUrl}
        alt={fullName}
        onError={() => setImgError(true)}
        referrerPolicy="no-referrer"
        className={`${sizeClasses[size]} rounded-full object-cover border border-amber-300/40 shadow-sm ${className}`}
      />
    );
  }

  // Classic Facebook Silhouette SVG (Male vs Female)
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center overflow-hidden border border-slate-300 shadow-inner flex-shrink-0 ${
        isFemale ? 'bg-[#f4dbe4]' : 'bg-[#d8e2ec]'
      } ${className}`}
      title={`${fullName} (${gender === 'female' ? 'Nữ' : 'Nam'})`}
    >
      <svg
        viewBox="0 0 100 100"
        fill="currentColor"
        className={`w-full h-full translate-y-1 ${isFemale ? 'text-[#a26882]' : 'text-[#547392]'}`}
      >
        {isFemale ? (
          // Female Facebook-style silhouette with shoulder & hair
          <g>
            <path d="M50,22 C41,22 34,29 34,39 C34,47 38,53 43,56 C42,61 38,67 27,70 C23,71 20,74 20,78 L20,95 L80,95 L80,78 C80,74 77,71 73,70 C62,67 58,61 57,56 C62,53 66,47 66,39 C66,29 59,22 50,22 Z" />
            {/* Hair contour styling */}
            <path d="M34,40 C32,46 32,53 35,58 C37,51 38,44 40,39 Z" opacity="0.4" />
            <path d="M66,40 C68,46 68,53 65,58 C63,51 62,44 60,39 Z" opacity="0.4" />
          </g>
        ) : (
          // Male Facebook-style silhouette with standard collar & hair
          <g>
            {/* Head */}
            <circle cx="50" cy="38" r="17" />
            {/* Shoulders & Torso */}
            <path d="M22,86 C22,70 34,64 50,64 C66,64 78,70 78,86 L78,95 L22,95 Z" />
          </g>
        )}
      </svg>
    </div>
  );
};
