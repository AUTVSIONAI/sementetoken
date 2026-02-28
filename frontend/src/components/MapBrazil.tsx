"use client"

import { useEffect, useState } from "react"
import dynamic from "next/dynamic"

const MapboxMap = dynamic(() => import("./MapboxMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-slate-900 animate-pulse rounded-lg flex items-center justify-center text-emerald-500/50">
      Carregando mapa 3D...
    </div>
  )
})

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

export default function MapBrazil() {
  const [markers, setMarkers] = useState<any[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [treesRes, feedRes] = await Promise.all([
          fetch(`${API_URL}/trees/map`),
          fetch(`${API_URL}/brigades/feed`)
        ])

        let newMarkers: any[] = []

        if (treesRes.ok) {
          const treesData = await treesRes.json()
          if (Array.isArray(treesData)) {
            const treeMarkers = treesData.map((t: any) => ({
              id: `tree-${t.id}`,
              longitude: Number(t.longitude),
              latitude: Number(t.latitude),
              title: t.project_name || "Projeto de Reflorestamento",
              description: `${t.species} - CO₂ Est.: ${t.estimated_co2_total || 0}kg`,
              type: "tree"
            }))
            newMarkers = [...newMarkers, ...treeMarkers]
          }
        }

        if (feedRes.ok) {
          const feedData = await feedRes.json()
          if (Array.isArray(feedData)) {
            const feedMarkers = feedData
              .filter(
                (a: any) =>
                  (typeof a.latitude === "number" || typeof a.latitude === "string") &&
                  (typeof a.longitude === "number" || typeof a.longitude === "string")
              )
              .map((a: any) => ({
                id: `feed-${a.id}`,
                longitude: Number(a.longitude),
                latitude: Number(a.latitude),
                title: a.type === "planting" ? "Plantio Realizado" : "Ação de Brigada",
                description: a.description || `Brigada: ${a.brigadeName || "N/A"}`,
                type: "feed"
              }))
            newMarkers = [...newMarkers, ...feedMarkers]
          }
        }

        setMarkers(newMarkers)
      } catch (err) {
        console.error("Error loading map data", err)
      }
    }

    loadData()
  }, [])

  return (
    <div className="w-full h-96 rounded-lg overflow-hidden border border-emerald-900/50 shadow-2xl shadow-emerald-900/20">
      <MapboxMap markers={markers} />
    </div>
  )
}
