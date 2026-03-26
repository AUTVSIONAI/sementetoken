"use client"

import { MapContainer, TileLayer, CircleMarker } from "react-leaflet"

export default function TreeMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  return (
    <div className="w-full h-[320px]">
      <MapContainer
        center={[latitude, longitude]}
        zoom={13}
        style={{ height: "320px", width: "100%" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <CircleMarker center={[latitude, longitude]} radius={10} pathOptions={{ color: "#34d399" }} />
      </MapContainer>
    </div>
  )
}

