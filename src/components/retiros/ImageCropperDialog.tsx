'use client'

import { useEffect, useMemo, useState } from 'react'
import Cropper, { type Area, type MediaSize } from 'react-easy-crop'
import { getCroppedImage } from '@/lib/utils/image-crop'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

type ImageCropperDialogProps = {
  open: boolean
  file: File | null
  onClose: () => void
  onCropped: (file: File, previewUrl: string) => void
}

export function ImageCropperDialog({ open, file, onClose, onCropped }: ImageCropperDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [cropSize, setCropSize] = useState({ width: 0, height: 0 })
  const [mediaSize, setMediaSize] = useState<MediaSize | null>(null)
  const [minZoom, setMinZoom] = useState(1)

  const previewUrl = useMemo(() => (file ? URL.createObjectURL(file) : ''), [file])

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const handleCropComplete = (_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels)
  }

  const updateMinZoom = (size: { width: number; height: number }, media: MediaSize) => {
    if (!size.width || !size.height) return
    const nextMinZoom = Math.max(size.width / media.width, size.height / media.height)
    setMinZoom(nextMinZoom)
    setZoom((prev) => (prev < nextMinZoom ? nextMinZoom : prev))
  }

  const handleSave = async () => {
    if (!file || !croppedAreaPixels) return
    const croppedFile = await getCroppedImage(file, croppedAreaPixels, 1279, 319)
    const url = URL.createObjectURL(croppedFile)
    onCropped(croppedFile, url)
    onClose()
  }

  const handleUseFull = () => {
    if (!file) return
    const url = URL.createObjectURL(file)
    onCropped(file, url)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-full sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Recortar imagen (1279x319)</DialogTitle>
        </DialogHeader>
        <div className="relative h-[240px] sm:h-[360px] bg-black/90 rounded-lg overflow-hidden">
          {file && (
            <Cropper
              image={previewUrl}
              crop={crop}
              zoom={zoom}
              aspect={1279 / 319}
              minZoom={minZoom}
              maxZoom={3}
              restrictPosition
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={handleCropComplete}
              onCropSizeChange={(size) => {
                setCropSize(size)
                if (mediaSize) updateMinZoom(size, mediaSize)
              }}
              onMediaLoaded={(media) => {
                setMediaSize(media)
                updateMinZoom(cropSize, media)
              }}
            />
          )}
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm">Zoom</span>
            <input
              type="range"
              min={minZoom}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full sm:w-40"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <Button variant="outline" onClick={handleUseFull}>Usar imagen completa</Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar recorte</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
