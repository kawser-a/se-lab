import { describe, expect, it } from "vitest";
import { suggestSkills } from "@/lib/resume/skill-suggestions";

describe("suggestSkills", () => {
    it("puts prefix matches first", () => {
        expect(suggestSkills("py")[0]).toBe("Python");
    });

    it("leaves out skills already added, ignoring case", () => {
        expect(suggestSkills("react", { exclude: ["react"] })).not.toContain("React");
    });

    it("offers skills that fit the group name when nothing is typed", () => {
        expect(suggestSkills("", { context: "Video & audio" })).toContain("Adobe Premiere Pro");
        expect(suggestSkills("", { context: "Databases" })[0]).toBe("PostgreSQL");
    });
});
