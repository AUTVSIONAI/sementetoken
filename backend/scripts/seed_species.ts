import { NestFactory } from "@nestjs/core"
import { AppModule } from "../src/app.module"
import { SpeciesService } from "../src/species/species.service"
import { Logger } from "@nestjs/common"

async function bootstrap() {
  const logger = new Logger("SeedSpecies")
  try {
    const app = await NestFactory.createApplicationContext(AppModule)
    const speciesService = app.get(SpeciesService)

    logger.log("Starting official species seeding...")
    const result = await speciesService.seedOfficialSpecies()
    
    logger.log("Seeding complete!")
    logger.log(`Created: ${result.created}`)
    logger.log(`Skipped: ${result.skipped}`)
    logger.log(`Errors: ${result.errors}`)

    await app.close()
    process.exit(0)
  } catch (error) {
    logger.error("Seeding failed", error)
    process.exit(1)
  }
}

bootstrap()
