import { z } from "zod";

// Model output is checked for its shape, not nitpicked. Text that's too
// long is trimmed and lists are capped rather than throwing the whole
// answer away, since one long bullet shouldn't cost the user an interview.

export const clippedText = (max) =>
    z
        .string()
        .trim()
        .transform((text) => (text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text));

export const textList = (maxItems, maxLength) =>
    z
        .unknown()
        .optional()
        // A single string counts as a one-item list; anything else that isn't a list is empty.
        .transform((value) => (typeof value === "string" ? [value] : Array.isArray(value) ? value : []))
        .transform((items) =>
            (items ?? [])
                .filter((item) => typeof item === "string" && item.trim())
                .slice(0, maxItems)
                .map((item) => clippedText(maxLength).parse(item))
        );

// Explains a failed check in the server log, so a bad response can be
// traced to the field that broke it.
export function describeIssue(error) {
    const issue = error.issues?.[0];
    return issue ? `${issue.path.join(".") || "(root)"}: ${issue.message}` : "unknown";
}

// JSON Schema helpers for structured output. Strict mode wants every
// property required and no extra properties.
export const strictObject = (properties) => ({
    type: "object",
    properties,
    required: Object.keys(properties),
    additionalProperties: false,
});
export const stringList = { type: "array", items: { type: "string" } };
