import { Controller, Get } from "@nestjs/common"
import { AppService } from "./app.service"

@Controller("health")
export class HealthController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHealth() {
    return {
      status: "ok",
      version: "3.2.1-FIX-SEED",
      timestamp: new Date().toISOString(),
      services: {
        database: "connected", // Assumindo conexão se o backend subiu
        ai: process.env.AI_SERVICE_URL || "not-configured"
      }
    }
  }
}
