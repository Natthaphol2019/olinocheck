import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { MapPin, Navigation } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function GPSPicker({ onLocationSelect, initialLat, initialLng }) {
  const [location, setLocation] = useState({
    lat: initialLat || '',
    lng: initialLng || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [manualMode, setManualMode] = useState(!initialLat && !initialLng)

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        const newLocation = {
          lat: latitude.toFixed(6),
          lng: longitude.toFixed(6),
        }
        setLocation(newLocation)
        onLocationSelect(newLocation.lat, newLocation.lng)
        setManualMode(false)
        setLoading(false)
      },
      (err) => {
        console.error('GPS Error:', err)
        setError('Unable to get your location. Please enter manually.')
        setLoading(false)
        setManualMode(true)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    )
  }

  const handleLatChange = (e) => {
    const newLat = e.target.value
    setLocation((prev) => ({ ...prev, lat: newLat }))
    if (newLat && location.lng) {
      onLocationSelect(newLat, location.lng)
    }
  }

  const handleLngChange = (e) => {
    const newLng = e.target.value
    setLocation((prev) => ({ ...prev, lng: newLng }))
    if (location.lat && newLng) {
      onLocationSelect(location.lat, newLng)
    }
  }

  useEffect(() => {
    if (!manualMode && !location.lat && !location.lng) {
      getCurrentLocation()
    }
  }, [])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>GPS Location</Label>
        {!manualMode && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setManualMode(true)}
          >
            Enter Manually
          </Button>
        )}
      </div>

      {manualMode ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lat" className="text-xs">Latitude</Label>
            <Input
              id="lat"
              type="text"
              placeholder="0.000000"
              value={location.lat}
              onChange={handleLatChange}
              pattern="-?[0-9]+\.?[0-9]*"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng" className="text-xs">Longitude</Label>
            <Input
              id="lng"
              type="text"
              placeholder="0.000000"
              value={location.lng}
              onChange={handleLngChange}
              pattern="-?[0-9]+\.?[0-9]*"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 p-4 bg-muted rounded-lg">
          <Navigation className={cn("h-5 w-5", loading ? "animate-pulse" : "")} />
          <div className="flex-1">
            {loading ? (
              <p className="text-sm">Getting location...</p>
            ) : location.lat && location.lng ? (
              <p className="text-sm font-mono">
                {location.lat}, {location.lng}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No location data</p>
            )}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={getCurrentLocation}
            disabled={loading}
          >
            <MapPin className="h-4 w-4" />
          </Button>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {!manualMode && !error && (
        <p className="text-xs text-muted-foreground">
          Location is automatically captured. Click "Get Location" to refresh.
        </p>
      )}
    </div>
  )
}
