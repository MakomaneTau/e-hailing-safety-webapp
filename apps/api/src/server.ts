import "dotenv/config";

import { app } from "./app";
import { env } from "./config/env";
import { database } from "./database/pool";

async function start(): Promise<void> {
  await database.query("SELECT 1");

  const server = app.listen(env.PORT, "0.0.0.0", () => {
    console.log(`API listening on port ${env.PORT}`);
  });

  async function shutdown(signal: string): Promise<void> {
    console.log(`${signal} received; shutting down`);

    server.close(async (error) => {
      await database.end();

      if (error) {
        console.error(error);
        process.exit(1);
      }

      process.exit(0);
    });
  }

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));
}

start().catch(async (error) => {
  console.error("API failed to start", error);
  await database.end();
  process.exit(1);
});