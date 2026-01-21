import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { PrismaClient } from "@repo/database";

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async onModuleInit() {
    await this.prisma.$connect();
  }

  async onModuleDestroy() {
    await this.prisma.$disconnect();
  }

  get user(): PrismaClient["user"] {
    return this.prisma.user;
  }

  get tenant(): PrismaClient["tenant"] {
    return this.prisma.tenant;
  }

  get course(): PrismaClient["course"] {
    return this.prisma.course;
  }
}
