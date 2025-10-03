import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com', port: 465, secure: true,
    auth: { user: process.env.MAIL_FROM, pass: process.env.MAIL_PASS }
});

export async function sendBoletaEmail({ subject, to, pdfBuffer, filename }) {
    return transporter.sendMail({
        from: process.env.MAIL_FROM,
        to,
        subject,
        text: 'Adjunto su boleta firmada.',
        attachments: [{ filename, content: pdfBuffer }]
    });
}
