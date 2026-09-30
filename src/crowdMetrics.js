/**
 * Real-time stadium crowd density metrics & threshold monitoring
 */
export function calculateCrowdDensity(occupancy, capacity) {
  if (!capacity || capacity <= 0) return 0;
  return Math.min(1.0, Number((occupancy / capacity).toFixed(4)));
}
