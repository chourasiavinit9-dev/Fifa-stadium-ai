import {
  sanitizeText,
  containsMaliciousPattern,
  AnomalyReportSchema,
  GeminiChatSchema,
  GeminiOpsSchema,
} from "../../src/lib/validators";

describe("sanitizeText", () => {
  it("removes HTML tags", () => {
    expect(sanitizeText("<b>hello</b>")).toBe("hello");
  });

  it("removes javascript: protocol", () => {
    expect(sanitizeText("javascript:alert(1)")).toBe("alert(1)");
  });

  it("removes event handlers", () => {
    expect(sanitizeText("onerror=bad")).toBe("bad");
  });

  it("trims and collapses spaces", () => {
    expect(sanitizeText("  hello   world  ")).toBe("hello world");
  });

  it("slices to 500 chars", () => {
    const long = "a".repeat(600);
    expect(sanitizeText(long)).toHaveLength(500);
  });
});

describe("containsMaliciousPattern", () => {
  it("detects <script", () => {
    expect(containsMaliciousPattern("<script>alert(1)</script>")).toBe(true);
  });

  it("detects javascript:", () => {
    expect(containsMaliciousPattern("javascript:void(0)")).toBe(true);
  });

  it("detects onerror=", () => {
    expect(containsMaliciousPattern("onerror=bad()")).toBe(true);
  });

  it("returns false for safe input", () => {
    expect(containsMaliciousPattern("Hello, how do I get to Gate C?")).toBe(false);
  });
});

describe("AnomalyReportSchema", () => {
  const valid = {
    incidentTitle: "Gate overflow",
    severity: "High Priority",
    location: "Gate C",
    description: "Many people",
  };

  it("accepts valid data", () => {
    expect(AnomalyReportSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects title shorter than 3 chars", () => {
    const result = AnomalyReportSchema.safeParse({ ...valid, incidentTitle: "ab" });
    expect(result.success).toBe(false);
  });

  it("rejects invalid severity", () => {
    const result = AnomalyReportSchema.safeParse({ ...valid, severity: "Unknown" });
    expect(result.success).toBe(false);
  });

  it("accepts all valid severities", () => {
    for (const s of ["Low", "Medium", "High Priority", "Safety Hazard"]) {
      expect(AnomalyReportSchema.safeParse({ ...valid, severity: s }).success).toBe(true);
    }
  });
});

describe("GeminiChatSchema", () => {
  it("accepts valid message", () => {
    const result = GeminiChatSchema.safeParse({ message: "What is the score?" });
    expect(result.success).toBe(true);
  });

  it("rejects empty message", () => {
    const result = GeminiChatSchema.safeParse({ message: "" });
    expect(result.success).toBe(false);
  });

  it("rejects message over 500 chars", () => {
    const result = GeminiChatSchema.safeParse({ message: "a".repeat(501) });
    expect(result.success).toBe(false);
  });

  it("provides default empty history", () => {
    const result = GeminiChatSchema.safeParse({ message: "Hi" });
    expect(result.success && result.data.history).toEqual([]);
  });
});

describe("GeminiOpsSchema", () => {
  const valid = {
    sectorName: "North Stand",
    density: 85.5,
    adjacentDensities: { "East Stand": 60, "West Stand": 45 },
    activeIncidents: 2,
    activeOperations: ["Gate surge"],
  };

  it("accepts valid ops data", () => {
    expect(GeminiOpsSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects density > 100", () => {
    const result = GeminiOpsSchema.safeParse({ ...valid, density: 110 });
    expect(result.success).toBe(false);
  });

  it("rejects negative density", () => {
    const result = GeminiOpsSchema.safeParse({ ...valid, density: -1 });
    expect(result.success).toBe(false);
  });
});
