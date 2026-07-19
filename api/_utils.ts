// Shared body parser utility for Vercel standalone functions
import type { IncomingMessage } from "http";

export function readBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk: Buffer) => { body += chunk.toString(); });
    req.on("end", () => {
      try { resolve(JSON.parse(body || "{}")); }
      catch { resolve({}); }
    });
    req.on("error", () => resolve({}));
  });
}

export const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
};
