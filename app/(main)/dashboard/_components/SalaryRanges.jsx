"use client";

import { useState } from "react";
import { formatMoney } from "@/data/countries";
import { experienceBand } from "@/lib/insights/market";
import { cn } from "@/lib/utils";

// Each role as a bar from lowest to highest pay on one shared scale, with
// the median marked, so roles can be compared at a glance. With years of
// experience on the profile, the part of each range that's typical for
// someone like them is highlighted.
const SalaryRanges = ({ ranges, currency, country, experience }) => {
    const [period, setPeriod] = useState(country.pay);
    const divisor = period === "month" ? 12 : 1;
    const money = (value) => formatMoney(value / divisor, currency);

    const low = Math.min(...ranges.map((range) => range.min));
    const high = Math.max(...ranges.map((range) => range.max));
    const position = (value) => `${((value - low) / (high - low || 1)) * 100}%`;
    const showBand = experience != null;

    return (
        <section aria-labelledby="salary-heading" className="space-y-5 rounded-3xl border border-white/10 bg-card p-5 sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1">
                    <h2 id="salary-heading" className="text-xl font-semibold">
                        Salaries in {country.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Estimated gross pay {period === "month" ? "per month" : "per year"} in {currency}, from lowest to highest, with the median marked.
                    </p>
                </div>
                <div role="radiogroup" aria-label="Show pay" className="flex rounded-full border border-white/10 bg-white/[0.03] p-1 text-sm">
                    {[
                        ["month", "Monthly"],
                        ["year", "Yearly"],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            role="radio"
                            aria-checked={period === value}
                            onClick={() => setPeriod(value)}
                            className={cn("rounded-full px-4 py-1.5 transition-colors", period === value ? "bg-[#9EFF00] text-black" : "text-muted-foreground hover:text-white")}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {showBand && (
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-5 rounded-full bg-white/20" /> Full range
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-2 w-5 rounded-full bg-[#9EFF00]" /> Typical with {experience} {experience === 1 ? "year" : "years"} of experience
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="h-3 w-0.5 bg-white" /> Median
                    </span>
                </div>
            )}

            <ul className="space-y-5">
                {ranges.map((range) => {
                    const band = experienceBand(experience, range);
                    return (
                        <li key={range.role} className="grid gap-2 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_minmax(0,11rem)] sm:items-center sm:gap-4">
                            <span className="text-sm font-medium">{range.role}</span>
                            <div className="relative h-3" aria-hidden="true">
                                <span className="absolute inset-y-0 rounded-full bg-white/15" style={{ left: position(range.min), right: `calc(100% - ${position(range.max)})` }} />
                                {band && (
                                    <span className="absolute inset-y-0 rounded-full bg-[#9EFF00]" style={{ left: position(band.low), right: `calc(100% - ${position(band.high)})` }} />
                                )}
                                <span className="absolute -inset-y-1 w-0.5 rounded-full bg-white" style={{ left: position(range.median) }} />
                            </div>
                            <span className="text-sm tabular-nums text-muted-foreground sm:text-right">
                                {money(range.min)} – {money(range.max)}
                                <span className="block text-xs">
                                    median <span className="text-white">{money(range.median)}</span>
                                </span>
                            </span>
                            <span className="sr-only">
                                {range.role}: from {money(range.min)} to {money(range.max)}, median {money(range.median)}
                                {band && `; typical for your experience ${money(band.low)} to ${money(band.high)}`}.
                            </span>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
};

export default SalaryRanges;
