import React, { useState, useRef } from 'react';

const BentoGlowEffect = ({ 
  children, 
  className = '', 
  glowColor = '22, 63, 161', 
  enableTilt = true,
  spotlightRadius = 240
}) => {
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [tiltStyle, setTiltStyle] = useState({});

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCoords({ x, y });

    if (enableTilt) {
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -4; 
      const rotateY = ((x - centerX) / centerX) * 4;
      
      setTiltStyle({
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.006, 1.006, 1.006)`,
        transition: 'transform 0.1s cubic-bezier(0.25, 1, 0.5, 1)'
      });
    }
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (enableTilt) {
      setTiltStyle({
        transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
        transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)'
      });
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative group rounded-2xl overflow-hidden transition-all duration-300 ${className}`}
      style={{
        ...tiltStyle,
        '--glow-x': `${coords.x}px`,
        '--glow-y': `${coords.y}px`,
        '--glow-opacity': isHovered ? '1' : '0',
        '--glow-radius': `${spotlightRadius}px`,
        '--glow-color': glowColor
      }}
    >
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
        style={{
          background: `radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y), rgba(var(--glow-color), 0.04), transparent 80%)`
        }}
      />

      <div 
        className="absolute inset-0 pointer-events-none z-30 rounded-2xl"
        style={{
          padding: '2.5px',
          background: `radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y), rgba(var(--glow-color), 0.4) 0%, rgba(var(--glow-color), 0.1) 40%, transparent 80%)`,
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
          opacity: 'var(--glow-opacity)',
          transition: 'opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
      />

      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default BentoGlowEffect;