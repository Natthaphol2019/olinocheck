import React, { useRef, useCallback } from 'react'
import Webcam from 'react-webcam'
import { Button } from '@/components/ui/button'
import { Camera, RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function CameraCapture({ onCapture, facingMode = 'user' }) {
  const webcamRef = useRef(null)
  const [error, setError] = React.useState(null)
  const [permission, setPermission] = React.useState('prompt')

  const capture = useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot()
      if (imageSrc) {
        // Convert base64 to blob
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => onCapture(blob))
          .catch(err => {
            console.error('Error converting image:', err)
            setError('Failed to capture image')
          })
      }
    }
  }, [onCapture])

  const handleUserMedia = () => {
    setPermission('granted')
    setError(null)
  }

  const handleUserMediaError = (err) => {
    console.error('Camera error:', err)
    setPermission('denied')
    setError('Camera access denied. Please enable camera permissions.')
  }

  const videoConstraints = {
    facingMode,
    width: { ideal: 1280 },
    height: { ideal: 720 },
  }

  if (permission === 'denied' || error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <Camera className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-destructive mb-4">{error || 'Camera access denied'}</p>
        <Button
          variant="outline"
          onClick={() => {
            setPermission('prompt')
            setError(null)
          }}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative rounded-lg overflow-hidden bg-black">
        <Webcam
          ref={webcamRef}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          className="w-full"
          audio={false}
        />
      </div>
      
      <Button
        type="button"
        onClick={capture}
        className="w-full"
        size="lg"
      >
        <Camera className="h-5 w-5 mr-2" />
        Capture Photo
      </Button>
    </div>
  )
}
