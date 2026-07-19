import type { IncomingMessage, ServerResponse } from "http";
import { readBody, CORS } from "./_utils.js";

// In-memory store — resets per cold start (acceptable for demo)
interface IncidentRecord {
  id: string;
  timestamp: string;
  incidentTitle: string;
  severity: string;
  location: string;
  description: string;
}
const incidents: IncidentRecord[] = [];

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
  if (req.method === "OPTIONS") { res.statusCode = 204; res.end(); return; }

  // GET — list recent incidents
  if (req.method === "GET") {
    res.statusCode = 200;
    res.end(JSON.stringify({ count: incidents.length, incidents: incidents.slice(-10) }));
    return;
  }

  // POST — add incident
  if (req.method === "POST") {
    const body = await readBody(req);
    const incidentTitle = typeof body.incidentTitle === "string" ? body.incidentTitle.slice(0, 200) : "";
    const severity = typeof body.severity === "string" ? body.severity : "Low";
    const location = typeof body.location === "string" ? body.location.slice(0, 200) : "";
    const description = typeof body.description === "string" ? body.description.slice(0, 500) : "";

    if (!incidentTitle) {
      res.statusCode = 422;
      res.end(JSON.stringify({ error: "incidentTitle required" }));
      return;
    }

    const record: IncidentRecord = {
      id: Math.random().toString(36).slice(2),
      timestamp: new Date().toISOString(),
      incidentTitle,
      severity,
      location,
      description,
    };
    incidents.push(record);
    if (incidents.length > 100) incidents.shift();

    res.statusCode = 200;
    res.end(JSON.stringify({ success: true, id: record.id, timestamp: record.timestamp }));
    return;
  }

  res.statusCode = 405;
  res.end(JSON.stringify({ error: "Method not allowed" }));
}
