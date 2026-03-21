import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { PrismaService } from "../services/prisma.service";

@ApiTags("Health")
@Controller("health")
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: "Health check endpoint" })
  async check() {
    const dbStart = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
    } catch {
      return {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        checks: { database: { status: "down", latencyMs: Date.now() - dbStart } },
      };
    }

    return {
      status: "ok",
      timestamp: new Date().toISOString(),
      checks: { database: { status: "up", latencyMs: Date.now() - dbStart } },
    };
  }
}
