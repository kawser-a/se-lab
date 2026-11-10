// Job markets people can pick in onboarding. Salaries for a market are
// estimated in its currency, and shown per month or per year depending on
// how pay is usually talked about there (monthly in much of South Asia and
// the Gulf, yearly in most of Europe and North America). "Remote" is for
// people hired across borders, where offers are usually made in US dollars.
export const countries = [
    { code: "BD", name: "Bangladesh", currency: "BDT", pay: "month" },
    { code: "IN", name: "India", currency: "INR", pay: "year" },
    { code: "PK", name: "Pakistan", currency: "PKR", pay: "month" },
    { code: "LK", name: "Sri Lanka", currency: "LKR", pay: "month" },
    { code: "NP", name: "Nepal", currency: "NPR", pay: "month" },
    { code: "MY", name: "Malaysia", currency: "MYR", pay: "month" },
    { code: "SG", name: "Singapore", currency: "SGD", pay: "month" },
    { code: "AE", name: "United Arab Emirates", currency: "AED", pay: "month" },
    { code: "SA", name: "Saudi Arabia", currency: "SAR", pay: "month" },
    { code: "QA", name: "Qatar", currency: "QAR", pay: "month" },
    { code: "GB", name: "United Kingdom", currency: "GBP", pay: "year" },
    { code: "IE", name: "Ireland", currency: "EUR", pay: "year" },
    { code: "DE", name: "Germany", currency: "EUR", pay: "year" },
    { code: "NL", name: "Netherlands", currency: "EUR", pay: "year" },
    { code: "FR", name: "France", currency: "EUR", pay: "year" },
    { code: "SE", name: "Sweden", currency: "SEK", pay: "year" },
    { code: "US", name: "United States", currency: "USD", pay: "year" },
    { code: "CA", name: "Canada", currency: "CAD", pay: "year" },
    { code: "AU", name: "Australia", currency: "AUD", pay: "year" },
    { code: "NZ", name: "New Zealand", currency: "NZD", pay: "year" },
    { code: "JP", name: "Japan", currency: "JPY", pay: "year" },
    { code: "NG", name: "Nigeria", currency: "NGN", pay: "year" },
    { code: "KE", name: "Kenya", currency: "KES", pay: "year" },
    { code: "ZA", name: "South Africa", currency: "ZAR", pay: "year" },
    { code: "BR", name: "Brazil", currency: "BRL", pay: "year" },
    { code: "REMOTE", name: "Remote (international)", currency: "USD", pay: "year" },
];

export const countryByCode = (code) => countries.find((country) => country.code === code) ?? null;

const SYMBOLS = {
    BDT: "৳", INR: "₹", PKR: "Rs ", LKR: "Rs ", NPR: "Rs ", MYR: "RM ", SGD: "S$", AED: "AED ", SAR: "SAR ", QAR: "QAR ",
    GBP: "£", EUR: "€", SEK: "SEK ", USD: "$", CAD: "C$", AUD: "A$", NZD: "NZ$", JPY: "¥", NGN: "₦", KES: "KSh ", ZAR: "R ", BRL: "R$",
};

// Salaries as people read them: compact, in the market's currency, e.g.
// "৳85K" or "$1.3M". Written by hand rather than with Intl, whose output
// differs between the server and browsers for some currencies.
export function formatMoney(amount, currency) {
    if (amount == null || Number.isNaN(amount)) return "–";
    const symbol = SYMBOLS[currency] ?? `${currency} `;
    const value = Math.abs(amount);
    const [divisor, suffix] = value >= 1e9 ? [1e9, "B"] : value >= 1e6 ? [1e6, "M"] : value >= 1e3 ? [1e3, "K"] : [1, ""];
    const scaled = value / divisor;
    const digits = scaled >= 100 || suffix === "" ? 0 : 1;
    const number = scaled.toFixed(digits).replace(/\.0$/, "");
    return `${amount < 0 ? "-" : ""}${symbol}${number}${suffix}`;
}
