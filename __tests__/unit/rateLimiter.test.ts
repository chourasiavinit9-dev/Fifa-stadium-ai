import { checkRateLimit } from "../../src/lib/rateLimiter";

describe("checkRateLimit", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("allows first request", () => {
    const result = checkRateLimit("1.1.1.1", "/api/test-" + Date.now(), 5);
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(4);
  });

  it("blocks after maxRequests exceeded", () => {
    const ip = "2.2.2.2-" + Date.now();
    const route = "/api/limit-test-" + Date.now();
    for (let i = 0; i < 3; i++) {
      checkRateLimit(ip, route, 3);
    }
    const result = checkRateLimit(ip, route, 3);
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });

  it("allows requests from different IPs independently", () => {
    const route = "/api/multi-" + Date.now();
    const r1 = checkRateLimit("ip-a-" + Date.now(), route, 5);
    const r2 = checkRateLimit("ip-b-" + Date.now(), route, 5);
    expect(r1.allowed).toBe(true);
    expect(r2.allowed).toBe(true);
  });

  it("returns resetAt timestamp in the future", () => {
    const result = checkRateLimit("3.3.3.3-" + Date.now(), "/api/reset-" + Date.now(), 10);
    expect(result.resetAt).toBeGreaterThan(Date.now());
  });
});
