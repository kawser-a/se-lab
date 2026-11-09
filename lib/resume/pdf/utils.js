// Small helpers shared by the PDF templates.

const BASE_SIZE = { compact: 9.5, normal: 10, relaxed: 10.5 };
const LEADING = { compact: 1.3, normal: 1.4, relaxed: 1.5 };
const MARGINS = { narrow: 28, normal: 40, wide: 54 };

// Text never shrinks below this, even when fitting to one page.
export const MIN_FONT_SIZE = 9;

// Each step shrinks type, spacing and margins a little more.
export const FIT_STEPS = [1, 0.95, 0.9, 0.85, 0.8];

export function getMetrics(theme, fit = 1) {
    const size = Math.max(MIN_FONT_SIZE, BASE_SIZE[theme.density] * fit);
    const space = fit;

    return {
        size,
        small: Math.max(MIN_FONT_SIZE, size - 1),
        name: size * 2.2,
        headline: size * 1.15,
        heading: size * 1.05,
        leading: LEADING[theme.density] * (fit < 1 ? 0.96 : 1),
        margin: MARGINS[theme.margins] * space,
        sectionGap: 12 * space,
        itemGap: 7 * space,
    };
}

export const INK = "#111111";
export const MUTED = "#4B5563";

export function tint(hex, amount) {
    const value = parseInt(hex.slice(1), 16);
    const mix = (channel) => Math.round(channel + (255 - channel) * amount);
    const r = mix((value >> 16) & 255);
    const g = mix((value >> 8) & 255);
    const b = mix(value & 255);
    return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export function displayUrl(url) {
    return url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
}

export function toHref(url) {
    if (/^mailto:|^https?:\/\//.test(url)) return url;
    return `https://${url}`;
}

export function hasText(...values) {
    return values.some((value) => (Array.isArray(value) ? value.some((v) => v?.trim()) : value?.trim?.()));
}

export function cleanList(list) {
    return (list ?? []).map((value) => value.trim()).filter(Boolean);
}

// Highlights the CV owner's name inside an author list, as academic CVs do.
// Returns [{ text, bold }] chunks.
export function splitAuthors(authors, fullName) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (!authors || parts.length === 0) return [{ text: authors, bold: false }];

    const first = parts[0];
    const last = parts[parts.length - 1];
    const escape = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const variants = [fullName.trim(), `${first[0]}. ${last}`, `${last}, ${first[0]}.`, `${last} ${first[0]}`];
    const pattern = new RegExp(`(${variants.map(escape).join("|")})`, "i");

    // With a capturing group, split() puts the matches at the odd indexes.
    return authors
        .split(pattern)
        .map((text, index) => ({ text, bold: index % 2 === 1 }))
        .filter((chunk) => chunk.text);
}
