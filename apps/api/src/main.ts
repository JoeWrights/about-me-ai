import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import {
  configureDnsForOutboundRequests,
  loadWorkspaceEnv,
  parseWebOrigins,
} from "./config/env.js";

loadWorkspaceEnv();
configureDnsForOutboundRequests();

const port = Number(process.env.API_PORT ?? process.env.PORT ?? 4000);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: parseWebOrigins(process.env.WEB_ORIGIN),
  });
  await app.listen(port);
}

bootstrap();
