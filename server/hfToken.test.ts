import { describe, it, expect } from "vitest";

describe("Hugging Face API Token Validation", () => {
  it("should have HF_API_TOKEN set in environment", () => {
    const token = process.env.HF_API_TOKEN;
    expect(token).toBeDefined();
    expect(token!.length).toBeGreaterThan(0);
  });

  it("should be a valid HF token format (hf_*)", () => {
    const token = process.env.HF_API_TOKEN;
    expect(token).toBeDefined();
    // HF tokens typically start with "hf_"
    expect(token!.startsWith("hf_")).toBe(true);
  });

  it("should authenticate with Hugging Face API", async () => {
    const token = process.env.HF_API_TOKEN;
    const response = await fetch("https://huggingface.co/api/whoami-v2", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toHaveProperty("name");
  });
});
