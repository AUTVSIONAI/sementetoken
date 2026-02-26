"use client"

import { useEffect, useState } from "react"
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png"
import markerIcon from "leaflet/dist/images/marker-icon.png"
import markerShadow from "leaflet/dist/images/marker-shadow.png"

type TreeMarker = {
  id: string
  name: string
  species: string
  co2: number
  position: [number, number]
}

type FeedMarker = {
  id: string
  type: string
  description: string | null
  brigadeName: string | null
  treeSpecies: string | null
  position: [number, number]
  createdAt: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x as unknown as string,
  iconUrl: markerIcon as unknown as string,
  shadowUrl: markerShadow as unknown as string
})

export default function MapBrazil() {
  const [markers, setMarkers] = useState<TreeMarker[]>([])
  const [feedMarkers, setFeedMarkers] = useState<FeedMarker[]>([])

  useEffect(() => {
    async function loadTrees() {
      try {
        const res = await fetch(`${API_URL}/trees/map`)
        if (!res.ok) return
        const data = await res.json()
        if (!Array.isArray(data) || data.length === 0) return

        const mapped: TreeMarker[] = data.map((t: any) => ({
          id: t.id,
          name: t.project_name || "Projeto",
          species: t.species,
          co2: t.estimated_co2_total || 0,
          position: [t.latitude, t.longitude]
        }))
        setMarkers(mapped)
      } catch {
      }
    }
    async function loadFeed() {
      try {
        const res = await fetch(`${API_URL}/brigades/feed`)
        if (!res.ok) return
        const data = await res.json()
        if (!Array.isArray(data) || data.length === 0) return

        const mapped: FeedMarker[] = data
          .filter(
            (a: any) =>
              (typeof a.latitude === "number" ||
                typeof a.latitude === "string") &&
              (typeof a.longitude === "number" ||
                typeof a.longitude === "string")
          )
          .map((a: any) => ({
            id: a.id,
            type: a.type,
            description: a.description ?? null,
            brigadeName: a.brigadeName ?? a.brigade_name ?? null,
            treeSpecies: a.treeSpecies ?? a.tree_species ?? null,
            position: [Number(a.latitude), Number(a.longitude)],
            createdAt: a.createdAt ?? a.created_at ?? ""
          }))

        setFeedMarkers(mapped)
      } catch {
      }
    }
    loadTrees()
    loadFeed()
  }, [])

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border">
      <MapContainer
        center={[-14.235, -51.9253]}
        zoom={4}
        scrollWheelZoom={false}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers.map((tree) => (
          <Marker key={tree.id} position={tree.position}>
            <Popup>
              <div className="text-sm">
                <div className="font-bold">{tree.name}</div>
                <div>Espécie: {tree.species}</div>
                <div>CO₂ estimado: {tree.co2} kg</div>
              </div>
            </Popup>
          </Marker>
        ))}
        {feedMarkers.map((action) => (
          <Marker key={`feed-${action.id}`} position={action.position}>
            <Popup>
              <div className="text-sm">
                <div className="font-bold">
                  {action.type === "planting"
                    ? "Plantio registrado"
                    : action.type === "inspection"
                    ? "Inspeção registrada"
                    : action.type === "fire_alert"
                    ? "Alerta de fogo"
                    : "Ação registrada"}
                </div>
                {action.brigadeName && (
                  <div>Brigada: {action.brigadeName}</div>
                )}
                {action.treeSpecies && (
                  <div>Espécie: {action.treeSpecies}</div>
                )}
                {action.description && <div>{action.description}</div>}
                {action.createdAt && (
                  <div>
                    {new Date(action.createdAt).toLocaleString("pt-BR")}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  )
}
