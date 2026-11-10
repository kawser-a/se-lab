import { INTERVIEWERS, INTERVIEW_TYPES } from "./config";

// What the interviewer says around the questions: the greeting, reactions
// and transitions, and the goodbye. Kept deterministic so it costs nothing
// and never fails. The AI only adds a reaction that refers to the answer,
// when it's already being asked about a follow-up.

const ACKNOWLEDGMENTS = ["Thanks for that.", "That makes sense.", "Got it, thank you.", "Right, I see.", "Thanks for walking me through it.", "Good, thank you."];
const TRANSITIONS = [
    "Let's switch gears a little.",
    "Next one.",
    "I'd like to ask you about something different now.",
    "Let's move on.",
    "Here's another one for you.",
];

// Said by the browser the moment an answer ends, while the reply is worked
// out, the way people say "okay" before they respond properly.
export const BACKCHANNELS = ["Okay.", "Mm-hmm.", "Right."];

// Said when working out the reply takes longer than usual.
export const HOLD_LINE = "Give me just a second.";

export const NOT_CAUGHT = "Sorry, I didn't quite catch that. Could you say it again?";

export function interviewerFor(plan) {
    return INTERVIEWERS[plan.interviewer] ?? INTERVIEWERS.hannah;
}

export function firstName(name) {
    return name?.trim().split(/\s+/)[0] ?? "";
}

export function openingLine({ interviewer, candidate, role, type, total }) {
    const hello = candidate ? `Hi ${candidate}, I'm ${interviewer}. Nice to meet you.` : `Hi, I'm ${interviewer}. Nice to meet you.`;
    const kind = type === "mixed" ? "an" : `a ${INTERVIEW_TYPES[type].label.toLowerCase()}`;
    return `${hello} Thanks for joining. So, this is ${kind} interview for the ${role} role. I've got ${total} questions, and I might dig into a few of your answers. There are no trick questions, just talk me through your thinking.`;
}

export function resumeLine({ candidate }) {
    return `Welcome back${candidate ? `, ${candidate}` : ""}. Let's pick up where we left off.`;
}

export function closingLine({ candidate }) {
    return `That's everything I wanted to ask. Thanks${candidate ? `, ${candidate}` : ""}, I really enjoyed talking with you. Give me a moment and I'll put your feedback together.`;
}

// The words said just before the next question, based on how the last turn
// went. `lead` is the full version; `bridge` is for when the browser has
// already said a quick "okay", so it leaves out the stock thanks and keeps
// only a reaction written for this answer.
export function leadIn(step, turns) {
    const last = turns.at(-1);
    if (!last) return { lead: step.number === 1 ? "Alright, let's start with this one." : "", bridge: "" };

    const n = turns.length;
    const reaction = last.skipped ? "No problem, let's leave that one." : last.ack || null;
    const stock = reaction ?? ACKNOWLEDGMENTS[n % ACKNOWLEDGMENTS.length];

    let transition = "";
    if (step.kind === "main") transition = step.number === step.total ? "Alright, last question." : TRANSITIONS[n % TRANSITIONS.length];

    const join = (...parts) => parts.filter(Boolean).join(" ");
    return { lead: join(stock, transition), bridge: join(reaction, transition) };
}
