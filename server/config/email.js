import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export const sendEmail = async (to, subject, html, text = '') => {
  try {
    const mailOptions = {
      from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
      to,
      subject,
      html,
      text,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    throw error;
  }
};

export const sendContactEmail = async (contactData) => {
  const { name, email, phone, company, subject, message } = contactData;

  // Admin notification email
  const adminEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #2563eb, #dc2626); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Time Publishers Private Limited</h1>
        <p style="margin: 5px 0 0 0;">New Contact Form Submission</p>
      </div>
      <div style="padding: 20px; background: #f9fafb;">
        <h2 style="color: #1f2937;">Contact Details</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; font-weight: bold;">Name:</td><td style="padding: 8px;">${name}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Email:</td><td style="padding: 8px;">${email}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Phone:</td><td style="padding: 8px;">${phone || 'Not provided'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Company:</td><td style="padding: 8px;">${company || 'Not provided'}</td></tr>
          <tr><td style="padding: 8px; font-weight: bold;">Subject:</td><td style="padding: 8px;">${subject}</td></tr>
        </table>
        <h3 style="color: #1f2937;">Message:</h3>
        <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #2563eb;">
          ${message.replace(/\n/g, '<br>')}
        </div>
      </div>
    </div>
  `;

  // User acknowledgment email
  const userEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #2563eb, #dc2626); color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Time Publishers Private Limited</h1>
        <p style="margin: 5px 0 0 0;">Thank you for contacting us!</p>
      </div>
      <div style="padding: 20px;">
        <p>Dear ${name},</p>
        <p>Thank you for contacting Time Publishers Private Limited. We have received your inquiry regarding "<strong>${subject}</strong>" and will get back to you within 24 hours.</p>
        
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1f2937;">Your Message:</h3>
          <p style="margin-bottom: 0;">${message.replace(/\n/g, '<br>')}</p>
        </div>
        
        <p>If you have any urgent questions, please feel free to call us at <strong>+92-21-34533913</strong>.</p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0;"><strong>Best regards,</strong></p>
          <p style="margin: 5px 0;">Time Publishers Team</p>
          <p style="margin: 0; color: #6b7280;">
            Email: websol@timepublishers.com<br>
            Phone: +92-21-34533913<br>
            Website: www.timepublishers.com
          </p>
        </div>
      </div>
    </div>
  `;

  // Send both emails
  await Promise.all([
    sendEmail(process.env.ADMIN_EMAIL, `New Contact Form: ${subject}`, adminEmailHtml),
    sendEmail(email, `Thank you for contacting Time Publishers - ${subject}`, userEmailHtml)
  ]);
};

export default transporter;