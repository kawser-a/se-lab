"use client";

import { useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { closeDocument, renderPageImages, renderResume } from "@/lib/resume/pdf/render";

const PREVIEW_WIDTH = 720;

const PdfPreview = ({ data, theme, title, onRendered }) => {
    const [images, setImages] = useState([]);
    const [status, setStatus] = useState({ state: "rendering" });
    const latest = useRef(0);

    useEffect(() => {
        const run = ++latest.current;
        setStatus((current) => ({ ...current, state: "rendering" }));

        // Wait for a pause in typing before re-rendering the whole document.
        const timer = setTimeout(async () => {
            try {
                const result = await renderResume({ data, theme, title });
                if (run !== latest.current) return closeDocument(result.doc);

                const pageImages = await renderPageImages(result.doc, PREVIEW_WIDTH);
                closeDocument(result.doc);
                if (run !== latest.current) return;

                setImages(pageImages);
                setStatus({ state: "done", pages: result.pages });
                onRendered?.({ blob: result.blob, pages: result.pages });
            } catch (error) {
                console.error("CV preview failed:", error);
                if (run === latest.current) setStatus({ state: "error" });
            }
        }, 600);

        return () => clearTimeout(timer);
        // onRendered is a setter from the parent and never changes.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data, theme, title]);

    return (
        <div className="flex w-full flex-col items-center gap-3">
            <div className="flex w-full max-w-[720px] flex-wrap items-center justify-between gap-2 text-sm">
                <PageStatus status={status} fitToOnePage={theme.fitToOnePage} />
                {status.state === "rendering" && (
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="size-3.5 animate-spin" /> Updating
                    </span>
                )}
            </div>

            {images.length === 0 && status.state !== "error" ? (
                <div className="flex aspect-[1/1.414] w-full max-w-[720px] items-center justify-center rounded-sm bg-white/5">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
            ) : (
                images.map((src, index) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        key={index}
                        src={src}
                        alt={`Page ${index + 1} of your CV`}
                        className="w-full max-w-[720px] bg-white shadow-[0_8px_30px_rgba(0,0,0,0.45)]"
                    />
                ))
            )}

            {status.state === "error" && (
                <p className="text-sm text-destructive">The preview couldn&apos;t be drawn. Try changing the last edit.</p>
            )}
        </div>
    );
};

function PageStatus({ status, fitToOnePage }) {
    if (status.state !== "done" && status.pages === undefined) return <span />;

    if (status.pages === 1) {
        return (
            <span className="flex items-center gap-1.5 rounded-full bg-[#9EFF00]/10 px-3 py-1 text-[#C9F300]">
                <Check className="size-3.5" strokeWidth={3} /> Fits on 1 page
            </span>
        );
    }

    if (fitToOnePage) {
        return (
            <span className="flex items-center gap-1.5 rounded-full bg-amber-400/10 px-3 py-1 text-amber-300">
                <AlertTriangle className="size-3.5" /> {status.pages} pages at the smallest size. Shorten or hide something to fit one.
            </span>
        );
    }

    return <span className="text-muted-foreground">{status.pages} pages</span>;
}

export default PdfPreview;
