"use client";

import { Document, Link, Page, Text, View, pdf } from "@react-pdf/renderer";
import { FONT_FAMILIES, registerFonts } from "@/lib/resume/pdf/fonts";
import { INK, MUTED } from "@/lib/resume/pdf/utils";
import { paragraphsOf } from "./letter";

registerFonts();

const DEFAULT_THEME = { fontPair: "inter", accent: "#1F6FEB", pageSize: "A4" };

// A one-page business letter in the same fonts and accent colour as the CV
// it was written from, so the two look like a set when sent together.
export function CoverLetterDocument({ sender, recipient, date, content, theme = DEFAULT_THEME, title }) {
    const fonts = FONT_FAMILIES[theme.fontPair] ?? FONT_FAMILIES.inter;
    const accent = theme.accent ?? DEFAULT_THEME.accent;
    const contact = [sender.email, sender.phone, sender.location].filter(Boolean);

    return (
        <Document title={title} author={sender.name || undefined}>
            <Page size={theme.pageSize ?? "A4"} style={{ paddingVertical: 56, paddingHorizontal: 60, fontFamily: fonts.body, fontSize: 10.5, lineHeight: 1.5, color: INK }}>
                <View style={{ borderBottomWidth: 1.5, borderBottomColor: accent, paddingBottom: 12, marginBottom: 22 }}>
                    {sender.name ? <Text style={{ fontFamily: fonts.heading, fontSize: 20, fontWeight: 700, lineHeight: 1.2, color: INK }}>{sender.name}</Text> : null}
                    {contact.length ? (
                        <Text style={{ fontSize: 9.5, color: MUTED, marginTop: 4 }}>
                            {contact.map((item, index) => (
                                <Text key={item}>
                                    {index > 0 ? "  ·  " : ""}
                                    {item.includes("@") ? (
                                        <Link src={`mailto:${item}`} style={{ color: MUTED, textDecoration: "none" }}>
                                            {item}
                                        </Link>
                                    ) : (
                                        item
                                    )}
                                </Text>
                            ))}
                        </Text>
                    ) : null}
                </View>

                <Text style={{ color: MUTED, marginBottom: 14 }}>{date}</Text>
                <View style={{ marginBottom: 18 }}>
                    {recipient.map((line) => (
                        <Text key={line}>{line}</Text>
                    ))}
                </View>

                {paragraphsOf(content).map((paragraph, index) => (
                    <Text key={index} style={{ marginBottom: 10 }}>
                        {paragraph}
                    </Text>
                ))}
            </Page>
        </Document>
    );
}

export async function renderCoverLetter(props) {
    return pdf(<CoverLetterDocument {...props} />).toBlob();
}
