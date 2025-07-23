export default function FirebirdLogo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 120 40" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Drop shadow */}
      <path 
        d="M8 32 L112 32 L108 28 L12 28 Z" 
        fill="rgba(0,0,0,0.2)" 
        filter="blur(2px)"
      />
      
      {/* Black outline */}
      <path 
        d="M6 6 L114 6 L110 10 L110 30 L114 34 L6 34 L2 30 L2 10 Z" 
        fill="black"
      />
      
      {/* White outline */}
      <path 
        d="M8 8 L112 8 L108 12 L108 28 L112 32 L8 32 L4 28 L4 12 Z" 
        fill="white"
      />
      
      {/* Gold main body */}
      <path 
        d="M10 10 L110 10 L106 14 L106 26 L110 30 L10 30 L6 26 L6 14 Z" 
        fill="#FFD700"
      />
      
      {/* Eye detail */}
      <circle cx="100" cy="18" r="1.5" fill="black" />
      
      {/* Beak detail */}
      <path 
        d="M110 18 L114 16 L114 20 Z" 
        fill="#FFD700"
      />
      
      {/* Wing/tail feathers detail */}
      <path 
        d="M10 14 L6 12 L6 16 L10 18 Z" 
        fill="#FFD700"
      />
      <path 
        d="M10 18 L6 16 L6 20 L10 22 Z" 
        fill="#FFD700"
      />
      <path 
        d="M10 22 L6 20 L6 24 L10 26 Z" 
        fill="#FFD700"
      />
    </svg>
  )
} 