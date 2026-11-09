import path from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
import { ResumeDocument } from "@/lib/resume/pdf/document";
import { registerFonts } from "@/lib/resume/pdf/fonts";
import { resumeDataSchema } from "@/lib/resume/schema";
import { TEMPLATE_LIST, defaultTheme } from "@/lib/resume/templates";
import { sampleResume } from "./fixtures/sample-resume";

async function extract(buffer) {
    const pdf = await getDocument({ data: new Uint8Array(buffer), useSystemFonts: false }).promise;
    let text = "";
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const content = await page.getTextContent();
        text += content.items.map((item) => item.str).join(" ") + "\n";
    }
    return { text, pages: pdf.numPages };
}

beforeAll(() => {
    registerFonts(path.resolve(import.meta.dirname, "../public/fonts/cv"));
});

describe("resume data", () => {
    it("accepts the sample CV", () => {
        expect(resumeDataSchema.safeParse(sampleResume).success).toBe(true);
    });

    it("rejects a date that didn't come from the month picker", () => {
        const broken = structuredClone(sampleResume);
        broken.sections[2].items[0].start = "January";
        expect(resumeDataSchema.safeParse(broken).success).toBe(false);
    });
});

describe.each(TEMPLATE_LIST.map((template) => template.id))("%s template", (templateId) => {
    let result;

    beforeAll(async () => {
        const buffer = await renderToBuffer(<ResumeDocument data={sampleResume} theme={defaultTheme(templateId)} />);
        result = await extract(buffer);
    });

    it("produces selectable text", () => {
        expect(result.text).toContain("Your Name");
        expect(result.text).toContain("Software Engineer Intern");
    });

    it("leaves hidden entries out", () => {
        expect(result.text).not.toContain("Hidden entry");
    });

    it("keeps the sample CV to one page", () => {
        expect(result.pages).toBe(1);
    });
});
