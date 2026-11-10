// Measured straight from the answers rather than judged by the AI, so these
// numbers are the same every time for the same transcript.

const FILLERS = ["um", "umm", "uh", "uhm", "erm", "er", "ah", "hmm", "you know", "i mean", "basically", "literally"];

const FILLER_PATTERN = new RegExp(`\\b(${FILLERS.map((f) => f.replace(" ", "\\s+")).join("|")})\\b`, "gi");

// "like" is only a filler when it's padding, which a comma after it
// usually gives away ("it was, like, hard"). "I like Go" shouldn't count.
const LIKE_PATTERN = /\blike,/gi;

export function countWords(text) {
    return (text.match(/[\p{L}\p{N}'’-]+/gu) ?? []).length;
}

export function findFillers(text) {
    const found = [...(text.match(FILLER_PATTERN) ?? []), ...(text.match(LIKE_PATTERN) ?? []).map(() => "like")];
    return found.map((word) => word.toLowerCase().replace(/\s+/g, " "));
}

// Comfortable conversational pace is roughly 120 to 160 words a minute.
export function paceLabel(wordsPerMinute) {
    if (wordsPerMinute == null) return null;
    if (wordsPerMinute < 105) return "slow";
    if (wordsPerMinute > 175) return "fast";
    return "steady";
}

export function answerMetrics(turns) {
    const answered = turns.filter((turn) => !turn.skipped && turn.answer);
    const spoken = answered.filter((turn) => turn.inputMode === "voice" && turn.durationMs >= 3000);

    const totalWords = answered.reduce((sum, turn) => sum + countWords(turn.answer), 0);
    const spokenWords = spoken.reduce((sum, turn) => sum + countWords(turn.answer), 0);
    const spokenMs = spoken.reduce((sum, turn) => sum + turn.durationMs, 0);

    const fillers = answered.flatMap((turn) => findFillers(turn.answer));
    const fillerCounts = Object.entries(
        fillers.reduce((counts, word) => ({ ...counts, [word]: (counts[word] ?? 0) + 1 }), {})
    )
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([word, count]) => ({ word, count }));

    const wordsPerMinute = spokenMs > 0 ? Math.round(spokenWords / (spokenMs / 60000)) : null;

    return {
        answers: answered.length,
        skipped: turns.filter((turn) => turn.skipped).length,
        totalWords,
        averageWords: answered.length ? Math.round(totalWords / answered.length) : 0,
        wordsPerMinute,
        pace: paceLabel(wordsPerMinute),
        speakingSeconds: Math.round(spokenMs / 1000),
        fillerCount: fillers.length,
        fillersPer100Words: totalWords ? Math.round((fillers.length / totalWords) * 1000) / 10 : 0,
        topFillers: fillerCounts,
    };
}
