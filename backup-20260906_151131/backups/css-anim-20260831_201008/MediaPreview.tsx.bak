'use client'

import { memo } from 'react'

interface MediaPreviewProps {
  type: 'image' | 'video' | 'audio' | 'file'
  url: string
  name?: string
}

function MediaPreview({ type, url, name }: MediaPreviewProps) {
  if (type === 'image') {
    return <img src={url} alt={name || 'Preview'} className="w-full max-h-64 object-cover rounded-lg" />
  }
  if (type === 'video') {
    return <video src={url} controls className="w-full max-h-64 rounded-lg" />
  }
  if (type === 'audio') {
    return <audio src={url} controls className="w-full" />
  }
  return <div className="text-white/50 text-sm">{name || 'File'}</div>
}

export default memo(MediaPreview)
