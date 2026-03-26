import { Controller, Get, Param, NotFoundException, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { Tree } from "./tree.entity"
import * as fs from "fs"
import * as path from "path"

type NftAttribute = {
  trait_type: string
  value: string
}

type NftMetadata = {
  name: string
  description: string
  image: string
  attributes: NftAttribute[]
}

@Controller("metadata")
export class MetadataController {
  private readonly logger = new Logger(MetadataController.name)

  constructor(
    @InjectRepository(Tree)
    private readonly treesRepository: Repository<Tree>
  ) {}

  @Get(":id")
  async getMetadata(@Param("id") rawId: string): Promise<NftMetadata> {
    const id = rawId.endsWith(".json") ? rawId.slice(0, -".json".length) : rawId

    const cached = await this.tryReadCachedMetadata(id)
    if (cached) {
      return cached
    }

    const tree = await this.treesRepository.findOne({
      where: [{ id }, { nftId: id }, { txHash: id }] as any,
      relations: { project: true, speciesType: true } as any
    })

    if (!tree) {
      throw new NotFoundException("Metadata não encontrada")
    }

    const metadata = this.buildMetadata(id, tree)
    await this.tryWriteCachedMetadata(id, metadata)
    return metadata
  }

  private buildMetadata(id: string, tree: Tree): NftMetadata {
    const { latitude, longitude } = this.extractLatLon(tree.location)

    const species =
      (tree as any).speciesType?.commonName ||
      (tree as any).speciesType?.scientificName ||
      tree.species ||
      ""

    const projectName = (tree as any).project?.name || ""

    const plantedAt =
      tree.plantedAt instanceof Date
        ? tree.plantedAt.toISOString()
        : tree.plantedAt
          ? new Date(tree.plantedAt as any).toISOString()
          : null

    const image = this.normalizePublicImageUrl(tree.imageUrl || tree.photoUrl || "")

    const attributes: NftAttribute[] = [
      { trait_type: "Latitude", value: latitude ?? "" },
      { trait_type: "Longitude", value: longitude ?? "" },
      { trait_type: "Tree ID", value: tree.id || id },
      { trait_type: "Project", value: projectName },
      { trait_type: "Date", value: plantedAt ? plantedAt.split("T")[0] : "" }
    ]

    if (species) {
      attributes.push({ trait_type: "Species", value: species })
    }

    return {
      name: `Tree #${id}`,
      description: "Árvore plantada via SementeToken",
      image,
      attributes
    }
  }

  private extractLatLon(location: any): { latitude: string | null; longitude: string | null } {
    if (!location) {
      return { latitude: null, longitude: null }
    }

    const coords = location?.coordinates
    if (Array.isArray(coords) && coords.length >= 2) {
      const [lon, lat] = coords
      return {
        latitude: typeof lat === "number" ? lat.toString() : lat ?? null,
        longitude: typeof lon === "number" ? lon.toString() : lon ?? null
      }
    }

    const lat = location?.lat ?? location?.latitude ?? null
    const lon = location?.lon ?? location?.lng ?? location?.longitude ?? null
    return {
      latitude: lat != null ? String(lat) : null,
      longitude: lon != null ? String(lon) : null
    }
  }

  private normalizePublicImageUrl(input: string): string {
    const url = (input || "").trim()
    if (!url) return ""

    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("ipfs://")) {
      return url
    }

    const publicBase = (process.env.PUBLIC_API_URL || "").replace(/\/+$/, "")
    const normalizedPath = url.startsWith("/") ? url : `/${url}`

    if (normalizedPath.startsWith("/uploads/")) {
      return publicBase ? `${publicBase}/api${normalizedPath}` : `/api${normalizedPath}`
    }

    if (normalizedPath.startsWith("/api/uploads/")) {
      return publicBase ? `${publicBase}${normalizedPath}` : normalizedPath
    }

    return publicBase ? `${publicBase}${normalizedPath}` : normalizedPath
  }

  private getCachePath(id: string): string {
    return path.join(process.cwd(), "uploads", "metadata", `${id}.json`)
  }

  private async tryReadCachedMetadata(id: string): Promise<NftMetadata | null> {
    try {
      const filePath = this.getCachePath(id)
      const content = await fs.promises.readFile(filePath, "utf-8")
      return JSON.parse(content) as NftMetadata
    } catch {
      return null
    }
  }

  private async tryWriteCachedMetadata(id: string, metadata: NftMetadata): Promise<void> {
    try {
      const filePath = this.getCachePath(id)
      await fs.promises.mkdir(path.dirname(filePath), { recursive: true })
      await fs.promises.writeFile(filePath, JSON.stringify(metadata, null, 2), "utf-8")
    } catch (err) {
      this.logger.warn(`Falha ao cachear metadata ${id}: ${(err as Error).message}`)
    }
  }
}

