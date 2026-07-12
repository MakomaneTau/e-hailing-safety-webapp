import serverless from "serverless-http";
import app from "../../apps/api/src/app.ts";

export const handler = serverless(app);