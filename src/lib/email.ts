import nodemailer, { Transporter } from 'nodemailer';

// SMTPコネクションプールを作成
let smtpConfig: { [s: string]: string | { [s: string]: string } };
if (process.env.EMAIL_SMTP_USER !== null) {
  smtpConfig = {
    host: process.env.EMAIL_SMTP_HOST!,
    port: process.env.EMAIL_SMTP_PORT!,
    secure: process.env.EMAIL_SMTP_SSL!,
    auth: {
      user: process.env.EMAIL_SMTP_USER!,
      pass: process.env.EMAIL_TO!
    }
  };
} else {
  smtpConfig = {
    host: process.env.EMAIL_SMTP_HOST!,
    port: process.env.EMAIL_SMTP_PORT!,
    secure: process.env.EMAIL_SMTP_SSL!
  };
}
const transporter = nodemailer.createTransport(smtpConfig);

export const emailClient: Transporter = transporter;