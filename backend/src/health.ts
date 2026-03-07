import { registerRoute, json } from "./core/router";

registerRoute("GET", "/health", async () =>
  json({ status: "ok", service: "tanishq-multivendor-backend" }),
);

