import { describe, expect, it } from "vitest";

import { GET } from "@/app/api/health/route";

describe("health endpoint", () => {
  it("returns a non-cached healthy service response", async () => {
    const response = GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
    expect(payload).toMatchObject({
      status: "ok",
      service: "trustops",
      environment: "local-demo",
    });
    expect(Date.parse(payload.checkedAt)).not.toBeNaN();
  });
});
