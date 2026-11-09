import { Font } from "@react-pdf/renderer";

// react-pdf can't use the fonts already loaded on the page, so the PDF gets
// its own copies (SIL Open Font License, see public/fonts/cv/README.md).
const FAMILIES = [
    ["Inter", "inter", [400, 600, 700], true],
    ["Source Serif", "source-serif-4", [400, 600, 700], true],
    ["Source Sans", "source-sans-3", [400, 600, 700], true],
    ["Space Grotesk", "space-grotesk", [400, 500, 700], false],
    ["DM Sans", "dm-sans", [400, 500, 700], true],
];

export const FONT_FAMILIES = {
    inter: { heading: "Inter", body: "Inter" },
    grotesk: { heading: "Space Grotesk", body: "DM Sans" },
    serif: { heading: "Source Serif", body: "Source Sans" },
};

let registeredFrom = null;

export function registerFonts(base = "/fonts/cv") {
    if (registeredFrom === base) return;
    registeredFrom = base;

    for (const [family, file, weights, hasItalic] of FAMILIES) {
        const styles = hasItalic ? ["normal", "italic"] : ["normal"];
        Font.register({
            family,
            fonts: weights.flatMap((fontWeight) =>
                styles.map((fontStyle) => ({
                    src: `${base}/${file}-${fontWeight}-${fontStyle}.woff`,
                    fontWeight,
                    fontStyle,
                }))
            ),
        });
    }

    // Hyphenated words in a CV look like typos, so never split them.
    Font.registerHyphenationCallback((word) => [word]);
}
