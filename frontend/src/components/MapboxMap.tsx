"use client"

import * as React from "react"
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { ScanFace, TreePine, MapPin } from "lucide-react"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

export type MapMarker = {
  id: string
  longitude: number
  latitude: number
  title?: string
  description?: string
  type?: "tree" | "feed" | "brigade" | "default"
  onClick?: () => void
}

interface MapboxMapProps {
  initialViewState?: {
    longitude: number
    latitude: number
    zoom: number
  }
  markers?: MapMarker[]
  className?: string
  style?: React.CSSProperties
}

export default function MapboxMap({
  initialViewState = {
    longitude: -51.9253,
    latitude: -14.235,
    zoom: 3.5
  },
  markers = [],
  className = "w-full h-full rounded-xl overflow-hidden",
  style
}: MapboxMapProps) {
  const [popupInfo, setPopupInfo] = React.useState<MapMarker | null>(null)

  const getMarkerIcon = (type?: string) => {
    switch (type) {
      case "tree":
        return <TreePine className="w-6 h-6 text-emerald-500 fill-emerald-900/50" />
      case "feed":
        return <ScanFace className="w-6 h-6 text-blue-500 fill-blue-900/50" />
      case "brigade":
        return <MapPin className="w-6 h-6 text-red-500 fill-red-900/50" />
      default:
        return <MapPin className="w-6 h-6 text-emerald-500" />
    }
  }

  return (
    <div className={className} style={style}>
      <Map
        initialViewState={initialViewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        terrain={{ source: "mapbox-dem", exaggeration: 1.5 }}
      >
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl />

        {markers.map((marker) => (
          <Marker
            key={marker.id}
            longitude={marker.longitude}
            latitude={marker.latitude}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setPopupInfo(marker)
              marker.onClick?.()
            }}
          >
            <div className="cursor-pointer hover:scale-110 transition-transform">
              {getMarkerIcon(marker.type)}
            </div>
          </Marker>
        ))}

        {popupInfo && (
          <Popup
            anchor="top"
            longitude={popupInfo.longitude}
            latitude={popupInfo.latitude}
            onClose={() => setPopupInfo(null)}
            className="text-slate-900"
          >
            <div className="p-2 max-w-[200px]">
              {popupInfo.title && (
                <h3 className="font-bold text-sm mb-1">{popupInfo.title}</h3>
              )}
              {popupInfo.description && (
                <p className="text-xs text-slate-600">{popupInfo.description}</p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
