import React, { useState } from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
  avatar?: string;
  name?: string;
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  ring?: boolean;
  ringColor?: string;
  ringGlow?: string;
}

const SIZE_CLASSES = {
  xs: 'w-6 h-6 text-xs',
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-xl',
  '2xl': 'w-24 h-24 text-3xl',
  custom: '',
};

export const UserAvatar: React.FC<UserAvatarProps> = ({
  avatar,
  name = 'User',
  className = '',
  size = 'md',
  ring = false,
  ringColor,
  ringGlow,
}) => {
  const [imgError, setImgError] = useState(false);

  const isUrl = avatar && (avatar.startsWith('http://') || avatar.startsWith('https://') || avatar.startsWith('data:'));
  const isEmoji = avatar && !isUrl && avatar.length <= 4;

  const initials = name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'U';

  const sizeClass = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  const ringStyle: React.CSSProperties = ring && ringColor ? {
    borderColor: ringColor,
    boxShadow: ringGlow ? `0 0 16px ${ringGlow}` : undefined,
  } : {};

  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full overflow-hidden shrink-0 select-none bg-[#1a1a26] text-white font-semibold transition-all ${sizeClass} ${
        ring ? 'border-2' : ''
      } ${className}`}
      style={ringStyle}
    >
      {isUrl && !imgError ? (
        <img
          src={avatar}
          alt={name}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover transition-transform duration-300"
          loading="lazy"
          referrerPolicy="no-referrer"
        />
      ) : isEmoji ? (
        <span className="flex items-center justify-center text-[115%] leading-none">{avatar}</span>
      ) : name ? (
        <span className="font-mono text-zinc-200 tracking-tight">{initials}</span>
      ) : (
        <User className="w-1/2 h-1/2 text-zinc-400" />
      )}
    </div>
  );
};
