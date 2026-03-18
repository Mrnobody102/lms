import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { TenantMiddleware } from "./common/middleware/tenant.middleware";
import { PrismaModule } from "./common/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { UserModule } from "./user/user.module";
import { AdminModule } from "./admin/admin.module";
import { McpModule } from "./mcp/mcp.module";
import { LessonModule } from "./lesson.module";
import { CourseModule } from "./course.module";
import { ProgressModule } from "./progress.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: "../../.env",
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    PrismaModule,
    AuthModule,
    UserModule,
    AdminModule,
    McpModule,
    LessonModule,
    CourseModule,
    ProgressModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        { path: "admin/tenants", method: RequestMethod.ALL },
        { path: "admin/tenants/(.*)", method: RequestMethod.ALL },
        { path: "auth/(.*)", method: RequestMethod.ALL },
      )
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
