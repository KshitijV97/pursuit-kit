import { serve } from "@hono/node-server";
import { createDocApp } from "./app.ts";

const port = Number(process.env.PORT ?? 8080);
const app = createDocApp({ secret: process.env.DOC_SERVICE_SECRET });

serve({ fetch: app.fetch, port }, (info) => {
  console.log(JSON.stringify({ level: "info", event: "listening", port: info.port }));
});
