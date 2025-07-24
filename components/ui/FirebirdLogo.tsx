import React from 'react'

interface FirebirdLogoProps {
  className?: string
}

export default function FirebirdLogo({ className = "" }: FirebirdLogoProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Background Circle */}
      <circle cx="12" cy="12" r="11" fill="url(#gradient-bg)" stroke="url(#gradient-stroke)" strokeWidth="0.5"/>
      
      {/* Main Firebird Body */}
      <path
        d="M12 4C10.5 4 9.5 5 9.5 6.5C9.5 8 10.5 9 12 9C13.5 9 14.5 8 14.5 6.5C14.5 5 13.5 4 12 4Z"
        fill="url(#gradient-body)"
        stroke="url(#gradient-stroke)"
        strokeWidth="0.3"
      />
      
      {/* Wings - Left */}
      <path
        d="M7 10C6 10 5.5 11 6 12C6.5 13 7.5 13.5 8 13C8.5 12.5 8 11.5 7 10Z"
        fill="url(#gradient-wing-left)"
        stroke="url(#gradient-stroke)"
        strokeWidth="0.3"
      />
      
      {/* Wings - Right */}
      <path
        d="M17 10C18 10 18.5 11 18 12C17.5 13 16.5 13.5 16 13C15.5 12.5 16 11.5 17 10Z"
        fill="url(#gradient-wing-right)"
        stroke="url(#gradient-stroke)"
        strokeWidth="0.3"
      />
      
      {/* Head */}
      <circle cx="12" cy="7" r="1.5" fill="url(#gradient-head)" stroke="url(#gradient-stroke)" strokeWidth="0.3"/>
      
      {/* Eye */}
      <circle cx="12" cy="6.5" r="0.4" fill="white"/>
      <circle cx="12" cy="6.5" r="0.2" fill="black"/>
      
      {/* Beak */}
      <path
        d="M12 8L11.5 9L12.5 9L12 8Z"
        fill="url(#gradient-beak)"
        stroke="url(#gradient-stroke)"
        strokeWidth="0.2"
      />
      
      {/* Tail */}
      <path
        d="M12 15C11 15 10.5 16 11 17C11.5 18 12.5 18.5 13 18C13.5 17.5 13 16.5 12 15Z"
        fill="url(#gradient-tail)"
        stroke="url(#gradient-stroke)"
        strokeWidth="0.3"
      />
      
      {/* Wing Details - Left */}
      <path
        d="M6.5 11.5C6.2 11.5 6 11.7 6.2 12C6.4 12.3 6.8 12.5 7 12.3C7.2 12.1 6.8 11.5 6.5 11.5Z"
        fill="white"
        opacity="0.6"
      />
      
      {/* Wing Details - Right */}
      <path
        d="M17.5 11.5C17.8 11.5 18 11.7 17.8 12C17.6 12.3 17.2 12.5 17 12.3C16.8 12.1 17.2 11.5 17.5 11.5Z"
        fill="white"
        opacity="0.6"
      />
      
      {/* Body Highlights */}
      <path
        d="M11.5 6C11.5 6 11.8 6.5 12 6.5C12.2 6.5 12.5 6 12.5 6"
        stroke="white"
        strokeWidth="0.3"
        opacity="0.7"
      />
      
      {/* Gradients */}
      <defs>
        <linearGradient id="gradient-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af" stopOpacity="0.1"/>
          <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.2"/>
        </linearGradient>
        
        <linearGradient id="gradient-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af"/>
          <stop offset="100%" stopColor="#3b82f6"/>
        </linearGradient>
        
        <linearGradient id="gradient-body" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af"/>
          <stop offset="50%" stopColor="#3b82f6"/>
          <stop offset="100%" stopColor="#60a5fa"/>
        </linearGradient>
        
        <linearGradient id="gradient-wing-left" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af"/>
          <stop offset="100%" stopColor="#3b82f6"/>
        </linearGradient>
        
        <linearGradient id="gradient-wing-right" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af"/>
          <stop offset="100%" stopColor="#3b82f6"/>
        </linearGradient>
        
        <linearGradient id="gradient-head" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af"/>
          <stop offset="100%" stopColor="#3b82f6"/>
        </linearGradient>
        
        <linearGradient id="gradient-beak" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b"/>
          <stop offset="100%" stopColor="#fbbf24"/>
        </linearGradient>
        
        <linearGradient id="gradient-tail" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e40af"/>
          <stop offset="100%" stopColor="#3b82f6"/>
        </linearGradient>
      </defs>
    </svg>
  )
} 