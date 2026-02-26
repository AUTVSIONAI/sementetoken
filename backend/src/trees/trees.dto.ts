export class CreateTreeDto {
  projectId: string
  species: string
  latitude: number
  longitude: number
  plantedAt?: string
  growthStage?: string
  estimatedCo2Total?: number
}

