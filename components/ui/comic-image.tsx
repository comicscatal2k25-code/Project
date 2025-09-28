"use client"

import { useState } from "react"

interface ComicImageProps {
  src: string | null
  alt: string
  title: string
  className?: string
}

export function ComicImage({ src, alt, title, className = "" }: ComicImageProps) {
  const [imageError, setImageError] = useState(false)

  if (!src || imageError) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="text-center text-gray-400">
          <div className="text-8xl mb-4 transform hover:scale-110 transition-transform duration-300">📚</div>
          <p className="comic-heading text-sm text-gray-600 px-2">{title}</p>
        </div>
      </div>
    )
  }

  return (
    <img 
      src={src} 
      alt={alt}
      className={`w-full h-full object-cover hover:scale-105 transition-transform duration-300 ${className}`}
      onError={() => setImageError(true)}
    />
  )
}
