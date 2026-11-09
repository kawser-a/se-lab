"use client";

import { Printer } from "lucide-react";

const PrintButton = ({ className }) => (
    <button type="button" onClick={() => window.print()} aria-label="Print this article" className={className}>
        <Printer className="size-5" />
    </button>
);

export default PrintButton;
