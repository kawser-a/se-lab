import { Link, Text, View } from "@react-pdf/renderer";
import { formatMonth, formatRange } from "../sections";
import { cleanList, displayUrl, hasText, splitAuthors, toHref } from "./utils";

// Building blocks shared by every template. `t` carries the metrics, fonts
// and colours the template picked.

export function Bullets({ t, items, color }) {
    const lines = cleanList(items);
    if (lines.length === 0) return null;

    return (
        <View style={{ marginTop: 2 }}>
            {lines.map((line, index) => (
                <View key={index} style={{ flexDirection: "row", marginTop: index ? 1.5 : 0 }}>
                    <Text style={{ width: t.m.size * 0.9, fontSize: t.m.size, color: color ?? t.ink }}>•</Text>
                    <Text style={{ flex: 1, fontSize: t.m.size, lineHeight: t.m.leading, color: color ?? t.ink }}>{line}</Text>
                </View>
            ))}
        </View>
    );
}

export function EntryHeader({ t, title, link, subtitle, date }) {
    return (
        <View>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                <Text style={{ flex: 1, fontSize: t.m.size * 1.05, fontWeight: 600, fontFamily: t.fonts.body, color: t.ink, paddingRight: 8 }}>
                    {title}
                    {link ? (
                        <Text style={{ fontWeight: 400, color: t.muted, fontSize: t.m.small }}>
                            {"  "}
                            <Link src={toHref(link)} style={{ color: t.muted, textDecoration: "none" }}>
                                {displayUrl(link)}
                            </Link>
                        </Text>
                    ) : null}
                </Text>
                {date ? <Text style={{ fontSize: t.m.small, color: t.muted }}>{date}</Text> : null}
            </View>
            {subtitle ? <Text style={{ fontSize: t.m.small, color: t.muted, marginTop: 1 }}>{subtitle}</Text> : null}
        </View>
    );
}

function Entry({ t, children }) {
    return (
        <View wrap={false} style={{ marginBottom: t.m.itemGap }}>
            {children}
        </View>
    );
}

function joinParts(...parts) {
    return parts.map((part) => part?.trim()).filter(Boolean).join(" · ");
}

function ExperienceItem({ t, item }) {
    if (!hasText(item.role, item.organisation, item.bullets)) return null;
    return (
        <Entry t={t}>
            <EntryHeader
                t={t}
                title={[item.role, item.organisation].filter(Boolean).join(", ")}
                subtitle={item.location}
                date={formatRange(item.start, item.end, item.current)}
            />
            <Bullets t={t} items={item.bullets} />
        </Entry>
    );
}

function EducationItem({ t, item }) {
    if (!hasText(item.degree, item.institution)) return null;
    const details = joinParts(item.result, item.thesis && `Thesis: ${item.thesis}`);
    return (
        <Entry t={t}>
            <EntryHeader
                t={t}
                title={[item.degree, item.institution].filter(Boolean).join(", ")}
                subtitle={joinParts(item.location, details)}
                date={formatRange(item.start, item.end)}
            />
            <Bullets t={t} items={item.highlights} />
        </Entry>
    );
}

function ProjectItem({ t, item }) {
    if (!hasText(item.name, item.bullets)) return null;
    const tech = cleanList(item.tech).join(" · ");
    return (
        <Entry t={t}>
            <EntryHeader
                t={t}
                title={item.name}
                link={item.link}
                subtitle={joinParts(item.role, tech)}
                date={formatRange(item.start, item.end)}
            />
            <Bullets t={t} items={item.bullets} />
        </Entry>
    );
}

function AwardItem({ t, item }) {
    if (!hasText(item.name)) return null;
    return (
        <Entry t={t}>
            <EntryHeader t={t} title={item.name} link={item.link} subtitle={joinParts(item.issuer, item.note)} date={formatMonth(item.date)} />
        </Entry>
    );
}

function CustomItem({ t, item }) {
    if (!hasText(item.title, item.bullets)) return null;
    return (
        <Entry t={t}>
            <EntryHeader t={t} title={item.title} subtitle={item.subtitle} date={formatRange(item.start, item.end)} />
            <Bullets t={t} items={item.bullets} />
        </Entry>
    );
}

function PortfolioItem({ t, item }) {
    if (!hasText(item.title, item.link)) return null;
    return (
        <Entry t={t}>
            <EntryHeader t={t} title={item.title || displayUrl(item.link)} link={item.title ? item.link : ""} subtitle={item.note} />
        </Entry>
    );
}

export function SkillList({ t, items, color }) {
    const rows = items.filter((item) => item.visible && hasText(item.group, item.keywords));
    if (rows.length === 0) return null;
    return (
        <View>
            {rows.map((item) => (
                <Text key={item.id} style={{ fontSize: t.m.size, lineHeight: t.m.leading, color: color ?? t.ink }}>
                    {item.group ? <Text style={{ fontWeight: 600 }}>{item.group}: </Text> : null}
                    {cleanList(item.keywords).join(", ")}
                </Text>
            ))}
        </View>
    );
}

export function LanguageList({ t, items, color }) {
    const rows = items.filter((item) => item.visible && hasText(item.language));
    if (rows.length === 0) return null;
    return (
        <Text style={{ fontSize: t.m.size, lineHeight: t.m.leading, color: color ?? t.ink }}>
            {rows.map((item) => (item.level ? `${item.language} (${item.level})` : item.language)).join(" · ")}
        </Text>
    );
}

const STATUS_LABEL = { accepted: " (accepted)", "under-review": " (under review)" };

function Authors({ t, authors }) {
    return splitAuthors(authors, t.basics.name).map((chunk, index) => (
        <Text key={index} style={chunk.bold ? { fontWeight: 700 } : undefined}>
            {chunk.text}
        </Text>
    ));
}

function Publications({ t, items }) {
    const rows = items.filter((item) => item.visible && hasText(item.title));
    if (rows.length === 0) return null;
    const ieee = t.theme.citationStyle === "ieee";

    return rows.map((item, index) => {
        const status = STATUS_LABEL[item.status] ?? "";
        const venue = item.venue ? <Text style={{ fontStyle: "italic" }}>{item.venue}</Text> : null;
        return (
            <View key={item.id} wrap={false} style={{ flexDirection: "row", marginBottom: t.m.itemGap * 0.6 }}>
                {ieee ? <Text style={{ width: t.m.size * 2.2, fontSize: t.m.size, color: t.muted }}>[{index + 1}]</Text> : null}
                <Text style={{ flex: 1, fontSize: t.m.size, lineHeight: t.m.leading, color: t.ink }}>
                    {ieee ? (
                        <>
                            <Authors t={t} authors={item.authors} />
                            {`, "${item.title}," `}
                            {item.kind === "journal" || !item.venue ? null : "in "}
                            {venue}
                            {item.year ? `, ${item.year}` : ""}
                            {`${status}.`}
                        </>
                    ) : (
                        <>
                            <Authors t={t} authors={item.authors} />
                            {item.year ? ` (${item.year}). ` : ". "}
                            {`${item.title}. `}
                            {venue}
                            {item.venue ? "." : ""}
                            {status}
                        </>
                    )}
                    {item.link ? (
                        <Link src={toHref(item.link)} style={{ color: t.muted, textDecoration: "none" }}>
                            {` ${displayUrl(item.link)}`}
                        </Link>
                    ) : null}
                </Text>
            </View>
        );
    });
}

const ITEM_RENDERERS = {
    experience: ExperienceItem,
    education: EducationItem,
    projects: ProjectItem,
    awards: AwardItem,
    certifications: AwardItem,
    portfolio: PortfolioItem,
    custom: CustomItem,
};

export function sectionHasContent(section) {
    if (!section.visible) return false;
    if (section.type === "summary") return hasText(section.content);
    return section.items.some((item) => item.visible);
}

export function SectionBody({ t, section }) {
    if (section.type === "summary") {
        return <Text style={{ fontSize: t.m.size, lineHeight: t.m.leading, color: t.ink }}>{section.content}</Text>;
    }
    if (section.type === "skills") return <SkillList t={t} items={section.items} />;
    if (section.type === "languages") return <LanguageList t={t} items={section.items} />;
    if (section.type === "publications") return <Publications t={t} items={section.items} />;

    const Item = ITEM_RENDERERS[section.type];
    return section.items.filter((item) => item.visible).map((item) => <Item key={item.id} t={t} item={item} />);
}

export function ContactLine({ t, basics, color, separator = " · ", style }) {
    const parts = [
        basics.email && { text: basics.email, href: `mailto:${basics.email}` },
        basics.phone && { text: basics.phone },
        basics.location && { text: basics.location },
        ...basics.links.filter((link) => link.url).map((link) => ({ text: displayUrl(link.url), href: toHref(link.url) })),
    ].filter(Boolean);

    if (parts.length === 0) return null;

    return (
        <Text style={{ fontSize: t.m.small, color: color ?? t.muted, lineHeight: 1.4, ...style }}>
            {parts.map((part, index) => (
                <Text key={index}>
                    {index ? separator : ""}
                    {part.href ? (
                        <Link src={part.href} style={{ color: color ?? t.muted, textDecoration: "none" }}>
                            {part.text}
                        </Link>
                    ) : (
                        part.text
                    )}
                </Text>
            ))}
        </Text>
    );
}
