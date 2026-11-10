import { INTERVIEWERS, INTERVIEW_TYPES } from "./config";

// What the interviewer says around the questions: the greeting, short
// acknowledgments and transitions, and the goodbye. Kept deterministic so
// it costs nothing and never fails; the AI only adds an acknowledgment
// that refers to the answer when it's already been asked about a follow-up.

const ACKNOWLEDGMENTS = ["Thanks.", "Okay, thank you.", "Got it, thanks.", "Thanks for walking me through that.", "Right, that makes sense.", "Okay."];
const TRANSITIONS = ["Next question.", "Let's move on.", "Okay, moving on.", "Let me ask you about something else."];

export const NOT_CAUGHT = "Sorry, I didn't quite catch that. Could you say it again?";

export function interviewerFor(plan) {
    return INTERVIEWERS[plan.interviewer] ?? INTERVIEWERS.hannah;
}

export function firstName(name) {
    return name?.trim().split(/\s+/)[0] ?? "";
}

export function openingLine({ interviewer, candidate, role, type, total }) {
    const hello = candidate ? `Hi ${candidate}, I'm ${interviewer}.` : `Hi, I'm ${interviewer}.`;
    const kind = type === "mixed" ? "an" : `a ${INTERVIEW_TYPES[type].label.toLowerCase()}`;
    return `${hello} Thanks for making time today. This is ${kind} interview for the ${role} role. I've got ${total} questions for you, and I might ask a follow-up here and there. Take your time with each answer.`;
}

export function resumeLine({ candidate }) {
    return `Welcome back${candidate ? `, ${candidate}` : ""}. Let's pick up where we left off.`;
}

export function closingLine({ candidate }) {
    return `That's everything I wanted to ask. Thanks${candidate ? `, ${candidate}` : ""}, I enjoyed talking with you. Give me a moment and I'll put your feedback together.`;
}

// The words said just before the next question, based on how the last turn went.
export function leadIn(step, turns) {
    const last = turns.at(-1);
    if (!last) return step.number === 1 ? "Let's start with this one." : "";

    const n = turns.length;
    const ack = last.skipped ? "No problem." : last.ack || ACKNOWLEDGMENTS[n % ACKNOWLEDGMENTS.length];

    if (step.kind === "follow-up") return ack;
    if (step.number === step.total) return `${ack} Last question.`;
    return `${ack} ${TRANSITIONS[n % TRANSITIONS.length]}`;
}
