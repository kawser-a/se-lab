import nodemailer from "nodemailer";

// Only called from the API route, which validates the address first. This
// isn't a server action on purpose: that would let anyone send mail to any
// address without going through the checks.
export const isNewsletterConfigured = () =>
    Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.EMAIL_TO);

export async function sendNewsletterEmail(subscriberEmail) {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    const adminMailOptions = {
        from: `"GrowthGrid" <${process.env.SMTP_USER}>`,
        to: process.env.EMAIL_TO,
        subject: "New Newsletter Subscriber",
        html: `<p><strong>${subscriberEmail}</strong> just subscribed to the newsletter.</p>`,
    };

    const subscriberMailOptions = {
        from: `"GrowthGrid" <${process.env.SMTP_USER}>`,
        to: subscriberEmail,
        subject: "🎉 Welcome to GrowthGrid – Let's Grow Together!",
        html: `
          <div style="font-family:Arial, sans-serif; background-color:#f4f4f4; padding:30px;">
            <div style="max-width:600px; margin:0 auto; background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
              <div style="background-color:#C9F300; padding:20px; text-align:center;">
                <h1 style="margin:0; font-size:24px; color:#121212;">🚀 Welcome to GrowthGrid</h1>
              </div>
              <div style="padding:30px; color:#333;">
                <p style="font-size:16px; line-height:1.6;">
                  Hi there,
                </p>
                <p style="font-size:16px; line-height:1.6;">
                  We're thrilled to have you on board! You've successfully subscribed to GrowthGrid — your go-to source for the latest trends, insights, and tools that help you grow smarter.
                </p>
                <p style="font-size:16px; line-height:1.6;">
                  Here's what you can expect:
                </p>
                <ul style="font-size:16px; line-height:1.8; padding-left:20px;">
                  <li>📈 Actionable growth strategies</li>
                  <li>🛠️ Tools & resources to boost productivity</li>
                  <li>📬 Curated updates delivered straight to your inbox</li>
                </ul>
                <p style="font-size:16px; line-height:1.6;">
                  Stay tuned — your first update is coming soon.
                </p>
                <p style="margin-top:30px; font-size:16px;">
                  Cheers,<br />
                  Kawser Ahmed, <br />
                  On Behalf of GrowthGrid Team
                </p>
              </div>
              <div style="background-color:#121212; color:#aaa; text-align:center; padding:20px; font-size:12px;">
                You are receiving this email because you signed up on our website.<br/>
                If this wasn’t you, simply ignore this email.
              </div>
            </div>
          </div>
        `
    };


    try {
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(subscriberMailOptions);
        return { success: true };
    } catch (err) {
        console.error("Newsletter email failed:", err);
        return { success: false };
    }
}
