import { Injectable } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { IsNull, Repository } from "typeorm"
import axios from "axios"
import { Species } from "./species.entity"

type ExternalSpecies = {
  id: string
  commonName?: string
  scientificName?: string
  biome?: string
  imageUrl?: string
  description?: string
}

@Injectable()
export class SpeciesService {
  constructor(
    @InjectRepository(Species)
    private readonly speciesRepository: Repository<Species>
  ) {}

  findAll(): Promise<Species[]> {
    return this.speciesRepository.find()
  }

  private async getImageFromWikipedia(title?: string | null) {
    if (!title) return null
    const tryFetch = async (lang: "en" | "pt") => {
      try {
        const resp = await axios.get(
          `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
            title
          )}`,
          { timeout: 3000 }
        )
        const data = resp.data
        return data?.thumbnail?.source || null
      } catch {
        return null
      }
    }
    return (await tryFetch("en")) || (await tryFetch("pt"))
  }

  async create(payload: {
    commonName: string
    scientificName?: string
    biome?: string
    imageUrl?: string
  }): Promise<Species> {
    let finalImage = payload.imageUrl || null
    if (!finalImage) {
      finalImage =
        (await this.getImageFromWikipedia(payload.scientificName || null)) ||
        (await this.getImageFromWikipedia(payload.commonName || null)) ||
        null
    }
    const species = this.speciesRepository.create({
      commonName: payload.commonName,
      scientificName: payload.scientificName || null,
      biome: payload.biome || null,
      imageUrl: finalImage
    })
    return this.speciesRepository.save(species)
  }

  async fetchFromPublicApi(): Promise<ExternalSpecies[]> {
    const url = process.env.SPECIES_PUBLIC_API_URL
    if (!url) {
      return []
    }

    try {
      const response = await axios.get(url, {
        timeout: 15000
      })
      const data = response.data

      let list: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
        ? data.results
        : []

      if (!list.length && data && typeof data === "object") {
        list = Object.entries(data).map(([key, value]) => {
          const v: any = value
          return {
            id: key,
            common_name:
              typeof v === "string"
                ? null
                : v.common_name ?? v.commonName ?? v.name ?? null,
            scientific_name:
              typeof v === "string"
                ? v
                : v.scientific_name ??
                  v.scientificName ??
                  v.species ??
                  v.name ??
                  key,
            image_url:
              typeof v === "string"
                ? null
                : v.image_url ?? v.imageUrl ?? null,
            biome:
              typeof v === "string"
                ? null
                : v.biome ?? v.habitat ?? null,
            description:
              typeof v === "string"
                ? null
                : v.description ?? v.summary ?? v.notes ?? null
          }
        })
      }

      return list.map((item: any) => {
        const idSource =
          item.id ??
          item.uuid ??
          item.slug ??
          item.scientificName ??
          item.commonName ??
          item.common_name ??
          item.name

        return {
          id: String(idSource),
          commonName:
            item.commonName ??
            item.common_name ??
            item.name ??
            null,
          scientificName:
            item.scientificName ??
            item.scientific_name ??
            item.scientific ??
            null,
          biome: item.biome ?? item.habitat ?? null,
          imageUrl:
            item.imageUrl ??
            item.image_url ??
            item.image ??
            (Array.isArray(item.images) && item.images.length
              ? item.images[0]
              : null),
          description:
            item.description ??
            item.summary ??
            item.notes ??
            null
        }
      })
    } catch {
      return []
    }
  }

  async enrichMissingImages() {
    const missing = await this.speciesRepository.find({
      where: { imageUrl: IsNull() }
    })
    let updated = 0
    for (const s of missing) {
      try {
        const img =
          (await this.getImageFromWikipedia(s.scientificName || null)) ||
          (await this.getImageFromWikipedia(s.commonName || null)) ||
          null
        if (img) {
          s.imageUrl = img
          await this.speciesRepository.save(s)
          updated++
        }
      } catch {}
    }
    return { updated }
  }
}
