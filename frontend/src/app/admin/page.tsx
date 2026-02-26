"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
)

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

type Project = {
  id: string
  name: string
  description?: string
  city?: string
  state?: string
  country?: string
  totalArea?: number
}

type AdminProduct = {
  id: string
  name: string
  description?: string | null
  price: number
  carbonCashbackKg: number
  projectId?: string | null
  projectName?: string | null
}

type AdminTree = {
  id: string
  species: string
  projectName?: string | null
  plantedAt?: string | null
}

type Species = {
  id: string
  commonName: string
  scientificName?: string
  biome?: string
  imageUrl?: string
}

type ExternalSpecies = {
  id: string
  commonName?: string
  scientificName?: string
  biome?: string
  imageUrl?: string
  description?: string
}

type RegionSummary = {
  country: string
  state: string | null
  projectsCount: number
}

type FinanceSummary = {
  ordersCount: number
  totalRevenue: number
  totalCashbackKg: number
  totalTokens: number
}

type AdminUser = {
  id: string
  name: string
  email: string
  role: "user" | "admin" | "corporate"
  createdAt: string
}

type AdminWallet = {
  userId: string
  name: string
  email: string
  role: AdminUser["role"]
  createdAt: string
  greenBalance: number
  seedBalance: number
}

type AdminWalletDetail = {
  user: AdminUser
  wallet: {
    greenBalance: number
    seedBalance: number
    createdAt: string | null
    updatedAt: string | null
  }
  greenTransactions: {
    id: string
    amount: number
    type: string
    source: string
    createdAt: string
  }[]
  seedTransactions: {
    id: string
    amount: number
    txId: string | null
    status: string
    createdAt: string
  }[]
}

type AdminFeedAction = {
  id: string
  type: string
  description: string | null
  createdAt: string
  status: string
  brigadeName: string | null
  ownerName: string | null
  ownerEmail: string | null
  ownerRole: AdminUser["role"] | null
  treeSpecies: string | null
  latitude: number | null
  longitude: number | null
}

type AdminSection =
  | "overview"
  | "projects"
  | "trees"
  | "species"
  | "users"
  | "wallets"
  | "regions"
  | "store"
  | "finance"
  | "apis"
  | "feed"
  | "brigades"

const EXTERNAL_SPECIES_PAGE_SIZE = 24

export default function AdminPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [allowed, setAllowed] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [species, setSpecies] = useState<Species[]>([])
  const [externalSpecies, setExternalSpecies] = useState<ExternalSpecies[]>([])
  const [externalSpeciesLoading, setExternalSpeciesLoading] = useState(false)
  const [externalSpeciesSearch, setExternalSpeciesSearch] = useState("")
  const [externalSpeciesPage, setExternalSpeciesPage] = useState(1)
  const [externalSpeciesImageCache, setExternalSpeciesImageCache] = useState<
    Record<string, string>
  >({})
  const [regions, setRegions] = useState<RegionSummary[]>([])
  const [finance, setFinance] = useState<FinanceSummary | null>(null)
  const [users, setUsers] = useState<AdminUser[]>([])
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [wallets, setWallets] = useState<AdminWallet[]>([])
  const [selectedWalletUserId, setSelectedWalletUserId] = useState<string | null>(
    null
  )
  const [walletAdjustAmount, setWalletAdjustAmount] = useState("")
  const [walletSavingUserId, setWalletSavingUserId] = useState<string | null>(null)
  const [walletDetail, setWalletDetail] = useState<AdminWalletDetail | null>(null)
  const [walletDetailLoading, setWalletDetailLoading] = useState(false)
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [trees, setTrees] = useState<AdminTree[]>([])
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    carbonCashbackKg: "",
    projectId: ""
  })
  const [form, setForm] = useState({
    name: "",
    description: "",
    city: "",
    state: "",
    country: "",
    totalArea: "",
    addressSearch: "",
    street: "",
    neighborhood: "",
    latitude: "",
    longitude: ""
  })
  const [treeForm, setTreeForm] = useState({
    projectId: "",
    species: "",
    latitude: "",
    longitude: "",
    plantedAt: "",
    growthStage: "",
    estimatedCo2Total: ""
  })
  const [brigadeForm, setBrigadeForm] = useState({
    userId: "",
    name: "",
    description: "",
    city: "",
    state: "",
    country: ""
  })
  const [addressSuggestions, setAddressSuggestions] = useState<
    {
      id: string
      displayName: string
      city?: string
      state?: string
      country?: string
      street?: string
      neighborhood?: string
      lat: string
      lon: string
    }[]
  >([])
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [activeSection, setActiveSection] = useState<AdminSection>("overview")
  const [speciesProductConfig, setSpeciesProductConfig] = useState<
    Record<
      string,
      {
        price: string
        carbonCashbackKg: string
        projectId: string
      }
    >
  >({})
  const [publishingSpeciesId, setPublishingSpeciesId] = useState<string | null>(
    null
  )
  const [enrichingSpeciesImages, setEnrichingSpeciesImages] = useState(false)
  const [feedActions, setFeedActions] = useState<AdminFeedAction[]>([])
  const [feedLoading, setFeedLoading] = useState(false)
  const [brigades, setBrigades] = useState<
    {
      id: string
      name: string
      description: string | null
      city: string | null
      state: string | null
      country: string | null
      owner: {
        id: string
        name: string
        email: string
        role: AdminUser["role"]
      } | null
      brigadistsCount: number
      actionsCount: number
      createdAt: string
    }[]
  >([])
  const [selectedBrigadeId, setSelectedBrigadeId] = useState<string | null>(
    null
  )
  const [brigadists, setBrigadists] = useState<
    {
      id: string
      name: string
      role: string | null
      email: string | null
      phone: string | null
      createdAt: string
    }[]
  >([])
  const [brigadeActionsMap, setBrigadeActionsMap] = useState<
    {
      id: string
      type: string
      description: string | null
      createdAt: string
      latitude: number
      longitude: number
    }[]
  >([])

  async function handleCreateBrigade() {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("accessToken") : null
    if (!token) return

    if (!brigadeForm.userId || !brigadeForm.name) {
      alert("Selecione um usuário e defina um nome para a brigada.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/admin/brigades`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(brigadeForm)
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Erro ao criar brigada")
      }
      const newBrigade = await res.json()
      setBrigades((prev) => [newBrigade, ...prev])
      setBrigadeForm({
        userId: "",
        name: "",
        description: "",
        city: "",
        state: "",
        country: ""
      })
      alert("Brigada criada com sucesso!")
    } catch (e: any) {
      alert(e.message || "Erro ao criar brigada")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    async function loadBrigadistsForSelected() {
      const token =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken")
          : null
      if (!token || !selectedBrigadeId) {
        setBrigadists([])
        setBrigadeActionsMap([])
        return
      }
      try {
        const res = await fetch(
          `${API_URL}/admin/brigades/${selectedBrigadeId}/brigadists`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
        const [brigadistsRes, actionsRes] = await Promise.all([
          fetch(`${API_URL}/admin/brigades/${selectedBrigadeId}/brigadists`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }),
          fetch(`${API_URL}/admin/brigades/${selectedBrigadeId}/actions-map`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          })
        ])

        if (brigadistsRes.ok) {
          const data = await brigadistsRes.json()
          setBrigadists(
            Array.isArray(data)
              ? data.map((b: any) => ({
                  id: b.id,
                  name: b.name,
                  role: b.role ?? null,
                  email: b.email ?? null,
                  phone: b.phone ?? null,
                  createdAt: b.createdAt ?? ""
                }))
              : []
          )
        } else {
          setBrigadists([])
        }

        if (actionsRes.ok) {
          const list = await actionsRes.json()
          setBrigadeActionsMap(
            Array.isArray(list)
              ? list
                  .map((a: any) => ({
                    id: a.id,
                    type: a.type,
                    description: a.description ?? null,
                    createdAt: a.createdAt ?? a.created_at ?? "",
                    latitude:
                      typeof a.latitude === "number" ||
                      typeof a.latitude === "string"
                        ? Number(a.latitude)
                        : NaN,
                    longitude:
                      typeof a.longitude === "number" ||
                      typeof a.longitude === "string"
                        ? Number(a.longitude)
                        : NaN
                  }))
                  .filter(
                    (a) =>
                      Number.isFinite(a.latitude) && Number.isFinite(a.longitude)
                  )
              : []
          )
        } else {
          setBrigadeActionsMap([])
        }
      } catch {
        setBrigadists([])
        setBrigadeActionsMap([])
      }
    }
    loadBrigadistsForSelected()
  }, [selectedBrigadeId])

  useEffect(() => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null
    if (!token) {
      router.push("/login")
      return
    }
    const tokenValue = token

    async function checkAdmin(tokenParam: string) {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          headers: {
            Authorization: `Bearer ${tokenParam}`
          }
        })
        if (!res.ok) {
          router.push("/login")
          return
        }
        const data = await res.json()
        if (data.role !== "admin") {
          setAllowed(false)
        } else {
          setAllowed(true)
          await Promise.all([
            loadUsers(tokenParam),
            loadWallets(tokenParam),
            loadProjects(tokenParam),
            loadSpecies(),
            loadRegions(tokenParam),
            loadFinance(tokenParam),
            loadProducts(),
            loadTrees(),
            loadFeedActions(tokenParam),
            loadBrigades(tokenParam)
          ])
        }
      } catch {
        setAllowed(false)
      } finally {
        setLoading(false)
      }
    }

    async function loadUsers(tokenValue: string) {
      try {
        const res = await fetch(`${API_URL}/admin/users`, {
          headers: {
            Authorization: `Bearer ${tokenValue}`
          }
        })
        if (!res.ok) {
          return
        }
        const data = await res.json()
        setUsers(
          Array.isArray(data)
            ? data.map((u: any) => ({
                id: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                createdAt: u.createdAt
              }))
            : []
        )
      } catch {
      }
    }

    async function loadWallets(tokenValue: string) {
      try {
        const res = await fetch(`${API_URL}/admin/wallets`, {
          headers: {
            Authorization: `Bearer ${tokenValue}`
          }
        })
        if (!res.ok) {
          return
        }
        const data = await res.json()
        setWallets(
          Array.isArray(data)
            ? data.map((w: any) => ({
                userId: w.userId,
                name: w.name,
                email: w.email,
                role: w.role,
                createdAt: w.createdAt,
                greenBalance: w.greenBalance ?? 0,
                seedBalance: w.seedBalance ?? 0
              }))
            : []
        )
      } catch {
      }
    }

    async function loadFeedActions(tokenValue: string) {
      try {
        setFeedLoading(true)
        const res = await fetch(`${API_URL}/admin/brigade-actions/pending`, {
          headers: {
            Authorization: `Bearer ${tokenValue}`
          }
        })
        if (!res.ok) {
          return
        }
        const data = await res.json()
        setFeedActions(
          Array.isArray(data)
            ? data.map((a: any) => ({
                id: a.id,
                type: a.type,
                description: a.description ?? null,
                createdAt: a.createdAt ?? a.created_at ?? "",
                status: a.status ?? "pending",
                brigadeName: a.brigadeName ?? a.brigade_name ?? null,
                ownerName: a.ownerName ?? a.owner_name ?? null,
                ownerEmail: a.ownerEmail ?? a.owner_email ?? null,
                ownerRole: (a.ownerRole ?? a.owner_role ?? null) as AdminUser["role"] | null,
                treeSpecies: a.treeSpecies ?? a.tree_species ?? null,
                latitude:
                  typeof a.latitude === "number" || typeof a.latitude === "string"
                    ? Number(a.latitude)
                    : null,
                longitude:
                  typeof a.longitude === "number" || typeof a.longitude === "string"
                    ? Number(a.longitude)
                    : null
              }))
            : []
        )
      } catch {
      } finally {
        setFeedLoading(false)
      }
    }

    async function loadBrigades(tokenValue: string) {
      try {
        const res = await fetch(`${API_URL}/admin/brigades`, {
          headers: {
            Authorization: `Bearer ${tokenValue}`
          }
        })
        if (!res.ok) {
          return
        }
        const data = await res.json()
        setBrigades(
          Array.isArray(data)
            ? data.map((b: any) => ({
                id: b.id,
                name: b.name,
                description: b.description ?? null,
                city: b.city ?? null,
                state: b.state ?? null,
                country: b.country ?? null,
                owner: b.owner
                  ? {
                      id: b.owner.id,
                      name: b.owner.name,
                      email: b.owner.email,
                      role: b.owner.role as AdminUser["role"]
                    }
                  : null,
                brigadistsCount: b.brigadistsCount ?? 0,
                actionsCount: b.actionsCount ?? 0,
                createdAt: b.createdAt ?? ""
              }))
            : []
        )
      } catch {
      }
    }

    async function loadProjects(tokenValue: string) {
      const res = await fetch(`${API_URL}/projects`, {
        headers: {
          Authorization: `Bearer ${tokenValue}`
        }
      })
      const data = await res.json()
      setProjects(data)
    }

    async function loadSpecies() {
      const res = await fetch(`${API_URL}/species`)
      if (!res.ok) {
        return
      }
      const data = await res.json()
      setSpecies(data)
    }

    async function loadTrees() {
      try {
        const res = await fetch(`${API_URL}/trees`)
        if (!res.ok) {
          return
        }
        const data = await res.json()
        setTrees(
          Array.isArray(data)
            ? data.map((t: any) => ({
                id: t.id,
                species: t.species,
                projectName: t.project?.name ?? null,
                plantedAt: t.plantedAt ?? null
              }))
            : []
        )
      } catch {
      }
    }

    async function loadRegions(tokenValue: string) {
      try {
        const res = await fetch(`${API_URL}/admin/regions`, {
          headers: {
            Authorization: `Bearer ${tokenValue}`
          }
        })
        if (!res.ok) {
          return
        }
        const data = await res.json()
        setRegions(Array.isArray(data) ? data : [])
      } catch {
      }
    }

    async function loadFinance(tokenValue: string) {
      try {
        const res = await fetch(`${API_URL}/admin/finance/summary`, {
          headers: {
            Authorization: `Bearer ${tokenValue}`
          }
        })
        if (!res.ok) {
          return
        }
        const data = await res.json()
        setFinance(data)
      } catch {
      }
    }

    async function loadProducts() {
      try {
        const res = await fetch(`${API_URL}/products`)
        if (!res.ok) {
          return
        }
        const data = await res.json()
        setProducts(
          Array.isArray(data)
            ? data.map((p: any) => ({
                id: p.id,
                name: p.name,
                description: p.description ?? null,
                price: p.price ?? 0,
                carbonCashbackKg: p.carbonCashbackKg ?? 0,
                projectId: p.project?.id ?? null,
                projectName: p.project?.name ?? null
              }))
            : []
        )
      } catch {
      }
    }

    checkAdmin(tokenValue)
  }, [router])

  async function fetchExternalSpecies() {
    setExternalSpeciesPage(1)
    setExternalSpeciesLoading(true)
    setError("")
    setSuccess("")
    setExternalSpeciesImageCache({})
    try {
      const res = await fetch(`${API_URL}/species/public`)
      if (!res.ok) {
        return
      }
      const data = await res.json()
      const list: ExternalSpecies[] = Array.isArray(data) ? data : []
      const merged = list.map((item) => {
        const common = (item.commonName || "").toLowerCase()
        const scientific = (item.scientificName || "").toLowerCase()
        const existing = species.find((s) => {
          const sCommon = s.commonName.toLowerCase()
          const sScientific = (s.scientificName || "").toLowerCase()
          return (
            (common && sCommon === common) ||
            (scientific && sScientific && sScientific === scientific)
          )
        })
        if (!existing) {
          return item
        }
        return {
          ...item,
          commonName: item.commonName || existing.commonName,
          scientificName:
            item.scientificName || existing.scientificName || undefined,
          biome: item.biome || existing.biome || undefined,
          imageUrl: item.imageUrl || existing.imageUrl || undefined
        }
      })
      setExternalSpecies(merged)
    } catch {
    } finally {
      setExternalSpeciesLoading(false)
    }
  }

  async function handleApproveFeedAction(id: string) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null
    if (!token) {
      return
    }
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`${API_URL}/admin/brigade-actions/${id}/approve`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) {
        setError("Não foi possível aprovar a ação de brigada.")
        return
      }
      setFeedActions((prev) => prev.filter((a) => a.id !== id))
      setSuccess("Ação aprovada e publicada no feed.")
    } catch {
      setError("Erro inesperado ao aprovar a ação.")
    }
  }

  async function handleRejectFeedAction(id: string) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null
    if (!token) {
      return
    }
    setError("")
    setSuccess("")
    try {
      const res = await fetch(`${API_URL}/admin/brigade-actions/${id}/reject`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) {
        setError("Não foi possível rejeitar a ação de brigada.")
        return
      }
      setFeedActions((prev) => prev.filter((a) => a.id !== id))
      setSuccess("Ação rejeitada e removida da fila.")
    } catch {
      setError("Erro inesperado ao rejeitar a ação.")
    }
  }

  function updateSpeciesProductConfig(
    speciesId: string,
    field: "price" | "carbonCashbackKg" | "projectId",
    value: string
  ) {
    setSpeciesProductConfig((prev) => {
      const current = prev[speciesId] || {
        price: "",
        carbonCashbackKg: "",
        projectId: ""
      }
      return {
        ...prev,
        [speciesId]: {
          ...current,
          [field]: value
        }
      }
    })
  }

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/login")
      return
    }
    try {
      const extraAddressParts: string[] = []
      if (form.street) {
        extraAddressParts.push(`Rua: ${form.street}`)
      }
      if (form.neighborhood) {
        extraAddressParts.push(`Bairro: ${form.neighborhood}`)
      }
      if (form.city || form.state || form.country) {
        extraAddressParts.push(
          `Localidade: ${[form.city, form.state, form.country]
            .filter(Boolean)
            .join(", ")}`
        )
      }
      if (form.latitude && form.longitude) {
        extraAddressParts.push(
          `Coordenadas: ${form.latitude}, ${form.longitude}`
        )
      }
      const addressSummary =
        extraAddressParts.length > 0 ? extraAddressParts.join(" • ") : ""
      const body = {
        name: form.name,
        description: addressSummary
          ? `${form.description || ""}${
              form.description ? "\n\n" : ""
            }${addressSummary}`
          : form.description,
        city: form.city,
        state: form.state,
        country: form.country,
        total_area: form.totalArea ? parseFloat(form.totalArea) : null
      }
      const res = await fetch(`${API_URL}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Erro ao criar projeto")
      }
      const created = await res.json()
      setProjects((prev) => [...prev, created])
      setForm({
        name: "",
        description: "",
        city: "",
        state: "",
        country: "",
        totalArea: "",
        addressSearch: "",
        street: "",
        neighborhood: "",
        latitude: "",
        longitude: ""
      })
    } catch (err: any) {
      setError(err.message || "Erro inesperado")
    }
  }

  async function handleCreateTree(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/login")
      return
    }
    try {
      const body = {
        projectId: treeForm.projectId || null,
        species: treeForm.species,
        latitude: parseFloat(treeForm.latitude),
        longitude: parseFloat(treeForm.longitude),
        plantedAt: treeForm.plantedAt || null,
        growthStage: treeForm.growthStage || null,
        estimatedCo2Total: treeForm.estimatedCo2Total
          ? parseFloat(treeForm.estimatedCo2Total)
          : null
      }
      const res = await fetch(`${API_URL}/trees`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Erro ao cadastrar árvore")
      }
      await res.json()
      setTreeForm({
        projectId: "",
        species: "",
        latitude: "",
        longitude: "",
        plantedAt: "",
        growthStage: "",
        estimatedCo2Total: ""
      })
      await (async () => {
        try {
          const refreshed = await fetch(`${API_URL}/trees`)
          if (refreshed.ok) {
            const data = await refreshed.json()
            setTrees(
              Array.isArray(data)
                ? data.map((t: any) => ({
                    id: t.id,
                    species: t.species,
                    projectName: t.project?.name ?? null,
                    plantedAt: t.plantedAt ?? null
                  }))
                : []
            )
          }
        } catch {
        }
      })()
    } catch (err: any) {
      setError(err.message || "Erro inesperado")
    }
  }

  async function handleDeleteTree(id: string) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null
    if (!token) {
      router.push("/login")
      return
    }
    if (
      typeof window !== "undefined" &&
      !window.confirm("Tem certeza que deseja excluir esta árvore?")
    ) {
      return
    }
    setError("")
    try {
      const res = await fetch(`${API_URL}/trees/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Erro ao excluir árvore")
      }
      setTrees((prev) => prev.filter((t) => t.id !== id))
    } catch (err: any) {
      setError(err.message || "Erro inesperado")
    }
  }

  async function handleCreateProduct(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    const token = localStorage.getItem("accessToken")
    if (!token) {
      router.push("/login")
      return
    }
    try {
      const body = {
        name: productForm.name,
        description: productForm.description || undefined,
        price: productForm.price ? parseFloat(productForm.price) : 0,
        carbonCashbackKg: productForm.carbonCashbackKg
          ? parseFloat(productForm.carbonCashbackKg)
          : 0,
        projectId: productForm.projectId || null
      }
      const res = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Erro ao cadastrar produto")
      }
      const created = await res.json()
      setProducts((prev) => [
        ...prev,
        {
          id: created.id,
          name: created.name,
          description: created.description ?? null,
          price: created.price ?? 0,
          carbonCashbackKg: created.carbonCashbackKg ?? 0,
          projectId: created.project?.id ?? null,
          projectName: created.project?.name ?? null
        }
      ])
      setProductForm({
        name: "",
        description: "",
        price: "",
        carbonCashbackKg: "",
        projectId: ""
      })
    } catch (err: any) {
      setError(err.message || "Erro inesperado")
    }
  }

  async function handleDeleteProduct(id: string) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null
    if (!token) {
      router.push("/login")
      return
    }
    if (
      typeof window !== "undefined" &&
      !window.confirm("Tem certeza que deseja excluir este produto?")
    ) {
      return
    }
    setError("")
    try {
      const res = await fetch(`${API_URL}/products/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || "Erro ao excluir produto")
      }
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } catch (err: any) {
      setError(err.message || "Erro inesperado")
    }
  }

  async function loadWalletDetail(userId: string) {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null
    if (!token) {
      return
    }
    setWalletDetailLoading(true)
    setError("")
    try {
      const res = await fetch(`${API_URL}/admin/wallets/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) {
        return
      }
      const data = await res.json()
      const detail: AdminWalletDetail = {
        user: {
          id: data.user.id,
          name: data.user.name,
          email: data.user.email,
          role: data.user.role,
          createdAt: data.user.createdAt
        },
        wallet: {
          greenBalance: data.wallet.greenBalance ?? 0,
          seedBalance: data.wallet.seedBalance ?? 0,
          createdAt: data.wallet.createdAt ?? null,
          updatedAt: data.wallet.updatedAt ?? null
        },
        greenTransactions: Array.isArray(data.greenTransactions)
          ? data.greenTransactions.map((g: any) => ({
              id: g.id,
              amount: g.amount ?? 0,
              type: g.type ?? "",
              source: g.source ?? "",
              createdAt: g.createdAt ?? ""
            }))
          : [],
        seedTransactions: Array.isArray(data.seedTransactions)
          ? data.seedTransactions.map((s: any) => ({
              id: s.id,
              amount: s.amount ?? 0,
              txId: s.txId ?? null,
              status: s.status ?? "",
              createdAt: s.createdAt ?? ""
            }))
          : []
      }
      setWalletDetail(detail)
    } catch {
    } finally {
      setWalletDetailLoading(false)
    }
  }

  async function handleUpdateUserRole(userId: string, role: AdminUser["role"]) {
    if (savingUserId) {
      return
    }
    const token = localStorage.getItem("accessToken")
    if (!token) {
      return
    }
    setSavingUserId(userId)
    try {
      const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role })
      })
      if (!res.ok) {
        return
      }
      const updated = await res.json()
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? {
                ...u,
                role: updated.role
              }
            : u
        )
      )
    } finally {
      setSavingUserId(null)
    }
  }

  async function handleAdjustWallet(userId: string) {
    if (walletSavingUserId) {
      return
    }
    const token = localStorage.getItem("accessToken")
    if (!token) {
      return
    }

    const value = parseInt(walletAdjustAmount, 10)
    if (!value || !Number.isFinite(value)) {
      setError("Informe um valor inteiro para ajuste de Green Tokens.")
      return
    }

    setWalletSavingUserId(userId)
    setError("")
    try {
      const res = await fetch(`${API_URL}/admin/wallets/${userId}/adjust-green`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ amount: value })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          data.message || "Não foi possível ajustar o saldo de Green Tokens."
        )
      }
      const updated = await res.json()
      setWallets((prev) =>
        prev.map((w) =>
          w.userId === userId
            ? {
                ...w,
                greenBalance: updated.greenBalance ?? w.greenBalance,
                seedBalance: updated.seedBalance ?? w.seedBalance
              }
            : w
        )
      )
      setWalletAdjustAmount("")
    } catch (err: any) {
      setError(err.message || "Erro inesperado ao ajustar carteira.")
    } finally {
      setWalletSavingUserId(null)
    }
  }

  function formatCurrency(value: number) {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2
    })
  }

  async function handlePublishSpeciesAsProduct(speciesData: ExternalSpecies) {
    setError("")
    setSuccess("")
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null

    if (!token) {
      router.push("/login")
      return
    }

    const config = speciesProductConfig[speciesData.id] || {
      price: "",
      carbonCashbackKg: "",
      projectId: ""
    }

    if (!config.price) {
      setError("Defina um preço para publicar a espécie como produto.")
      return
    }

    const price = parseFloat(config.price.replace(",", "."))
    if (!Number.isFinite(price) || price <= 0) {
      setError("Preço inválido para o produto da espécie.")
      return
    }

    const carbonCashbackKg = config.carbonCashbackKg
      ? parseFloat(config.carbonCashbackKg.replace(",", "."))
      : 0

    const productName =
      speciesData.commonName || speciesData.scientificName || "Árvore"

    const existingProduct = products.find(
      (p) => p.name.toLowerCase() === productName.toLowerCase()
    )

    if (existingProduct) {
      setError("Esta espécie já foi publicada como produto na loja.")
      return
    }

    setPublishingSpeciesId(speciesData.id)

    try {
      const existing = species.find(
        (s) =>
          s.commonName.toLowerCase() ===
          (speciesData.commonName || "").toLowerCase()
      )

      if (!existing && speciesData.commonName) {
        const speciesRes = await fetch(`${API_URL}/species`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            commonName: speciesData.commonName,
            scientificName: speciesData.scientificName,
            biome: speciesData.biome,
            imageUrl: speciesData.imageUrl
          })
        })
        if (speciesRes.ok) {
          const created = await speciesRes.json()
          setSpecies((prev) => [...prev, created])
        }
      }

      const productRes = await fetch(`${API_URL}/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: productName,
          description:
            speciesData.description ||
            (speciesData.scientificName
              ? `${speciesData.scientificName}${
                  speciesData.biome ? ` • ${speciesData.biome}` : ""
                }`
              : speciesData.biome || ""),
          price,
          carbonCashbackKg,
          projectId: config.projectId || null
        })
      })

      if (!productRes.ok) {
        setError("Não foi possível publicar a espécie como produto.")
        return
      }

      const productsRes = await fetch(`${API_URL}/products`)
      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(
          Array.isArray(data)
            ? data.map((p: any) => ({
                id: p.id,
                name: p.name,
                description: p.description ?? null,
                price: p.price ?? 0,
                carbonCashbackKg: p.carbonCashbackKg ?? 0,
                projectId: p.project?.id ?? null,
                projectName: p.project?.name ?? null
              }))
            : []
        )
        setSuccess("Espécie publicada com sucesso na loja.")
      }
    } catch {
      setError("Erro inesperado ao publicar espécie como produto.")
    } finally {
      setPublishingSpeciesId(null)
    }
  }

  async function handleEnrichSpeciesImages() {
    setError("")
    setSuccess("")
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null

    if (!token) {
      router.push("/login")
      return
    }

    setEnrichingSpeciesImages(true)
    try {
      const res = await fetch(`${API_URL}/species/enrich-images`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(
          data?.message || "Não foi possível enriquecer imagens no backend."
        )
      }
      const result = await res.json().catch(() => ({}))
      const updated =
        typeof result?.updated === "number" ? result.updated : null
      setSuccess(
        updated !== null
          ? `Imagens enriquecidas: ${updated} espécie(s) atualizada(s).`
          : "Imagens enriquecidas com sucesso."
      )
      const speciesRes = await fetch(`${API_URL}/species`)
      if (speciesRes.ok) {
        const list = await speciesRes.json()
        setSpecies(Array.isArray(list) ? list : [])
      }
    } catch (err: any) {
      setError(err.message || "Erro ao enriquecer imagens.")
    } finally {
      setEnrichingSpeciesImages(false)
    }
  }

  useEffect(() => {
    const toFetch: { key: string; title: string }[] = []
    externalSpecies.forEach((item) => {
      if (item.imageUrl) {
        return
      }
      const title = item.scientificName || item.commonName || ""
      if (!title) {
        return
      }
      const key = item.id
      if (!externalSpeciesImageCache[key]) {
        toFetch.push({ key, title })
      }
    })
    if (toFetch.length === 0) {
      return
    }

    const controller = new AbortController()

    const fetchSummaryImage = async (rawTitle: string): Promise<string | null> => {
      const tryForTitle = async (title: string): Promise<string | null> => {
        const tryLang = async (lang: string): Promise<string | null> => {
          const res = await fetch(
            `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
              title
            )}`,
            { signal: controller.signal }
          )
          if (!res.ok) {
            return null
          }
          const data = await res.json()
          const source = data && data.thumbnail && data.thumbnail.source
          return typeof source === "string" ? source : null
        }

        const fromEn = await tryLang("en")
        if (fromEn) {
          return fromEn
        }
        return tryLang("pt")
      }

      const cleaned = rawTitle.trim()
      if (!cleaned) {
        return null
      }

      const direct = await tryForTitle(cleaned)
      if (direct) {
        return direct
      }

      const firstWord = cleaned.split(" ")[0]
      if (firstWord && firstWord.toLowerCase() !== cleaned.toLowerCase()) {
        return tryForTitle(firstWord)
      }

      return null
    }

    ;(async () => {
      const updates: Record<string, string> = {}
      const slice = toFetch.slice(0, 6)
      for (const item of slice) {
        try {
          const thumb = await fetchSummaryImage(item.title)
          if (thumb) {
            updates[item.key] = thumb
          }
        } catch {
        }
      }
      if (Object.keys(updates).length === 0) {
        return
      }
      setExternalSpeciesImageCache((prev) => ({ ...prev, ...updates }))
      setExternalSpecies((prev) =>
        prev.map((item) =>
          updates[item.id] ? { ...item, imageUrl: updates[item.id] } : item
        )
      )
    })()

    return () => {
      controller.abort()
    }
  }, [externalSpecies, externalSpeciesImageCache])

  useEffect(() => {
    const query = form.addressSearch.trim()
    if (!query) {
      setAddressSuggestions([])
      return
    }

    const controller = new AbortController()
    const timeout = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
            query
          )}&limit=5`,
          {
            signal: controller.signal,
            headers: {
              "Accept-Language": "pt-BR"
            }
          }
        )
        if (!res.ok) {
          return
        }
        const data = await res.json()
        if (!Array.isArray(data)) {
          return
        }
        const mapped = data.map((item: any, index: number) => {
          const address = item.address || {}
          const city =
            address.city || address.town || address.village || undefined
          const state = address.state || undefined
          const country = address.country || undefined
          const street = address.road || undefined
          const neighborhood =
            address.suburb || address.neighbourhood || undefined
          return {
            id: String(item.place_id || index),
            displayName: item.display_name || "",
            city,
            state,
            country,
            street,
            neighborhood,
            lat: item.lat,
            lon: item.lon
          }
        })
        setAddressSuggestions(mapped)
      } catch {
      }
    }, 500)

    return () => {
      clearTimeout(timeout)
      controller.abort()
    }
  }, [form.addressSearch])

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <p>Carregando painel administrativo...</p>
      </div>
    )
  }

  if (!allowed) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-slate-900/80 border border-red-900 rounded-3xl p-6 text-sm text-red-100">
          <h1 className="text-lg font-semibold mb-2">
            Acesso restrito a administradores
          </h1>
          <p className="text-red-100/80 mb-2">
            Configure um usuário admin (<span className="font-mono">ADMIN_EMAIL</span>{" "}
            no .env) e faça login com ele para acessar este painel.
          </p>
          <button
            className="mt-3 inline-flex items-center px-4 py-2 rounded-full bg-red-500 text-red-950 text-xs font-semibold hover:bg-red-400"
            onClick={() => router.push("/login")}
          >
            Ir para login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex">
      <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-right border-emerald-900 px-6 py-8 space-y-6">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-emerald-300">
            SementeToken
          </p>
          <p className="mt-1 font-semibold text-sm text-emerald-50">
            Painel administrativo
          </p>
        </div>
        <nav className="flex-1 space-y-1 text-sm">
          <button
            className={
              activeSection === "overview"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("overview")}
          >
            Visão geral
          </button>
          <button
            className={
              activeSection === "projects"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("projects")}
          >
            Projetos
          </button>
          <button
            className={
              activeSection === "trees"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("trees")}
          >
            Árvores
          </button>
          <button
            className={
              activeSection === "species"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("species")}
          >
            Espécies (API)
          </button>
          <button
            className={
              activeSection === "users"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("users")}
          >
            Usuários
          </button>
          <button
            className={
              activeSection === "wallets"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("wallets")}
          >
            Tokens e carteiras
          </button>
          <button
            className={
              activeSection === "feed"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("feed")}
          >
            Feed e brigadas
          </button>
          <button
            className={
              activeSection === "brigades"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("brigades")}
          >
            Gestão de brigadas
          </button>
          <button
            className={
              activeSection === "regions"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("regions")}
          >
            Regiões
          </button>
          <button
            className={
              activeSection === "store"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("store")}
          >
            Loja
          </button>
          <button
            className={
              activeSection === "finance"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("finance")}
          >
            Financeiro
          </button>
          <button
            className={
              activeSection === "apis"
                ? "w-full text-left px-3 py-2 rounded-lg bg-emerald-500 text-emerald-950"
                : "w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50"
            }
            onClick={() => setActiveSection("apis")}
          >
            APIs
          </button>
          <button
            className="w-full text-left px-3 py-2 rounded-lg hover:bg-emerald-900/50 mt-4 text-xs flex items-center justify-between text-emerald-50"
            onClick={() => {
              if (typeof window !== "undefined") {
                localStorage.removeItem("accessToken")
                localStorage.removeItem("refreshToken")
              }
              router.push("/login")
            }}
          >
            <span>Sair</span>
            <span>↪</span>
          </button>
        </nav>
      </aside>

      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-10 lg:py-14 space-y-8">
          <header className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-200">
              Console de governança
            </p>
            <h1 className="text-3xl md:text-4xl font-bold text-emerald-50">
              Painel Administrativo
            </h1>
            <p className="text-sm md:text-base text-emerald-50/80 max-w-2xl">
              Controle usuários, projetos, árvores, loja e dados financeiros da
              plataforma em um só lugar.
            </p>
          </header>

          {activeSection === "overview" && (
            <>
              <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-emerald-900">
                  <h3 className="text-emerald-200 text-xs font-semibold tracking-wide">
                    Projetos ativos
                  </h3>
                  <p className="mt-2 text-3xl font-bold text-emerald-300">
                    {projects.length}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Disponíveis no marketplace e no mapa.
                  </p>
                </div>
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-sky-900">
                  <h3 className="text-sky-200 text-xs font-semibold tracking-wide">
                    Catálogo de espécies
                  </h3>
                  <p className="mt-2 text-3xl font-bold text-sky-300">
                    {species.length}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Prontas para virar produto.
                  </p>
                </div>
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-amber-900">
                  <h3 className="text-amber-200 text-xs font-semibold tracking-wide">
                    Pedidos totais
                  </h3>
                  <p className="mt-2 text-3xl font-bold text-amber-300">
                    {finance ? finance.ordersCount : 0}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Registrados na plataforma.
                  </p>
                </div>
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-purple-900">
                  <h3 className="text-purple-200 text-xs font-semibold tracking-wide">
                    Receita total
                  </h3>
                  <p className="mt-2 text-3xl font-bold text-purple-300">
                    {finance
                      ? finance.totalRevenue.toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL"
                        })
                      : "R$ 0,00"}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Soma de todas as vendas.
                  </p>
                </div>
              </section>
              <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-emerald-900">
                  <h3 className="text-emerald-200 text-xs font-semibold tracking-wide">
                    Cashback de CO₂ acumulado
                  </h3>
                  <p className="mt-2 text-3xl font-bold text-emerald-300">
                    {finance
                      ? `${(finance.totalCashbackKg / 1000).toFixed(2)} t CO₂`
                      : "0,00 t CO₂"}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Estimativa acumulada em kg → toneladas.
                  </p>
                </div>
                <div className="bg-slate-900/80 p-5 rounded-2xl border border-sky-900">
                  <h3 className="text-sky-200 text-xs font-semibold tracking-wide">
                    Semente Tokens gerados
                  </h3>
                  <p className="mt-2 text-3xl font-bold text-sky-300">
                    {finance ? finance.totalTokens : 0}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Total de tokens vinculados a árvores.
                  </p>
                </div>
              </section>
            </>
          )}

          {activeSection === "projects" && (
            <>
              <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900">
                <h2 className="text-xl font-bold mb-4 text-emerald-100">
                  Criar novo projeto
                </h2>
                {error && (
                  <div className="mb-4 text-xs text-red-200 bg-red-900/40 border border-red-500/40 px-3 py-2 rounded-lg">
                    {error}
                  </div>
                )}
                <form
                  onSubmit={handleCreateProject}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <input
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    placeholder="Nome do projeto"
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    required
                  />
                  <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] gap-3 items-end">
                    <div className="relative">
                      <input
                        className="w-full border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                        placeholder="Rua, bairro, cidade, estado"
                        value={form.addressSearch}
                        onChange={(e) =>
                          setForm({ ...form, addressSearch: e.target.value })
                        }
                      />
                      {addressSuggestions.length > 0 && (
                        <ul className="absolute z-10 mt-1 w-full bg-slate-950 border border-emerald-800 rounded-xl max-h-48 overflow-y-auto text-xs">
                          {addressSuggestions.map((sug) => (
                            <li key={sug.id}>
                              <button
                                type="button"
                                className="w-full text-left px-3 py-2 hover:bg-emerald-900/60"
                                onClick={() => {
                                  setForm((prev) => ({
                                    ...prev,
                                    addressSearch: sug.displayName,
                                    city: sug.city || prev.city,
                                    state: sug.state || prev.state,
                                    country: sug.country || prev.country,
                                    street: sug.street || prev.street,
                                    neighborhood:
                                      sug.neighborhood || prev.neighborhood,
                                    latitude: sug.lat || prev.latitude,
                                    longitude: sug.lon || prev.longitude
                                  }))
                                  setAddressSuggestions([])
                                }}
                              >
                                <span className="block text-emerald-100">
                                  {sug.displayName}
                                </span>
                                <span className="block text-emerald-300/80">
                                  {[sug.city, sug.state, sug.country]
                                    .filter(Boolean)
                                    .join(", ")}
                                </span>
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button
                      type="button"
                      className="bg-emerald-500 text-emerald-950 py-2 px-4 rounded-full text-sm font-semibold hover:bg-emerald-400"
                      onClick={async () => {
                        const query = form.addressSearch.trim()
                        if (!query) return
                        try {
                          const res = await fetch(
                            `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&q=${encodeURIComponent(
                              query
                            )}&limit=1`
                          )
                          if (!res.ok) {
                            return
                          }
                          const data = await res.json()
                          if (!Array.isArray(data) || data.length === 0) {
                            return
                          }
                          const first = data[0] as any
                          const address = first.address || {}
                          setForm((prev) => ({
                            ...prev,
                            city:
                              address.city ||
                              address.town ||
                              address.village ||
                              prev.city,
                            state: address.state || prev.state,
                            country: address.country || prev.country,
                            street: address.road || prev.street,
                            neighborhood:
                              address.suburb ||
                              address.neighbourhood ||
                              prev.neighborhood,
                            latitude: first.lat ? String(first.lat) : prev.latitude,
                            longitude: first.lon ? String(first.lon) : prev.longitude
                          }))
                        } catch {
                        }
                      }}
                    >
                      Buscar endereço real
                    </button>
                  </div>
                  <input
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    placeholder="Cidade"
                    value={form.city}
                    onChange={(e) =>
                      setForm({ ...form, city: e.target.value })
                    }
                  />
                  <input
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    placeholder="Estado"
                    value={form.state}
                    onChange={(e) =>
                      setForm({ ...form, state: e.target.value })
                    }
                  />
                  <input
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    placeholder="País"
                    value={form.country}
                    onChange={(e) =>
                      setForm({ ...form, country: e.target.value })
                    }
                  />
                  <input
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    placeholder="Área total (ha)"
                    value={form.totalArea}
                    onChange={(e) =>
                      setForm({ ...form, totalArea: e.target.value })
                    }
                  />
                  <input
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    placeholder="Rua (opcional)"
                    value={form.street}
                    onChange={(e) =>
                      setForm({ ...form, street: e.target.value })
                    }
                  />
                  <input
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    placeholder="Bairro (opcional)"
                    value={form.neighborhood}
                    onChange={(e) =>
                      setForm({ ...form, neighborhood: e.target.value })
                    }
                  />
                  <input
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    placeholder="Latitude (opcional)"
                    value={form.latitude}
                    onChange={(e) =>
                      setForm({ ...form, latitude: e.target.value })
                    }
                  />
                  <input
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    placeholder="Longitude (opcional)"
                    value={form.longitude}
                    onChange={(e) =>
                      setForm({ ...form, longitude: e.target.value })
                    }
                  />
                  <textarea
                    className="border border-emerald-800 rounded px-3 py-2 md:col-span-2 bg-slate-950 text-emerald-50 text-sm"
                    placeholder="Descrição"
                    value={form.description}
                    onChange={(e) =>
                      setForm({ ...form, description: e.target.value })
                    }
                  />
                  <button
                    type="submit"
                    className="bg-emerald-400 text-emerald-950 py-2 px-4 rounded-full text-sm font-semibold md:col-span-2 hover:bg-emerald-300"
                  >
                    Salvar projeto
                  </button>
                </form>
              </section>

              <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900">
                <h2 className="text-xl font-bold mb-4 text-emerald-100">
                  Projetos cadastrados
                </h2>
                {projects.length === 0 ? (
                  <p className="text-emerald-200/80 text-sm">
                    Nenhum projeto cadastrado ainda.
                  </p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Nome</th>
                        <th className="py-2">Localização</th>
                        <th className="py-2">Área</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projects.map((p) => (
                        <tr key={p.id} className="border-b border-emerald-900/60">
                          <td className="py-2 text-emerald-50">{p.name}</td>
                          <td className="py-2 text-emerald-100/80">
                            {[p.city, p.state, p.country]
                              .filter(Boolean)
                              .join(", ")}
                          </td>
                          <td className="py-2 text-emerald-100/80">
                            {p.totalArea ? `${p.totalArea} ha` : "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </>
          )}

          {activeSection === "trees" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900 space-y-6">
              <div>
                <h2 className="text-xl font-bold mb-4 text-emerald-100">
                  Cadastrar árvore
                </h2>
                <p className="text-emerald-200/80 mb-4 text-sm">
                  Associe árvores a projetos com coordenadas geográficas
                  (lat/long). Elas aparecerão no mapa do marketplace.
                </p>
                <form
                  onSubmit={handleCreateTree}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <select
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    value={treeForm.projectId}
                    onChange={(e) =>
                      setTreeForm({ ...treeForm, projectId: e.target.value })
                    }
                  >
                    <option value="">Selecione um projeto (opcional)</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    value={treeForm.species}
                    onChange={(e) =>
                      setTreeForm({ ...treeForm, species: e.target.value })
                    }
                    required
                  >
                    <option value="">Selecione uma espécie</option>
                    {species.map((s) => (
                      <option key={s.id} value={s.commonName}>
                        {s.commonName}
                        {s.scientificName ? ` • ${s.scientificName}` : ""}
                      </option>
                    ))}
                  </select>
                  <input
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    placeholder="Latitude (ex: -23.55)"
                    value={treeForm.latitude}
                    onChange={(e) =>
                      setTreeForm({ ...treeForm, latitude: e.target.value })
                    }
                    required
                  />
                  <input
                    className="border rounded px-3 py-2"
                    placeholder="Longitude (ex: -46.63)"
                    value={treeForm.longitude}
                    onChange={(e) =>
                      setTreeForm({ ...treeForm, longitude: e.target.value })
                    }
                    required
                  />
                  <input
                    type="date"
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    value={treeForm.plantedAt}
                    onChange={(e) =>
                      setTreeForm({ ...treeForm, plantedAt: e.target.value })
                    }
                  />
                  <input
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    placeholder="Estágio (muda, jovem, adulta...)"
                    value={treeForm.growthStage}
                    onChange={(e) =>
                      setTreeForm({
                        ...treeForm,
                        growthStage: e.target.value
                      })
                    }
                  />
                  <input
                    className="border border-emerald-800 rounded px-3 py-2 bg-slate-950 text-emerald-50 text-sm"
                    placeholder="CO₂ estimado total (kg)"
                    value={treeForm.estimatedCo2Total}
                    onChange={(e) =>
                      setTreeForm({
                        ...treeForm,
                        estimatedCo2Total: e.target.value
                      })
                    }
                  />
                  <button
                    type="submit"
                    className="bg-emerald-400 text-emerald-950 py-2 px-4 rounded-full text-sm font-semibold md:col-span-2 hover:bg-emerald-300"
                  >
                    Salvar árvore
                  </button>
                </form>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 text-emerald-100">
                  Árvores cadastradas
                </h3>
                {trees.length === 0 ? (
                  <p className="text-sm text-emerald-200/80">
                    Nenhuma árvore cadastrada ainda.
                  </p>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-emerald-900/60">
                        <th className="py-2">Espécie</th>
                        <th className="py-2 hidden md:table-cell">
                          Projeto
                        </th>
                        <th className="py-2 hidden md:table-cell">
                          Plantada em
                        </th>
                        <th className="py-2 text-right">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trees.map((tree) => (
                        <tr
                          key={tree.id}
                          className="border-b border-emerald-900/40"
                        >
                          <td className="py-2 text-emerald-50">
                            {tree.species}
                          </td>
                          <td className="py-2 text-emerald-100/80 hidden md:table-cell">
                            {tree.projectName || "-"}
                          </td>
                          <td className="py-2 text-emerald-100/80 hidden md:table-cell">
                            {tree.plantedAt
                              ? new Date(tree.plantedAt).toLocaleDateString(
                                  "pt-BR"
                                )
                              : "-"}
                          </td>
                          <td className="py-2 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteTree(tree.id)}
                              className="text-[11px] px-3 py-1 rounded-full border border-red-600 text-red-200 hover:bg-red-900/40"
                            >
                              Excluir
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {activeSection === "species" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900">
              <h2 className="text-xl font-bold mb-2 text-emerald-100">
                Catálogo de espécies (API pública)
              </h2>
              <p className="text-sm text-emerald-200/80 mb-4">
                Conecte a SementeToken a uma API pública de espécies para trazer
                fotos, nomes científicos e biomas. Com poucos cliques você
                transforma uma espécie em produto de loja.
              </p>
              {success && (
                <div className="mb-4 text-xs text-emerald-100 bg-emerald-900/40 border border-emerald-500/70 px-3 py-2 rounded-lg">
                  {success}
                </div>
              )}
              {error && (
                <div className="mb-4 text-xs text-red-200 bg-red-900/40 border border-red-500/40 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              {externalSpecies.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-emerald-200/80">
                    O catálogo da API pública ainda não foi carregado nesta
                    sessão.
                  </p>
                  <button
                    type="button"
                    onClick={fetchExternalSpecies}
                    disabled={externalSpeciesLoading}
                    className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-400 text-emerald-950 text-sm font-semibold hover:bg-emerald-300 disabled:opacity-50"
                  >
                    {externalSpeciesLoading
                      ? "Carregando espécies..."
                      : "Carregar espécies da API pública"}
                  </button>
                  <p className="text-xs text-emerald-200/70">
                    Isso pode levar alguns segundos, pois a lista é grande.
                    Depois de carregada, você pode transformar espécies em
                    produtos sem precisar buscar de novo.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-col gap-3 mb-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        placeholder="Filtrar por nome comum ou científico"
                        className="w-full md:max-w-xs border border-emerald-800 rounded-full px-3 py-1.5 text-xs bg-slate-950 text-emerald-50 placeholder:text-emerald-200/60"
                        value={externalSpeciesSearch}
                        onChange={(e) => {
                          setExternalSpeciesSearch(e.target.value)
                          setExternalSpeciesPage(1)
                        }}
                      />
                      {externalSpeciesSearch && (
                        <button
                          type="button"
                          onClick={() => {
                            setExternalSpeciesSearch("")
                            setExternalSpeciesPage(1)
                          }}
                          className="text-[11px] text-emerald-200 hover:text-emerald-100"
                        >
                          Limpar
                        </button>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-xs text-emerald-200/80">
                        {externalSpecies.length} espécies carregadas da API
                        pública.
                      </p>
                      <button
                        type="button"
                        onClick={fetchExternalSpecies}
                        disabled={externalSpeciesLoading}
                        className="inline-flex items-center px-3 py-1.5 rounded-full border border-emerald-500/60 text-xs text-emerald-100 hover:bg-emerald-500/10 disabled:opacity-50"
                      >
                        {externalSpeciesLoading
                          ? "Atualizando..."
                          : "Recarregar catálogo"}
                      </button>
                      <button
                        type="button"
                        onClick={handleEnrichSpeciesImages}
                        disabled={enrichingSpeciesImages}
                        className="inline-flex items-center px-3 py-1.5 rounded-full border border-sky-500/60 text-xs text-emerald-100 hover:bg-sky-500/10 disabled:opacity-50"
                      >
                        {enrichingSpeciesImages
                          ? "Enriquecendo imagens..."
                          : "Enriquecer imagens (backend)"}
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {externalSpecies
                      .filter((item) => {
                        if (!externalSpeciesSearch.trim()) {
                          return true
                        }
                        const q = externalSpeciesSearch.toLowerCase()
                        const common = (item.commonName || "").toLowerCase()
                        const scientific = (item.scientificName || "").toLowerCase()
                        return common.includes(q) || scientific.includes(q)
                      })
                      .slice(
                        (externalSpeciesPage - 1) * EXTERNAL_SPECIES_PAGE_SIZE,
                        externalSpeciesPage * EXTERNAL_SPECIES_PAGE_SIZE
                      )
                      .map((item) => {
                        const config = speciesProductConfig[item.id] || {
                          price: "",
                          carbonCashbackKg: "",
                          projectId: ""
                        }

                    const productName =
                      item.commonName || item.scientificName || "Árvore"

                    const alreadyPublished = products.some(
                      (p) =>
                        p.name.toLowerCase() === productName.toLowerCase()
                    )

                        return (
                          <div
                            key={item.id}
                            className="border border-emerald-900 rounded-2xl bg-slate-950/80 overflow-hidden flex flex-col"
                          >
                            {item.imageUrl ? (
                              <div className="h-32 bg-slate-900 overflow-hidden">
                                <img
                                  src={item.imageUrl}
                                  alt={item.commonName || item.scientificName || ""}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="h-32 bg-gradient-to-r from-emerald-500 via-sky-500 to-emerald-400 flex items-center justify-center text-xs text-emerald-950 font-semibold px-3 text-center">
                                {item.commonName || item.scientificName || "Espécie"}
                              </div>
                            )}
                            <div className="p-4 flex-1 flex flex-col gap-2 text-xs">
                              <div>
                                <p className="text-emerald-100 font-semibold text-sm">
                                  {item.commonName || "Espécie sem nome comum"}
                                </p>
                                {item.scientificName && (
                                  <p className="text-emerald-300/80 italic">
                                    {item.scientificName}
                                  </p>
                                )}
                                {item.biome && (
                                  <p className="text-emerald-200/80 mt-1">
                                    Bioma: {item.biome}
                                  </p>
                                )}
                                {item.description && (
                                  <p className="text-emerald-200/70 mt-1 line-clamp-3">
                                    {item.description}
                                  </p>
                                )}
                              </div>
                              <div className="mt-2 grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] text-emerald-200/80 mb-1">
                                    Preço (R$)
                                  </label>
                                  <input
                                    className="w-full border border-emerald-800 rounded px-2 py-1 text-[11px] bg-slate-950 text-emerald-50"
                                    value={config.price}
                                    onChange={(e) =>
                                      updateSpeciesProductConfig(
                                        item.id,
                                        "price",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] text-emerald-200/80 mb-1">
                                    Cashback (kg CO₂)
                                  </label>
                                  <input
                                    className="w-full border border-emerald-800 rounded px-2 py-1 text-[11px] bg-slate-950 text-emerald-50"
                                    value={config.carbonCashbackKg}
                                    onChange={(e) =>
                                      updateSpeciesProductConfig(
                                        item.id,
                                        "carbonCashbackKg",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              </div>
                              <div className="mt-2">
                                <label className="block text-[10px] text-emerald-200/80 mb-1">
                                  Projeto associado (opcional)
                                </label>
                                <select
                                  className="w-full border border-emerald-800 rounded px-2 py-1 text-[11px] bg-slate-950 text-emerald-50"
                                  value={config.projectId}
                                  onChange={(e) =>
                                    updateSpeciesProductConfig(
                                      item.id,
                                      "projectId",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="">Nenhum projeto específico</option>
                                  {projects.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div className="mt-3">
                                <button
                                  className="w-full bg-emerald-400 text-emerald-950 py-2 rounded-full text-[11px] font-semibold hover:bg-emerald-300 disabled:opacity-50"
                                  disabled={publishingSpeciesId === item.id || alreadyPublished}
                                  onClick={() => handlePublishSpeciesAsProduct(item)}
                                >
                                  {publishingSpeciesId === item.id
                                    ? "Publicando..."
                                    : alreadyPublished
                                    ? "Já publicado na loja"
                                    : "Publicar como produto na loja"}
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                  </div>
                  <div className="mt-4 flex items-center justify-between text-[11px] text-emerald-200/80">
                    <span>
                      Página {externalSpeciesPage} de{" "}
                      {Math.max(
                        1,
                        Math.ceil(
                          externalSpecies.filter((item) => {
                            if (!externalSpeciesSearch.trim()) {
                              return true
                            }
                            const q = externalSpeciesSearch.toLowerCase()
                            const common = (item.commonName || "").toLowerCase()
                            const scientific = (item.scientificName || "").toLowerCase()
                            return common.includes(q) || scientific.includes(q)
                          }).length / EXTERNAL_SPECIES_PAGE_SIZE
                        )
                      )}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={externalSpeciesPage === 1}
                        onClick={() =>
                          setExternalSpeciesPage((prev) => Math.max(1, prev - 1))
                        }
                        className="px-2 py-1 rounded-full border border-emerald-700 disabled:opacity-40 hover:bg-emerald-500/10"
                      >
                        Anterior
                      </button>
                      <button
                        type="button"
                        disabled={
                          externalSpeciesPage * EXTERNAL_SPECIES_PAGE_SIZE >=
                          externalSpecies.filter((item) => {
                            if (!externalSpeciesSearch.trim()) {
                              return true
                            }
                            const q = externalSpeciesSearch.toLowerCase()
                            const common = (item.commonName || "").toLowerCase()
                            const scientific = (item.scientificName || "").toLowerCase()
                            return common.includes(q) || scientific.includes(q)
                          }).length
                        }
                        onClick={() =>
                          setExternalSpeciesPage((prev) => prev + 1)
                        }
                        className="px-2 py-1 rounded-full border border-emerald-700 disabled:opacity-40 hover:bg-emerald-500/10"
                      >
                        Próxima
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          )}

          {activeSection === "users" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900">
              <h2 className="text-xl font-bold mb-2 text-emerald-100">
                Usuários
              </h2>
              <p className="text-sm text-emerald-200/80 mb-4">
                Gerencie os perfis de acesso da plataforma.
              </p>
              {users.length === 0 ? (
                <p className="text-sm text-emerald-200/80">
                  Nenhum usuário cadastrado ainda.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Nome</th>
                        <th className="py-2">Email</th>
                        <th className="py-2">Perfil</th>
                        <th className="py-2">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-emerald-900/60 text-emerald-50"
                        >
                          <td className="py-2">{user.name}</td>
                          <td className="py-2">{user.email}</td>
                          <td className="py-2">
                            <select
                              className="border border-emerald-800 rounded px-2 py-1 text-xs bg-slate-950 text-emerald-50"
                              value={user.role}
                              onChange={(e) =>
                                setUsers((prev) =>
                                  prev.map((u) =>
                                    u.id === user.id
                                      ? { ...u, role: e.target.value as AdminUser["role"] }
                                      : u
                                  )
                                )
                              }
                            >
                              <option value="user">Usuário</option>
                              <option value="admin">Admin</option>
                              <option value="corporate">Corporativo</option>
                            </select>
                          </td>
                          <td className="py-2">
                            <button
                              className="text-xs px-3 py-1 rounded-full bg-emerald-400 text-emerald-950 disabled:opacity-50 hover:bg-emerald-300"
                              disabled={savingUserId === user.id}
                              onClick={() => handleUpdateUserRole(user.id, user.role)}
                            >
                              {savingUserId === user.id ? "Salvando..." : "Salvar"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeSection === "wallets" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900">
              <h2 className="text-xl font-bold mb-2 text-emerald-100">
                Tokens e carteiras
              </h2>
              <p className="text-sm text-emerald-200/80 mb-4">
                Enxergue o saldo de Green Tokens internos e Semente Tokens por
                usuário e acompanhe as movimentações.
              </p>
              {error && (
                <div className="mb-4 text-xs text-red-200 bg-red-900/40 border border-red-500/40 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              {wallets.length === 0 ? (
                <p className="text-sm text-emerald-200/80">
                  Nenhuma carteira encontrada ainda. Assim que os usuários
                  começarem a usar a plataforma, elas aparecerão aqui.
                </p>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                  <div className="xl:col-span-2 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="py-2">Usuário</th>
                          <th className="py-2">Email</th>
                          <th className="py-2 text-right">Green Tokens</th>
                          <th className="py-2 text-right">Semente Tokens</th>
                          <th className="py-2 text-right">Ajustar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wallets.map((wallet) => (
                          <tr
                            key={wallet.userId}
                            className={
                              "border-b border-emerald-900/60 text-emerald-50 cursor-pointer" +
                              (selectedWalletUserId === wallet.userId
                                ? " bg-emerald-900/30"
                                : "")
                            }
                            onClick={() => {
                              setSelectedWalletUserId(wallet.userId)
                              loadWalletDetail(wallet.userId)
                            }}
                          >
                            <td className="py-2">
                              <div className="flex flex-col">
                                <span>{wallet.name}</span>
                                <span className="text-[11px] text-emerald-200/80">
                                  {wallet.role === "admin"
                                    ? "Admin"
                                    : wallet.role === "corporate"
                                    ? "Corporativo"
                                    : "Usuário"}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 text-xs">{wallet.email}</td>
                            <td className="py-2 text-right">
                              {wallet.greenBalance}
                            </td>
                            <td className="py-2 text-right">
                              {wallet.seedBalance}
                            </td>
                            <td className="py-2 text-right">
                              <button
                                className="text-[11px] px-3 py-1 rounded-full bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setSelectedWalletUserId(wallet.userId)
                                  loadWalletDetail(wallet.userId)
                                }}
                              >
                                Detalhar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4 text-sm space-y-3">
                      <h3 className="text-sm font-semibold text-emerald-100">
                        Ajuste manual de Green Tokens
                      </h3>
                      <p className="text-xs text-emerald-200/80">
                        Use para correções pontuais de saldo. Valores positivos
                        adicionam Green Tokens, valores negativos removem.
                      </p>
                      <label className="block text-[11px] text-emerald-200/80 mb-1">
                        Valor de ajuste (inteiro)
                      </label>
                      <input
                        className="w-full border border-emerald-800 rounded px-3 py-2 text-sm bg-slate-950 text-emerald-50"
                        placeholder="Ex: 100 ou -50"
                        value={walletAdjustAmount}
                        onChange={(e) => setWalletAdjustAmount(e.target.value)}
                        type="number"
                      />
                      <button
                        className="mt-2 w-full bg-emerald-400 text-emerald-950 py-2 px-4 rounded-full text-sm font-semibold hover:bg-emerald-300 disabled:opacity-50"
                        disabled={!selectedWalletUserId || !!walletSavingUserId}
                        onClick={() => {
                          if (selectedWalletUserId) {
                            handleAdjustWallet(selectedWalletUserId)
                          }
                        }}
                      >
                        {walletSavingUserId
                          ? "Aplicando ajuste..."
                          : "Aplicar ajuste na carteira selecionada"}
                      </button>
                    </div>
                    <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4 text-sm space-y-3">
                      <h3 className="text-sm font-semibold text-emerald-100">
                        Histórico de transações
                      </h3>
                      {walletDetailLoading && (
                        <p className="text-xs text-emerald-200/80">
                          Carregando detalhes da carteira...
                        </p>
                      )}
                      {!walletDetailLoading && !walletDetail && (
                        <p className="text-xs text-emerald-200/80">
                          Selecione um usuário na tabela ao lado para ver o
                          histórico de Green e Semente Tokens.
                        </p>
                      )}
                      {!walletDetailLoading && walletDetail && (
                        <div className="space-y-3">
                          <div>
                            <p className="text-xs text-emerald-200/80">
                              Usuário selecionado
                            </p>
                            <p className="text-sm font-semibold text-emerald-100">
                              {walletDetail.user.name}
                            </p>
                            <p className="text-[11px] text-emerald-200/80">
                              Green: {walletDetail.wallet.greenBalance} • Semente:{" "}
                              {walletDetail.wallet.seedBalance}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-emerald-200 mb-1">
                              Últimos créditos/debitos de Green
                            </p>
                            {walletDetail.greenTransactions.length === 0 ? (
                              <p className="text-[11px] text-emerald-200/70">
                                Nenhuma transação de Green registrada ainda.
                              </p>
                            ) : (
                              <ul className="max-h-32 overflow-y-auto space-y-1 text-[11px] text-emerald-50">
                                {walletDetail.greenTransactions.map((g) => (
                                  <li
                                    key={g.id}
                                    className="flex items-center justify-between gap-2"
                                  >
                                    <div>
                                      <span className="font-medium">
                                        {g.amount > 0 ? "+" : ""}
                                        {g.amount}
                                      </span>{" "}
                                      <span className="uppercase text-emerald-200/80">
                                        {g.type}
                                      </span>
                                      <span className="text-emerald-200/70">
                                        {" "}
                                        • {g.source}
                                      </span>
                                    </div>
                                    <span className="text-[10px] text-emerald-300/80">
                                      {g.createdAt
                                        ? new Date(
                                            g.createdAt
                                          ).toLocaleDateString("pt-BR")
                                        : "-"}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-emerald-200 mb-1">
                              Últimos movimentos de Semente Tokens
                            </p>
                            {walletDetail.seedTransactions.length === 0 ? (
                              <p className="text-[11px] text-emerald-200/70">
                                Nenhuma transação de Semente registrada ainda.
                              </p>
                            ) : (
                              <ul className="max-h-32 overflow-y-auto space-y-1 text-[11px] text-emerald-50">
                                {walletDetail.seedTransactions.map((s) => (
                                  <li
                                    key={s.id}
                                    className="flex items-center justify-between gap-2"
                                  >
                                    <div>
                                      <span className="font-medium">
                                        {s.amount > 0 ? "+" : ""}
                                        {s.amount}
                                      </span>{" "}
                                      <span className="uppercase text-emerald-200/80">
                                        {s.status}
                                      </span>
                                      {s.txId && (
                                        <span className="text-emerald-200/70">
                                          {" "}
                                          • {s.txId.slice(0, 8)}...
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-emerald-300/80">
                                      {s.createdAt
                                        ? new Date(
                                            s.createdAt
                                          ).toLocaleDateString("pt-BR")
                                        : "-"}
                                    </span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeSection === "feed" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900">
              <h2 className="text-xl font-bold mb-2 text-emerald-100">
                Moderação do feed e brigadas
              </h2>
              <p className="text-sm text-emerald-200/80 mb-4">
                Aprove ou rejeite ações de plantio, inspeção e alertas enviadas por
                brigadas parceiras e guardiões da floresta antes de aparecerem no feed público.
              </p>
              {error && (
                <div className="mb-4 text-xs text-red-200 bg-red-900/40 border border-red-500/40 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-4 text-xs text-emerald-100 bg-emerald-900/40 border border-emerald-500/40 px-3 py-2 rounded-lg">
                  {success}
                </div>
              )}
              {feedLoading ? (
                <p className="text-sm text-emerald-200/80">
                  Carregando ações pendentes...
                </p>
              ) : feedActions.length === 0 ? (
                <p className="text-sm text-emerald-200/80">
                  Nenhuma ação pendente de aprovação no momento. Novos registros de campo aparecerão aqui para revisão.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2">Tipo</th>
                        <th className="py-2">Brigada / origem</th>
                        <th className="py-2">Responsável</th>
                        <th className="py-2">Espécie</th>
                        <th className="py-2">Local</th>
                        <th className="py-2">Descrição</th>
                        <th className="py-2 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {feedActions.map((action) => {
                        let label = "Ação"
                        if (action.type === "planting") {
                          label = "Plantio"
                        } else if (action.type === "inspection") {
                          label = "Inspeção"
                        } else if (action.type === "fire_alert") {
                          label = "Alerta de fogo"
                        }
                        const originLabel =
                          action.ownerRole === "corporate"
                            ? "Brigada parceira"
                            : "Guardião"
                        const locationLabel =
                          action.latitude !== null && action.longitude !== null
                            ? `${action.latitude.toFixed(3)}, ${action.longitude.toFixed(3)}`
                            : "Sem coordenadas"

                        return (
                          <tr
                            key={action.id}
                            className="border-b border-emerald-900/60 text-emerald-50 align-top"
                          >
                            <td className="py-2 text-xs">
                              <div className="flex flex-col">
                                <span>{label}</span>
                                <span className="text-[10px] text-emerald-200/80">
                                  {action.createdAt
                                    ? new Date(action.createdAt).toLocaleString("pt-BR")
                                    : ""}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 text-xs">
                              <div className="flex flex-col">
                                <span>{action.brigadeName || "Brigada do guardião"}</span>
                                <span className="text-[10px] text-emerald-200/80">
                                  {originLabel}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 text-xs">
                              <div className="flex flex-col">
                                <span>{action.ownerName || "Sem nome"}</span>
                                <span className="text-[10px] text-emerald-200/80">
                                  {action.ownerEmail || "Sem email"}
                                </span>
                              </div>
                            </td>
                            <td className="py-2 text-xs">
                              {action.treeSpecies || "Não vinculada"}
                            </td>
                            <td className="py-2 text-xs">{locationLabel}</td>
                            <td className="py-2 text-xs max-w-xs">
                              <div className="max-h-20 overflow-y-auto pr-1">
                                {action.description || "Sem descrição"}
                              </div>
                            </td>
                            <td className="py-2 text-right">
                              <div className="flex flex-col items-end gap-1">
                                <button
                                  className="text-xs px-3 py-1 rounded-full bg-emerald-400 text-emerald-950 hover:bg-emerald-300"
                                  onClick={() => handleApproveFeedAction(action.id)}
                                >
                                  Aprovar
                                </button>
                                <button
                                  className="text-xs px-3 py-1 rounded-full bg-red-500 text-red-50 hover:bg-red-400"
                                  onClick={() => handleRejectFeedAction(action.id)}
                                >
                                  Rejeitar
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activeSection === "brigades" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900">
              <h2 className="text-xl font-bold mb-2 text-emerald-100">
                Gestão de brigadas parceiras
              </h2>
              <p className="text-sm text-emerald-200/80 mb-4">
                Visualize brigadas conectadas à SementeToken, seus responsáveis,
                territórios e volume de operações registradas.
              </p>

              <div className="mb-6 p-4 bg-slate-950 border border-emerald-900 rounded-xl space-y-4">
                <h3 className="text-sm font-semibold text-emerald-100">Cadastrar Nova Brigada</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-emerald-200">Usuário Responsável (Email)</label>
                    <select
                       className="w-full border border-emerald-800 rounded px-2 py-1.5 bg-slate-900 text-emerald-50 text-xs"
                       value={brigadeForm.userId}
                       onChange={(e) => setBrigadeForm({...brigadeForm, userId: e.target.value})}
                    >
                      <option value="">Selecione um usuário...</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({u.email}) - {u.role}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-emerald-200">Nome da Brigada</label>
                    <input
                      className="w-full border border-emerald-800 rounded px-2 py-1.5 bg-slate-900 text-emerald-50 text-xs"
                      placeholder="Ex: Brigada Xavante"
                      value={brigadeForm.name}
                      onChange={(e) => setBrigadeForm({...brigadeForm, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] text-emerald-200">Descrição</label>
                    <input
                      className="w-full border border-emerald-800 rounded px-2 py-1.5 bg-slate-900 text-emerald-50 text-xs"
                      placeholder="Descrição opcional"
                      value={brigadeForm.description}
                      onChange={(e) => setBrigadeForm({...brigadeForm, description: e.target.value})}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2 md:col-span-2">
                    <input
                      className="border border-emerald-800 rounded px-2 py-1.5 bg-slate-900 text-emerald-50 text-xs"
                      placeholder="Cidade"
                      value={brigadeForm.city}
                      onChange={(e) => setBrigadeForm({...brigadeForm, city: e.target.value})}
                    />
                    <input
                      className="border border-emerald-800 rounded px-2 py-1.5 bg-slate-900 text-emerald-50 text-xs"
                      placeholder="Estado"
                      value={brigadeForm.state}
                      onChange={(e) => setBrigadeForm({...brigadeForm, state: e.target.value})}
                    />
                    <input
                      className="border border-emerald-800 rounded px-2 py-1.5 bg-slate-900 text-emerald-50 text-xs"
                      placeholder="País"
                      value={brigadeForm.country}
                      onChange={(e) => setBrigadeForm({...brigadeForm, country: e.target.value})}
                    />
                  </div>
                </div>
                <button
                  className="bg-emerald-500 text-emerald-950 text-xs font-bold px-4 py-2 rounded-lg hover:bg-emerald-400 transition disabled:opacity-50"
                  onClick={handleCreateBrigade}
                  disabled={loading}
                >
                  {loading ? "Criando..." : "Criar Brigada"}
                </button>
              </div>

              {brigades.length === 0 ? (
                <p className="text-sm text-emerald-200/80">
                  Nenhuma brigada cadastrada ainda. Assim que parceiros começarem
                  a operar com contas corporativas, suas brigadas aparecerão aqui.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-emerald-900/70">
                          <th className="py-2">Brigada</th>
                          <th className="py-2">Localização</th>
                          <th className="py-2 text-right">Brigadistas</th>
                          <th className="py-2 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {brigades.map((b) => (
                          <tr
                            key={b.id}
                            className={
                              "border-b border-emerald-900/40 text-emerald-50 cursor-pointer" +
                              (selectedBrigadeId === b.id
                                ? " bg-emerald-900/30"
                                : "")
                            }
                            onClick={() => setSelectedBrigadeId(b.id)}
                          >
                            <td className="py-2">
                              <div className="flex flex-col">
                                <span className="font-medium">{b.name}</span>
                                {b.owner && (
                                  <span className="text-[11px] text-emerald-200/80">
                                    Responsável: {b.owner.name} ({b.owner.email})
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="py-2 text-xs text-emerald-100/80">
                              {[b.city, b.state, b.country]
                                .filter((p) => !!p && String(p).trim().length > 0)
                                .join(", ") || "Sem localização"}
                            </td>
                            <td className="py-2 text-right text-xs">
                              {b.brigadistsCount}
                            </td>
                            <td className="py-2 text-right text-xs">
                              {b.actionsCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4 text-xs space-y-3">
                      <h3 className="text-sm font-semibold text-emerald-100">
                        Brigadistas da brigada selecionada
                      </h3>
                      {!selectedBrigadeId ? (
                        <p className="text-emerald-200/80">
                          Selecione uma brigada na tabela ao lado para listar
                          brigadistas.
                        </p>
                      ) : brigadists.length === 0 ? (
                        <p className="text-emerald-200/80">
                          Nenhum brigadista carregado ainda. Este painel será
                          conectado ao cadastro de brigadistas dos parceiros.
                        </p>
                      ) : (
                        <ul className="space-y-2 max-h-60 overflow-y-auto pr-1">
                          {brigadists.map((b) => (
                            <li
                              key={b.id}
                              className="border border-emerald-900/60 rounded-xl px-3 py-2 bg-slate-950/80"
                            >
                              <p className="font-semibold text-emerald-100">
                                {b.name}
                              </p>
                              {b.role && (
                                <p className="text-emerald-200/80 text-[11px]">
                                  Papel: {b.role}
                                </p>
                              )}
                              {b.email && (
                                <p className="text-emerald-200/80 text-[11px]">
                                  Email: {b.email}
                                </p>
                              )}
                              {b.phone && (
                                <p className="text-emerald-200/80 text-[11px]">
                                  Telefone: {b.phone}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4 text-xs space-y-3">
                      <h3 className="text-sm font-semibold text-emerald-100">
                        Mapa das ações da brigada
                      </h3>
                      {!selectedBrigadeId ? (
                        <p className="text-emerald-200/80">
                          Selecione uma brigada para visualizar as ações em mapa.
                        </p>
                      ) : brigadeActionsMap.length === 0 ? (
                        <p className="text-emerald-200/80">
                          Nenhuma ação com coordenadas registrada ainda para esta
                          brigada.
                        </p>
                      ) : (
                        <div className="w-full h-48 rounded-xl overflow-hidden border border-emerald-900">
                          <MapContainer
                            center={[
                              brigadeActionsMap[0].latitude,
                              brigadeActionsMap[0].longitude
                            ]}
                            zoom={6}
                            scrollWheelZoom={false}
                            className="w-full h-full"
                          >
                            <TileLayer
                              attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {brigadeActionsMap.map((a) => (
                              <Marker
                                key={a.id}
                                position={[a.latitude, a.longitude]}
                              />
                            ))}
                          </MapContainer>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeSection === "regions" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900">
              <h2 className="text-xl font-bold mb-2 text-emerald-100">
                Regiões e biomas
              </h2>
              <p className="text-sm text-emerald-200/80">
                Central para organizar projetos por regiões, bacias, biomas e
                territórios de atuação. Use junto com o mapa e o feed para
                comunicar transparência geográfica.
              </p>
              {regions.length === 0 ? (
                <p className="mt-4 text-sm text-emerald-200/80">
                  Nenhuma região agregada ainda a partir dos projetos cadastrados.
                </p>
              ) : (
                <div className="mt-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-emerald-900/70">
                          <th className="py-2">País</th>
                          <th className="py-2">Estado</th>
                          <th className="py-2 text-right">Projetos</th>
                        </tr>
                      </thead>
                      <tbody>
                        {regions.map((r, index) => (
                          <tr
                            key={`${r.country}-${r.state ?? "all"}-${index}`}
                            className="border-b border-emerald-900/40 text-emerald-50"
                          >
                            <td className="py-2">{r.country}</td>
                            <td className="py-2">{r.state || "-"}</td>
                            <td className="py-2 text-right">
                              {r.projectsCount}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="bg-slate-950/70 border border-emerald-900 rounded-2xl p-4 text-xs space-y-3">
                    <h3 className="text-sm font-semibold text-emerald-100">
                      Como esta visão ajuda
                    </h3>
                    <p className="text-emerald-200/80">
                      Cada linha representa um agrupamento de projetos por país
                      e estado. Combinado com o mapa de árvores e o feed de
                      brigadas, você mostra exatamente onde as ações acontecem.
                    </p>
                    <p className="text-emerald-200/80">
                      À medida que você cadastrar novos projetos em diferentes
                      cidades e estados, esta tabela vira um radar das regiões
                      de atuação da SementeToken.
                    </p>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeSection === "store" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900">
              <h2 className="text-xl font-bold mb-2 text-emerald-100">
                Loja verde
              </h2>
              <p className="text-sm text-emerald-200/80 mb-4">
                Cadastre produtos conectados a projetos e cashback de carbono.
              </p>
              {error && (
                <div className="mb-4 text-xs text-red-200 bg-red-900/40 border border-red-500/40 px-3 py-2 rounded-lg">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <form
                  onSubmit={handleCreateProduct}
                  className="space-y-3 bg-slate-950/70 border border-emerald-900 rounded-2xl p-4"
                >
                  <h3 className="text-sm font-semibold text-emerald-100">
                    Novo produto
                  </h3>
                  <input
                    className="w-full border border-emerald-800 rounded px-3 py-2 text-sm bg-slate-950 text-emerald-50"
                    placeholder="Nome do produto"
                    value={productForm.name}
                    onChange={(e) =>
                      setProductForm({ ...productForm, name: e.target.value })
                    }
                    required
                  />
                  <textarea
                    className="w-full border border-emerald-800 rounded px-3 py-2 text-sm bg-slate-950 text-emerald-50"
                    placeholder="Descrição (opcional)"
                    value={productForm.description}
                    onChange={(e) =>
                      setProductForm({
                        ...productForm,
                        description: e.target.value
                      })
                    }
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-emerald-200/80 mb-1">
                        Preço (R$)
                      </label>
                      <input
                        className="w-full border border-emerald-800 rounded px-3 py-2 text-sm bg-slate-950 text-emerald-50"
                        placeholder="0,00"
                        value={productForm.price}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            price: e.target.value
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-emerald-200/80 mb-1">
                        Cashback de carbono (kg)
                      </label>
                      <input
                        className="w-full border border-emerald-800 rounded px-3 py-2 text-sm bg-slate-950 text-emerald-50"
                        placeholder="Ex: 500"
                        value={productForm.carbonCashbackKg}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            carbonCashbackKg: e.target.value
                          })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] text-emerald-200/80 mb-1">
                      Projeto associado (opcional)
                    </label>
                    <select
                      className="w-full border border-emerald-800 rounded px-3 py-2 text-sm bg-slate-950 text-emerald-50"
                      value={productForm.projectId}
                      onChange={(e) =>
                        setProductForm({
                          ...productForm,
                          projectId: e.target.value
                        })
                      }
                    >
                      <option value="">Nenhum projeto</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="bg-emerald-400 text-emerald-950 py-2 px-4 rounded-full text-sm font-semibold hover:bg-emerald-300"
                  >
                    Salvar produto
                  </button>
                </form>

                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-emerald-100">
                    Produtos cadastrados
                  </h3>
                  {products.length === 0 ? (
                    <p className="text-xs text-emerald-200/80">
                      Nenhum produto cadastrado ainda.
                    </p>
                  ) : (
                    <ul className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {products.map((product) => {
                        const normalizedProductName = product.name
                          .toLowerCase()
                          .trim()
                        const relatedSpecies =
                          species.find((s) => {
                            const common = s.commonName.toLowerCase().trim()
                            return (
                              common === normalizedProductName ||
                              common.includes(normalizedProductName) ||
                              normalizedProductName.includes(common)
                            )
                          }) || null
                        return (
                          <li
                            key={product.id}
                            className="border border-emerald-900 rounded-2xl p-3 bg-slate-950/80 flex gap-3"
                          >
                            {relatedSpecies?.imageUrl ? (
                              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0">
                                <img
                                  src={relatedSpecies.imageUrl}
                                  alt={
                                    relatedSpecies.commonName || product.name
                                  }
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-emerald-500 via-sky-500 to-emerald-400 flex items-center justify-center text-[10px] text-emerald-950 font-semibold text-center flex-shrink-0 px-2">
                                {product.name}
                              </div>
                            )}
                            <div className="flex-1 flex flex-col gap-1">
                              <div className="flex items-center justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium text-emerald-100">
                                    {product.name}
                                  </p>
                                  {relatedSpecies?.scientificName && (
                                    <p className="text-[11px] text-emerald-300/80 italic">
                                      {relatedSpecies.scientificName}
                                    </p>
                                  )}
                                  {product.projectName && (
                                    <p className="text-[11px] text-emerald-200/80">
                                      Projeto: {product.projectName}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-emerald-300">
                                    {formatCurrency(product.price)}
                                  </p>
                                  <p className="text-[11px] text-sky-300">
                                    {(product.carbonCashbackKg / 1000).toFixed(
                                      2
                                    )}{" "}
                                    t CO₂
                                  </p>
                                </div>
                              </div>
                              {product.description && (
                                <p className="text-[11px] text-emerald-200/80 mt-1">
                                  {product.description}
                                </p>
                              )}
                              <div className="mt-2 flex justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleDeleteProduct(product.id)}
                                  className="text-[11px] px-3 py-1 rounded-full border border-red-600 text-red-200 hover:bg-red-900/40"
                                >
                                  Excluir
                                </button>
                              </div>
                            </div>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </div>
            </section>
          )}

          {activeSection === "finance" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900">
              <h2 className="text-xl font-bold mb-2 text-emerald-100">
                Financeiro
              </h2>
              <p className="text-sm text-emerald-200/80">
                Área para acompanhar fluxo financeiro, vendas, doações e
                repasses para projetos.
              </p>
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-900">
                  <h3 className="text-emerald-200 text-xs font-semibold tracking-wide">
                    Pedidos realizados
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-emerald-300">
                    {finance ? finance.ordersCount : 0}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Total de pedidos registrados na plataforma.
                  </p>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-emerald-900">
                  <h3 className="text-emerald-200 text-xs font-semibold tracking-wide">
                    Receita total
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-emerald-300">
                    {finance ? formatCurrency(finance.totalRevenue) : "R$ 0,00"}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Soma de valores movimentados em pedidos.
                  </p>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-sky-900">
                  <h3 className="text-sky-200 text-xs font-semibold tracking-wide">
                    Cashback de carbono
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-sky-300">
                    {finance
                      ? `${(finance.totalCashbackKg / 1000).toFixed(2)} t CO₂`
                      : "0,00 t CO₂"}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    CO₂ estimado em cashback gerado pela loja.
                  </p>
                </div>
                <div className="bg-slate-900/90 p-4 rounded-2xl border border-purple-900">
                  <h3 className="text-purple-200 text-xs font-semibold tracking-wide">
                    Tokens emitidos
                  </h3>
                  <p className="mt-2 text-2xl font-bold text-purple-300">
                    {finance ? finance.totalTokens : 0}
                  </p>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Quantidade total associada à tabela de tokens.
                  </p>
                </div>
              </div>
            </section>
          )}

          {activeSection === "apis" && (
            <section className="bg-slate-900/80 p-6 rounded-2xl border border-emerald-900">
              <h2 className="text-xl font-bold mb-2 text-emerald-100">
                APIs e integrações
              </h2>
              <p className="text-sm text-emerald-200/80 mb-4">
                Espaço reservado para chaves de API, webhooks e integrações com
                ERPs e plataformas parceiras.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="border border-emerald-900 rounded-2xl p-4 bg-slate-950/80">
                  <h3 className="text-xs font-semibold text-emerald-100 tracking-wide uppercase">
                    Chaves de API
                  </h3>
                  <p className="mt-2 text-xs text-emerald-200/80">
                    Em breve você poderá gerar chaves de acesso para integrar o
                    SementeToken a outros sistemas.
                  </p>
                  <button
                    className="mt-3 text-[11px] px-3 py-1.5 rounded-full bg-emerald-400 text-emerald-950 font-semibold opacity-50"
                    disabled
                  >
                    Gerar nova chave (em breve)
                  </button>
                </div>
                <div className="border border-emerald-900 rounded-2xl p-4 bg-emerald-950/40">
                  <h3 className="text-xs font-semibold text-emerald-100 tracking-wide uppercase">
                    Webhooks
                  </h3>
                  <p className="mt-2 text-xs text-emerald-200/80">
                    Configure URLs para receber eventos como novos pedidos,
                    árvores plantadas e tokens emitidos.
                  </p>
                  <ul className="mt-2 text-[11px] text-emerald-200/80 space-y-1">
                    <li>• Pedido criado</li>
                    <li>• Cashback de carbono creditado</li>
                    <li>• Árvore vinculada a usuário</li>
                  </ul>
                  <button
                    className="mt-3 text-[11px] px-3 py-1.5 rounded-full bg-emerald-400 text-emerald-950 font-semibold opacity-50"
                    disabled
                  >
                    Configurar webhooks (em breve)
                  </button>
                </div>
                <div className="border border-slate-800 rounded-2xl p-4 bg-slate-950/80">
                  <h3 className="text-xs font-semibold text-emerald-100 tracking-wide uppercase">
                    Integrações externas
                  </h3>
                  <p className="mt-2 text-xs text-emerald-200/80">
                    Planejado para conexão com ERPs, CRMs e plataformas de
                    e-commerce para conciliação de vendas e relatórios ESG.
                  </p>
                  <p className="mt-2 text-[11px] text-emerald-200/70">
                    Exemplos: SAP, Totvs, RD Station, Shopify, WooCommerce.
                  </p>
                  <p className="mt-2 text-[11px] text-emerald-200/70">
                    Use este espaço para desenhar quais integrações fazem mais
                    sentido para seus clientes piloto.
                  </p>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  )
}
