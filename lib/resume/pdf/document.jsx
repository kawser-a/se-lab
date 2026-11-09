import { Document, Page, Text, View } from "@react-pdf/renderer";
import { isSectionShown } from "../templates";
import { ContactLine, LanguageList, SectionBody, SkillList, sectionHasContent } from "./blocks";
import { FONT_FAMILIES } from "./fonts";
import { INK, MUTED, getMetrics, tint } from "./utils";

function buildContext(data, theme, fit) {
    return {
        m: getMetrics(theme, fit),
        fonts: FONT_FAMILIES[theme.fontPair],
        accent: theme.accent,
        ink: INK,
        muted: MUTED,
        theme,
        basics: data.basics,
    };
}

function visibleSections(data, templateId) {
    return data.sections.filter((section) => isSectionShown(templateId, section.type) && sectionHasContent(section));
}

function Section({ t, section, heading }) {
    return (
        <View style={{ marginBottom: t.m.sectionGap }}>
            {/* minPresenceAhead keeps a heading from ending up alone at the bottom of a page */}
            <View minPresenceAhead={t.m.size * 4}>{heading}</View>
            <SectionBody t={t} section={section} />
        </View>
    );
}

function PageNumber({ t, name }) {
    return (
        <Text
            fixed
            style={{ position: "absolute", bottom: t.m.margin / 2, right: t.m.margin, fontSize: t.m.small - 1, color: t.muted }}
            render={({ pageNumber, totalPages }) => (totalPages > 1 ? `${name ? `${name} · ` : ""}${pageNumber} of ${totalPages}` : "")}
        />
    );
}

// Name, headline, location and contact details for the one-column templates.
// Centred by default; the Style tab can switch it to the left.
function Header({ t, basics, nameScale = 1, headlineColor }) {
    const centered = t.theme.headerAlign !== "left";
    const align = centered ? "center" : "flex-start";
    const textAlign = centered ? "center" : "left";

    return (
        <View style={{ alignItems: align, marginBottom: t.m.sectionGap * 1.1 }}>
            <Text style={{ fontFamily: t.fonts.heading, fontSize: t.m.name * nameScale, fontWeight: 700, color: t.ink, textAlign }}>
                {basics.name}
            </Text>
            {basics.headline ? (
                <Text style={{ fontSize: t.m.headline, color: headlineColor ?? t.ink, marginTop: 3, textAlign }}>{basics.headline}</Text>
            ) : null}
            {basics.location ? <Text style={{ fontSize: t.m.small, color: t.muted, marginTop: 3, textAlign }}>{basics.location}</Text> : null}
            <ContactLine t={t} basics={basics} align={align} style={{ marginTop: 3 }} />
        </View>
    );
}

function DeveloperTemplate({ t, data }) {
    const { basics } = data;
    return (
        <>
            <Header t={t} basics={basics} />
            {visibleSections(data, "developer").map((section) => (
                <Section
                    key={section.id}
                    t={t}
                    section={section}
                    heading={
                        <Text
                            style={{
                                fontFamily: t.fonts.heading,
                                fontSize: t.m.heading,
                                fontWeight: 700,
                                letterSpacing: 0.8,
                                color: t.accent,
                                borderBottomWidth: 1.2,
                                borderBottomColor: t.accent,
                                paddingBottom: 2,
                                marginBottom: 5,
                            }}
                        >
                            {section.title.toUpperCase()}
                        </Text>
                    }
                />
            ))}
        </>
    );
}

function AcademicTemplate({ t, data }) {
    const { basics } = data;
    return (
        <>
            <Header t={t} basics={basics} nameScale={0.95} />
            {visibleSections(data, "academic").map((section) => (
                <Section
                    key={section.id}
                    t={t}
                    section={section}
                    heading={
                        <View style={{ borderBottomWidth: 0.8, borderBottomColor: t.ink, paddingBottom: 2, marginBottom: 6 }}>
                            <Text style={{ fontFamily: t.fonts.heading, fontSize: t.m.heading * 1.1, fontWeight: 600, color: t.accent }}>
                                {section.title}
                            </Text>
                        </View>
                    }
                />
            ))}
            <PageNumber t={t} name={basics.name} />
        </>
    );
}

function GraduateTemplate({ t, data }) {
    const { basics } = data;
    const band = tint(t.accent, 0.88);
    return (
        <>
            <Header t={t} basics={basics} headlineColor={t.muted} />
            {visibleSections(data, "graduate").map((section) => (
                <Section
                    key={section.id}
                    t={t}
                    section={section}
                    heading={
                        <Text
                            style={{
                                fontFamily: t.fonts.heading,
                                fontSize: t.m.heading,
                                fontWeight: 700,
                                color: t.accent,
                                backgroundColor: band,
                                paddingVertical: 3,
                                paddingHorizontal: 6,
                                marginBottom: 5,
                            }}
                        >
                            {section.title}
                        </Text>
                    }
                />
            ))}
        </>
    );
}

// Sections that sit in the coloured sidebar of the creative template.
const SIDEBAR_TYPES = ["skills", "languages"];

function CreativeTemplate({ t, data }) {
    const { basics } = data;
    const sections = visibleSections(data, "creative");
    const side = sections.filter((section) => SIDEBAR_TYPES.includes(section.type));
    const main = sections.filter((section) => !SIDEBAR_TYPES.includes(section.type));
    const sideInk = "#FFFFFF";
    const sideMuted = tint(t.accent, 0.75);
    const sideWidth = "32%";

    const sideHeading = (title) => (
        <Text style={{ fontFamily: t.fonts.heading, fontSize: t.m.small, fontWeight: 700, letterSpacing: 1, color: sideMuted, marginBottom: 4 }}>
            {title.toUpperCase()}
        </Text>
    );

    return (
        <>
            <View fixed style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: sideWidth, backgroundColor: t.accent }} />
            <View style={{ flexDirection: "row", flexGrow: 1 }}>
                <View style={{ width: sideWidth, paddingTop: t.m.margin, paddingHorizontal: t.m.margin * 0.55, paddingBottom: t.m.margin }}>
                    <View style={{ marginBottom: t.m.sectionGap }}>
                        {sideHeading("Contact")}
                        <ContactLine t={t} basics={basics} color={sideInk} stacked />
                    </View>
                    {side.map((section) => (
                        <View key={section.id} style={{ marginBottom: t.m.sectionGap }}>
                            {sideHeading(section.title)}
                            {section.type === "skills" ? (
                                <SkillList t={t} items={section.items} color={sideInk} />
                            ) : (
                                <LanguageList t={t} items={section.items} color={sideInk} />
                            )}
                        </View>
                    ))}
                </View>
                <View style={{ flex: 1, paddingTop: t.m.margin, paddingHorizontal: t.m.margin * 0.7, paddingBottom: t.m.margin }}>
                    <View style={{ marginBottom: t.m.sectionGap }}>
                        <Text style={{ fontFamily: t.fonts.heading, fontSize: t.m.name * 1.05, fontWeight: 700, color: t.ink }}>{basics.name}</Text>
                        {basics.headline ? (
                            <Text style={{ fontSize: t.m.headline, fontWeight: 700, color: t.accent, marginTop: 2 }}>{basics.headline}</Text>
                        ) : null}
                    </View>
                    {main.map((section) => (
                        <Section
                            key={section.id}
                            t={t}
                            section={section}
                            heading={
                                <Text
                                    style={{
                                        fontFamily: t.fonts.heading,
                                        fontSize: t.m.small,
                                        fontWeight: 700,
                                        letterSpacing: 1,
                                        color: t.accent,
                                        marginBottom: 4,
                                    }}
                                >
                                    {section.title.toUpperCase()}
                                </Text>
                            }
                        />
                    ))}
                </View>
            </View>
        </>
    );
}

const TEMPLATE_COMPONENTS = {
    developer: DeveloperTemplate,
    academic: AcademicTemplate,
    graduate: GraduateTemplate,
    creative: CreativeTemplate,
};

export function ResumeDocument({ data, theme, fit = 1, title }) {
    const t = buildContext(data, theme, fit);
    const Template = TEMPLATE_COMPONENTS[theme.templateId] ?? DeveloperTemplate;
    const padded = theme.templateId !== "creative";

    return (
        <Document title={title || data.basics.name || "CV"} author={data.basics.name} creator="GrowthGrid" producer="GrowthGrid">
            <Page
                size={theme.pageSize}
                style={{
                    fontFamily: t.fonts.body,
                    fontSize: t.m.size,
                    color: t.ink,
                    padding: padded ? t.m.margin : 0,
                    paddingBottom: padded ? t.m.margin : 0,
                }}
            >
                <Template t={t} data={data} />
            </Page>
        </Document>
    );
}
