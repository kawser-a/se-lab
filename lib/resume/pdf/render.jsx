"use client";

import { pdf } from "@react-pdf/renderer";
import * as pdfjs from "pdfjs-dist";
import { ResumeDocument } from "./document";
import { registerFonts } from "./fonts";
import { FIT_STEPS } from "./utils";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
registerFonts();

// Renders the CV to a PDF. With "fit to one page" on, it steps down the
// size until everything fits or it reaches the smallest step.
export async function renderResume({ data, theme, title }) {
    const steps = theme.fitToOnePage ? FIT_STEPS : [1];
    let result;

    for (const fit of steps) {
        const blob = await pdf(<ResumeDocument data={data} theme={theme} fit={fit} title={title} />).toBlob();
        const doc = await pdfjs.getDocument({ data: await blob.arrayBuffer() }).promise;

        if (result) closeDocument(result.doc);
        result = { blob, doc, fit, pages: doc.numPages };
        if (doc.numPages === 1) break;
    }

    return result;
}

// pdf.js 6 tears a document down through the task that loaded it.
export function closeDocument(doc) {
    return doc.loadingTask.destroy();
}

export async function renderPageImages(doc, width) {
    const images = [];
    for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
        const page = await doc.getPage(pageNumber);
        const scale = (width * (window.devicePixelRatio || 1)) / page.getViewport({ scale: 1 }).width;
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvas, canvasContext: canvas.getContext("2d"), viewport }).promise;
        images.push(canvas.toDataURL("image/png"));
    }
    return images;
}

export function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
