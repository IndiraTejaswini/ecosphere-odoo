import { useState, useRef } from 'react';

const BentoGlowEffect = ({ 
  children, 
  className = '', 
  glowColor = '22, 63, 161', 
  spotlightRadius = 240 // You can increase this prop when calling the component if you want a wider glow
}) => {
  const containerRef = useRef(null);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Removed tilt logic, keeping only coordinates for the glow effect
  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setCoords({ x, y });
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative group rounded-2xl overflow-hidden transition-all duration-300 ${className}`}
      style={{
        '--glow-x': `${coords.x}px`,
        '--glow-y': `${coords.y}px`,
        '--glow-opacity': isHovered ? '1' : '0',
        '--glow-radius': `${spotlightRadius}px`,
        '--glow-color': glowColor
      }}
    >
      {/* Subtle interior glow */}
      <div 
        className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0"
        style={{
          background: `radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y), rgba(var(--glow-color), 0.05), transparent 80%)`
        }}
      />

      {/* Enhanced Border Glow - Increased opacity and padding for a stronger edge effect */}
      <div 
        className="absolute inset-0 pointer-events-none z-30 rounded-2xl"
        style={{
          padding: '3px', // Increased from 2.5px to 3px to make the border slightly thicker
          // Increased opacity from 0.4 and 0.1 to 0.9 and 0.4 to make the ring glow much brighter
          background: `radial-gradient(var(--glow-radius) circle at var(--glow-x) var(--glow-y), rgba(var(--glow-color), 0.9) 0%, rgba(var(--glow-color), 0.4) 50%, transparent 100%)`,
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