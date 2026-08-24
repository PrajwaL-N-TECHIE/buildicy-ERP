import React from 'react';

interface BuildicyLogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  size?: number;
  className?: string;
}

export const BuildicyLogo: React.FC<BuildicyLogoProps> = ({
  size = 36,
  className = '',
  alt = 'Buildicy Logo',
  ...props
}) => {
  return (
    <img
      src="/logo.png"
      alt={alt}
      width={size}
      height={size}
      style={{ width: size, height: 'auto' }}
      className={`object-contain shrink-0 ${className}`}
      {...props}
    />
  );
};

export default BuildicyLogo;
