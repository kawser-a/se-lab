import { z } from "zod";
import { isNewsletterConfigured, sendNewsletterEmail } from "@/lib/newsletter";

const bodySchema = z.object({ email: z.email().max(254) });

export async function POST(req) {
    const parsed = bodySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
        return Response.json({ success: false, error: "Please enter a valid email address." }, { status: 400 });
    }

    if (!isNewsletterConfigured()) {
        return Response.json({ success: false, error: "Sign-ups aren't open yet. Please try again later." }, { status: 503 });
    }

    const result = await sendNewsletterEmail(parsed.data.email);
    if (!result.success) {
        return Response.json({ success: false, error: "We couldn't sign you up right now. Please try again." }, { status: 502 });
    }

    return Response.json({ success: true });
}
