import React from 'react'
import Image from 'next/image'

interface FirebirdLogoProps {
  className?: string
}

export default function FirebirdLogo({ className = "" }: FirebirdLogoProps) {
  return (
    <div className={`relative ${className}`}>
      <Image
        src="/firebird-mascot.png"
        alt="Firebird Fit Logo"
        fill
        className="object-contain"
        sizes="(max-width: 768px) 48px, 56px"
        priority
      />
    </div>
  )
}