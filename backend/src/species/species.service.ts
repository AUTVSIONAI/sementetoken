import { Injectable, Logger } from "@nestjs/common"
import { InjectRepository } from "@nestjs/typeorm"
import { IsNull, Repository } from "typeorm"
import axios from "axios"
import { Species } from "./species.entity"
import { WikipediaSpeciesService } from "./wikipedia-species.service"
import { OFFICIAL_SPECIES } from "./species.seed"

type ExternalSpecies = {
  id: string
  commonName?: string
  scientificName?: string
  biome?: string
  imageUrl?: string
  description?: string
  async seedOfficialSpecies(): Promise<{ created: number; skipped: number; errors: number }> {
    let created = 0
    let skipped = 0
    let errors = 0

    this.logger.log(`Starting official catalog seed with ${OFFICIAL_SPECIES.length} species...`)

    for (const speciesData of OFFICIAL_SPECIES) {
      try {
        const existing = await this.speciesRepository.findOne({
          where: [
            { scientificName: speciesData.scientificName },
            { commonName: speciesData.commonName }
          ]
        })

        if (existing) {
          skipped++
          continue
        }

        // Fetch from Wikipedia
        const wikiData = await this.wikipediaService.fetchSpeciesData(speciesData.scientificName)
        
        const newSpecies = this.speciesRepository.create({
          commonName: speciesData.commonName,
          scientificName: speciesData.scientificName,
          biome: speciesData.biome,
          description: wikiData?.description || `Espécie nativa do bioma ${speciesData.biome}`,
          imageUrl: wikiData?.imageUrl || null,
          carbonEstimation: speciesData.estimatedCo2,
          baseCost: 50, // Default values
          salePrice: 100
        })

        await this.speciesRepository.save(newSpecies)
        created++
        
        // Small delay to be nice to Wikipedia API
        await new Promise(resolve => setTimeout(resolve, 500))

      } catch (error) {
        this.logger.error(`Failed to seed species ${speciesData.commonName}: ${error.message}`)
        errors++
      }
    }

    this.logger.log(`Seed completed. Created: ${created}, Skipped: ${skipped}, Errors: ${errors}`)
    return { created, skipped, errors }
  }
}

@Injectable()
export class SpeciesService {
  private readonly logger = new Logger(SpeciesService.name);

  constructor(
    @InjectRepository(Species)
    private readonly speciesRepository: Repository<Species>,
    private readonly wikipediaService: WikipediaSpeciesService
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
    baseCost?: number
    salePrice?: number
    carbonEstimation?: number
    description?: string
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
      imageUrl: finalImage,
      baseCost: payload.baseCost ?? 50,
      salePrice: payload.salePrice ?? 100,
      carbonEstimation: payload.carbonEstimation ?? 0,
      description: payload.description || null
    })
    return this.speciesRepository.save(species)
  }

  async update(id: string, payload: {
    commonName?: string
    scientificName?: string
    biome?: string
    imageUrl?: string
    baseCost?: number
    salePrice?: number
    carbonEstimation?: number
    description?: string
  }): Promise<Species> {
    const species = await this.speciesRepository.findOne({ where: { id } })
    if (!species) {
      throw new Error("Espécie não encontrada")
    }
    
    if (payload.commonName !== undefined) species.commonName = payload.commonName
    if (payload.scientificName !== undefined) species.scientificName = payload.scientificName
    if (payload.biome !== undefined) species.biome = payload.biome
    if (payload.imageUrl !== undefined) species.imageUrl = payload.imageUrl
    if (payload.baseCost !== undefined) species.baseCost = payload.baseCost
    if (payload.salePrice !== undefined) species.salePrice = payload.salePrice
    if (payload.carbonEstimation !== undefined) species.carbonEstimation = payload.carbonEstimation
    if (payload.description !== undefined) species.description = payload.description

    return this.speciesRepository.save(species)
  }

  async remove(id: string): Promise<void> {
    await this.speciesRepository.delete(id)
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

  async seedOfficialSpecies(): Promise<{ created: number; skipped: number; errors: number }> {
    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const speciesData of OFFICIAL_SPECIES) {
      try {
        // Check if species already exists by scientific name or slug
        const existing = await this.speciesRepository.findOne({
          where: [
            { scientificName: speciesData.scientificName },
            { slug: speciesData.slug }
          ]
        });

        if (existing) {
          skipped++;
          continue;
        }

        // Fetch data from Wikipedia
        let wikiData = null;
        if (speciesData.scientificName) {
            wikiData = await this.wikipediaService.fetchSpeciesData(speciesData.scientificName);
        }
        
        // Fallback description
        const description = wikiData?.extract || "Espécie nativa do bioma brasileiro utilizada em projetos de reflorestamento e compensação de carbono.";
        const imageUrl = wikiData?.thumbnailUrl;

        const newSpecies = this.speciesRepository.create({
          commonName: speciesData.commonName,
          scientificName: speciesData.scientificName,
          biome: speciesData.biome,
          slug: speciesData.slug,
          baseCost: 100, // Default base price
          salePrice: 150, // Default sale price
          carbonEstimation: speciesData.estimatedCo2,
          description: description,
          imageUrl: imageUrl,
          isOfficial: true,
          status: "ACTIVE"
        });

        await this.speciesRepository.save(newSpecies);
        created++;
        this.logger.log(`Seeded official species: ${speciesData.commonName}`);

      } catch (error) {
        this.logger.error(`Error seeding species ${speciesData.commonName}: ${error.message}`);
        errors++;
      }
    }

    return { created, skipped, errors };
  }
}
