import { describe, expect, it } from "vitest";
import { connectors, department, jobs, roles, skills } from "../src";

describe("@uos/department-product-tech", () => {
  it("captures the product-tech department boundary", () => {
    expect(department.departmentId).toBe("product-tech");
    expect(department.parentFunctionId).toBe("product-tech");
    expect(department.moduleId).toBeNull();
  });

  it("includes the product and technology roles", () => {
    expect(roles.some((role) => role.roleKey === "product-management-lead")).toBe(true);
    expect(roles.some((role) => role.roleKey === "technology-platform-lead")).toBe(true);
    expect(jobs.map((job) => job.jobKey)).toEqual([
      "product-tech-launch-readiness-review",
      "product-tech-reliability-review",
    ]);
  });

  it("keeps the product-tech skills and engineering connectors together", () => {
    expect(skills.bundleIds).toContain("uos-product-tech");
    expect(skills.externalSkills.some((skill) => skill.id === "uos-external-security-review")).toBe(true);
    expect(connectors.requiredToolkits).toContain("github");
    expect(connectors.requiredToolkits).toContain("googledocs");
    expect(connectors.roleToolkits.some((role) => role.roleKey === "technology-platform-lead")).toBe(true);
  });
});
