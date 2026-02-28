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
  private readonly baseUrl = "https://pt.wikipedia.org/api/rest_v1/page/summary"

  async fetchSpeciesData(scientificName: string): Promise<WikipediaSpeciesData | null> {
    try {
      // Wikipedia API expects spaces to be replaced by underscores or encoded
      const formattedName = encodeURIComponent(scientificName.replace(/ /g, "_"))
      const url = `${this.baseUrl}/${formattedName}`

      this.logger.debug(`Fetching data for ${scientificName} from ${url}`)

      const response = await axios.get(url)
      const data = response.data

      if (data.type === "https://mediawiki.org/wiki/HyperSwitch/errors/not_found") {
        this.logger.warn(`Species ${scientificName} not found on Wikipedia`)
        return null
      }

      return {
        title: data.title,
        scientificName: scientificName,
        description: data.extract,
        imageUrl: data.thumbnail?.source || null,
      }
    } catch (error) {
      this.logger.error(`Error fetching data for ${scientificName}: ${error.message}`)
      return null
    }
  }
}
