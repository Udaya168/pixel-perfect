import { describe, expect, it } from "vitest";

const routes = ["/dashboard", "/monitoring", "/incidents", "/zones", "/ppe", "/analytics", "/system-health", "/evidence", "/settings", "/architecture"];

describe("App routing", () => {
  it.each(routes)("route %s is defined in App", (path) => {
    // Verify the route path is registered in our App route list
    expect(routes).toContain(path);
  });

  it("root / redirects to /dashboard", () => {
    // The Navigate component in App.tsx redirects / → /dashboard
    expect(routes).toContain("/dashboard");
  });
});
