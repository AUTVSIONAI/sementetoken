import { Controller, Get, Param, NotFoundException, Req } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Tree } from "./tree.entity"

type PublicTreeResponse = {
  id: string
  imageUrl: string | null
  latitude: number | null
  longitude: number | null
  project: { id: string; name: string; city: string | null; state: string | null; country: string | null } | null
  species: string | null
  status: string | null
  nftId: string | null
  txHash: string | null
  metadataUrl: string
  tokenURI: string
  polygonUrl: string | null
}

@Controller("tree")
export class TreePublicController {
  constructor(
    @InjectRepository(Tree)
    private readonly treesRepository: Repository<Tree>
  ) {}

  @Get(":id")
  async getTree(@Param("id") id: string, @Req() req: any): Promise<PublicTreeResponse> {
    const tree = await this.treesRepository.findOne({
      where: { id },
      relations: { project: true, speciesType: true } as any
    })

    if (!tree) {
      throw new NotFoundException("Árvore não encontrada")
    }

    const publicBase = this.getPublicBase(req)
    const metadataUrl = `${publicBase}/metadata/${encodeURIComponent(tree.id)}.json`
    const tokenURI = metadataUrl

    const { latitude, longitude } = await this.getLatLon(tree.id)
    const species =
      (tree as any).speciesType?.commonName ||
      (tree as any).speciesType?.scientificName ||
      tree.species ||
      null

    const imageUrl = this.normalizePublicImageUrl(
      tree.imageUrl || tree.photoUrl || null,
      publicBase
    )

    const polygonscanBase = (process.env.POLYGONSCAN_BASE_URL || "https://polygonscan.com").replace(
      /\/+$/,
      ""
    )
    const polygonUrl = this.buildPolygonUrl(polygonscanBase, tree)

    const project = (tree as any).project
      ? {
          id: (tree as any).project.id,
          name: (tree as any).project.name,
          city: (tree as any).project.city ?? null,
          state: (tree as any).project.state ?? null,
          country: (tree as any).project.country ?? null
        }
      : null

    return {
      id: tree.id,
      imageUrl,
      latitude,
      longitude,
      project,
      species,
      status: tree.status ?? null,
      nftId: tree.nftId ?? null,
      txHash: tree.txHash ?? null,
      metadataUrl,
      tokenURI,
      polygonUrl
    }
  }

  private getPublicBase(req: any): string {
    const explicit = (process.env.PUBLIC_API_URL || "").replace(/\/+$/, "")
    if (explicit) return explicit

    const proto =
      (req?.headers?.["x-forwarded-proto"] as string | undefined) ||
      req?.protocol ||
      "https"
    const host = req?.get?.("host") || req?.headers?.host
    return host ? `${proto}://${host}` : ""
  }

  private async getLatLon(treeId: string): Promise<{ latitude: number | null; longitude: number | null }> {
    const rows = await this.treesRepository.query(
      "SELECT ST_Y(location::geometry) as latitude, ST_X(location::geometry) as longitude FROM trees WHERE id = $1",
      [treeId]
    )

    const row = rows && rows.length ? (rows[0] as any) : null
    const latitude = row?.latitude != null ? Number(row.latitude) : null
    const longitude = row?.longitude != null ? Number(row.longitude) : null

    if (Number.isNaN(latitude as any) || Number.isNaN(longitude as any)) {
      return { latitude: null, longitude: null }
    }

    return { latitude, longitude }
  }

  private normalizePublicImageUrl(input: string | null, publicBase: string): string | null {
    const url = (input || "").trim()
    if (!url) return null

    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("ipfs://")) {
      return url
    }

    const normalizedPath = url.startsWith("/") ? url : `/${url}`

    if (normalizedPath.startsWith("/uploads/")) {
      return publicBase ? `${publicBase}/api${normalizedPath}` : `/api${normalizedPath}`
    }

    if (normalizedPath.startsWith("/api/uploads/")) {
      return publicBase ? `${publicBase}${normalizedPath}` : normalizedPath
    }

    return publicBase ? `${publicBase}${normalizedPath}` : normalizedPath
  }

  private buildPolygonUrl(polygonscanBase: string, tree: Tree): string | null {
    const txHash = (tree.txHash || tree.nftId || "").trim()
    if (txHash && txHash.startsWith("0x")) {
      return `${polygonscanBase}/tx/${txHash}`
    }

    const contract = (process.env.NFT_CONTRACT_ADDRESS || "").trim()
    const tokenId = (tree.nftId || "").trim()
    if (contract && tokenId && /^[0-9]+$/.test(tokenId)) {
      return `${polygonscanBase}/token/${contract}?a=${tokenId}`
    }

    return null
  }
}

