import { Injectable, Logger } from "@nestjs/common"
import axios from "axios"

export interface WikipediaSpeciesData {
  title: string
  description: string
  imageUrl: string | null
  scientificName: string
}

@Injectable()
export class WikipediaSpeciesService {
  private readonly logger = new Logger(WikipediaSpeciesService.name)

  async fetchSpeciesData(scientificName: string): Promise<WikipediaSpeciesData | null> {
    const tryFetch = async (lang: "pt" | "en") => {
      try {
        // Wikipedia API expects spaces to be replaced by underscores or encoded
        const formattedName = encodeURIComponent(scientificName.replace(/ /g, "_"))
        const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${formattedName}`

        this.logger.debug(`Fetching data for ${scientificName} from ${url}`)

        const response = await axios.get(url, { timeout: 5000 })
        const data = response.data

        if (data.type === "https://mediawiki.org/wiki/HyperSwitch/errors/not_found") {
          return null
        }

        return {
          title: data.title,
          scientificName: scientificName,
          description: data.extract,
          imageUrl: data.thumbnail?.source || null,
        }
      } catch (error) {
        this.logger.warn(`Error fetching data for ${scientificName} (${lang}): ${error.message}`)
        return null
      }
    }

    const ptData = await tryFetch("pt")
    if (ptData) return ptData

    const enData = await tryFetch("en")
    return enData
  }
}
