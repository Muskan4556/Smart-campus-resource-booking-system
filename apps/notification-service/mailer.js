const nodemailer = require("nodemailer");

/* True only when SMTP_ENABLED=true is set in .env */
const SMTP_CONFIGURED = process.env.SMTP_ENABLED === "true";

const transporter = SMTP_CONFIGURED
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    })
  : null;

async function sendBookingConfirmation(booking) {
  const { userEmail, userName, resourceName, date, startTime, endTime } =
    booking;

  const subject = `Booking Confirmed — ${resourceName}`;

  const text = `
Hi ${userName || "there"},

Your campus resource booking has been confirmed.

  Resource  : ${resourceName}
  Date      : ${date}
  Time      : ${startTime} → ${endTime}

No action is needed. If you need to cancel, please log in to SmartCampus.

— SmartCampus Team
  `.trim();

  const html = `
<div style="font-family: 'DM Sans', sans-serif; max-width: 520px; margin: 0 auto; color: #0a0f1e;">
  <div style="background: #0f1f5c; padding: 24px 32px; border-radius: 4px 4px 0 0;">
    <h2 style="color: #fff; margin: 0; font-size: 20px;">SmartCampus</h2>
    <p style="color: #a5b4fc; margin: 4px 0 0; font-size: 13px;">Booking Confirmation</p>
  </div>
  <div style="background: #ffffff; border: 1px solid #cdd4e4; border-top: none; padding: 32px; border-radius: 0 0 4px 4px;">
    <p style="font-size: 15px; margin-bottom: 24px;">Hi <strong>${userName || "there"}</strong>,<br/>Your booking has been confirmed.</p>
    <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
      <tr style="border-bottom: 1px solid #e8ecf4;">
        <td style="padding: 10px 0; color: #5c6b8a; width: 40%;">Resource</td>
        <td style="padding: 10px 0; font-weight: 600;">${resourceName}</td>
      </tr>
      <tr style="border-bottom: 1px solid #e8ecf4;">
        <td style="padding: 10px 0; color: #5c6b8a;">Date</td>
        <td style="padding: 10px 0; font-weight: 600;">${date}</td>
      </tr>
      <tr>
        <td style="padding: 10px 0; color: #5c6b8a;">Time</td>
        <td style="padding: 10px 0; font-weight: 600;">${startTime} → ${endTime}</td>
      </tr>
    </table>
    <p style="margin-top: 28px; font-size: 13px; color: #5c6b8a;">Need to cancel? Log in to SmartCampus and manage your bookings.</p>
  </div>
</div>
  `.trim();

  if (SMTP_CONFIGURED && userEmail) {
    await transporter.sendMail({
      from: `"SmartCampus" <${process.env.SMTP_USER}>`,
      to: userEmail,
      subject,
      text,
      html,
    });
    console.log(`[Mailer] ✅ EMAIL SENT TO ${userEmail} — ${subject}`);
  } else {
    // Simulation mode — no SMTP credentials configured yet
    console.log("\n");
    console.log(`[Mailer] 📧 EMAIL SENT TO USER (Simulation Mode)`);
    console.log(`         To      : ${userEmail || "unknown"}`);
    console.log(`         Subject : ${subject}`);
    console.log(`         Resource: ${resourceName}`);
    console.log(`         Date    : ${date}  |  ${startTime} → ${endTime}`);
    console.log("\n");
  }
}

module.exports = { sendBookingConfirmation };
