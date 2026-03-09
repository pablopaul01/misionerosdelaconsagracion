export type CropArea = {
  x: number
  y: number
  width: number
  height: number
}

const createImage = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.src = url
  })

export const getCroppedImage = async (
  file: File,
  crop: CropArea,
  outputWidth = 1024,
  outputHeight = 576,
) => {
  const imageUrl = URL.createObjectURL(file)
  const image = await createImage(imageUrl)

  const cropCanvas = document.createElement('canvas')
  cropCanvas.width = Math.max(1, Math.floor(crop.width))
  cropCanvas.height = Math.max(1, Math.floor(crop.height))
  const cropCtx = cropCanvas.getContext('2d')
  if (!cropCtx) {
    URL.revokeObjectURL(imageUrl)
    throw new Error('Canvas no disponible')
  }

  cropCtx.drawImage(
    image,
    -crop.x,
    -crop.y,
  )

  const outputCanvas = document.createElement('canvas')
  outputCanvas.width = outputWidth
  outputCanvas.height = outputHeight
  const outputCtx = outputCanvas.getContext('2d')
  if (!outputCtx) {
    URL.revokeObjectURL(imageUrl)
    throw new Error('Canvas no disponible')
  }

  outputCtx.drawImage(cropCanvas, 0, 0, outputWidth, outputHeight)

  const blob = await new Promise<Blob>((resolve, reject) => {
    outputCanvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('No se pudo generar la imagen'))
    }, 'image/jpeg', 0.9)
  })

  URL.revokeObjectURL(imageUrl)
  return new File([blob], `retiro-${Date.now()}.jpg`, { type: 'image/jpeg' })
}
