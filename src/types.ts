/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Gate {
  id: string;
  status: "NORMAL" | "HEAVY_FLOW" | "CRITICAL_CONGESTION" | "STANDBY";
  flowRate: string;
  waitTime: string;
  accessibilityLevel: "HIGH" | "MEDIUM" | "MAX";
}

export interface TelemetryData {
  venue: string;
  capacity: number;
  currentOccupancy: number;
  queueTimeAverage: number;
  aiConfidence: number;
  energySourcedRenewable: number;
  waterRecycledGallons: number;
  wasteDiversionRate: number;
  trafficDelayMinutes: number;
  metroStatus: string;
  activeIncidentsCount: number;
  weatherTemp: number;
  weatherCondition: string;
  activeVolunteers: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: string;
}

export type TwinLayer = "normal" | "crowd" | "evacuation" | "energy" | "accessibility" | "transport";

export type OperationScenario = "nominal" | "gate-overflow" | "vip-ingress" | "emergency-evac" | "severe-weather";

export interface IncidentAlert {
  id: string;
  title: string;
  category: "CROWD" | "SECURITY" | "TRANSPORT" | "HVAC" | "ACCESSIBILITY";
  message: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  timestamp: string;
}
