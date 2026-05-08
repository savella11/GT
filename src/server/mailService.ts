import nodemailer from "nodemailer";

/**
 * Servicio de envío de correos electrónicos
 * Configura estas variables en tu archivo .env
 */
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.mailtrap.io",
  port: parseInt(process.env.SMTP_PORT || "2525"),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to: string, subject: string, html: string) => {
  try {
    const info = await transporter.sendMail({
      from: '"Construcciones Elite" <no-reply@construccioneselite.com>',
      to,
      subject,
      html,
    });
    console.log("📧 Correo enviado:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error al enviar correo:", error);
    throw error;
  }
};