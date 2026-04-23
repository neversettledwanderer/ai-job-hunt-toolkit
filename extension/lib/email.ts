// lib/email.ts
//
// Sends email via Gmail SMTP using nodemailer.
// Credentials come from 1Password at runtime.

import nodemailer from "npm:nodemailer@6";
import { readCredential } from "./credentials.ts";

export async function sendEmail(opts: {
  subject: string;
  html: string;
  to?: string;
}): Promise<void> {
  const email = await readCredential("gmail_email");
  const appPassword = await readCredential("gmail_password");

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: email, pass: appPassword },
  });

  await transporter.sendMail({
    from: email,
    to: opts.to ?? email,
    subject: opts.subject,
    html: opts.html,
  });
}
