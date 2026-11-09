import { Inngest } from "inngest";

// Inngest reads INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY from the environment
// in production. Locally the dev server needs neither.
export const inngest = new Inngest({ id: "GrowthGrid", name: "GrowthGrid" });
