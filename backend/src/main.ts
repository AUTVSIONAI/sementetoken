import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import { RequestMethod } from "@nestjs/common"
import { join } from "path"
import { AppModule } from "./app.module"
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger"

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
    logger: ["error", "warn", "log", "debug", "verbose"]
  })

  app.enableCors()

  app.setGlobalPrefix("api", {
    exclude: [
      { path: "metadata", method: RequestMethod.ALL },
      { path: "metadata/(.*)", method: RequestMethod.ALL },
      { path: "tree", method: RequestMethod.ALL },
      { path: "tree/(.*)", method: RequestMethod.ALL }
    ]
  })

  const config = new DocumentBuilder()
    .setTitle("SementeToken API")
    .setDescription("API for SementeToken Platform")
    .setVersion("1.1.0-FIX-BUILD")
    .build()
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup("api", app, document)

  await app.listen(process.env.PORT || 3000, '0.0.0.0')
}
bootstrap()
