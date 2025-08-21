import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: true, // true for port 465
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    tls: {
        // Do not fail on invalid certificates
        rejectUnauthorized: false
    },
    // Add timeout settings
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000   // 10 seconds
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.log('❌ SMTP connection error:', error);
    } else {
        console.log('✅ SMTP server is ready to take our messages');
    }
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

export const sendVerificationEmail = async (email, fullName, pin) => {
  const subject = 'Verify Your Email - Time Publishers';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Time Publishers Private Limited</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Email Verification Required</p>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello ${fullName}!</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Thank you for registering with Time Publishers Private Limited. To complete your registration and verify your email address, please use the verification PIN below:
        </p>
        
        <div style="background: white; border: 2px solid #2563eb; border-radius: 10px; padding: 20px; text-align: center; margin: 30px 0;">
          <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">Your Verification PIN</p>
          <h1 style="color: #2563eb; font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 8px;">${pin}</h1>
          <p style="color: #ef4444; margin: 10px 0 0 0; font-size: 14px;">⏰ Expires in 10 minutes</p>
        </div>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; color: #92400e; font-size: 14px;">
            <strong>Important:</strong> This PIN will expire in 10 minutes for security reasons. If you don't verify within this time, you'll need to request a new PIN.
          </p>
        </div>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Enter this PIN on the verification page to activate your account and start using our services.
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            <strong>Need help?</strong><br>
            Email: websol@timepublishers.com<br>
            Phone: +92-21-34533913<br>
            Website: www.timepublishers.com
          </p>
        </div>
        
        <p style="color: #9ca3af; font-size: 12px; margin-top: 20px;">
          If you didn't create an account with Time Publishers, please ignore this email.
        </p>
      </div>
    </div>
  `;

  const text = `
    Time Publishers Private Limited - Email Verification
    
    Hello ${fullName}!
    
    Your verification PIN is: ${pin}
    
    This PIN expires in 10 minutes.
    
    Enter this PIN on the verification page to activate your account.
    
    Need help? Contact us at websol@timepublishers.com or +92-21-34533913
  `;

  await sendEmail(email, subject, html, text);
};

export const sendWelcomeEmail = async (email, fullName) => {
  const subject = 'Welcome to Time Publishers Private Limited!';
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Welcome to Time Publishers!</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Your account is now active</p>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello ${fullName}!</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Welcome to Time Publishers Private Limited! Your account has been successfully created and verified. You can now access all our services:
        </p>
        
        <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <h3 style="color: #1f2937; margin-top: 0;">🚀 What you can do now:</h3>
          <ul style="color: #4b5563; line-height: 1.8;">
            <li>Register and manage domain names</li>
            <li>Purchase web hosting packages</li>
            <li>Access your client dashboard</li>
            <li>Get 24/7 technical support</li>
            <li>Chat with our AI assistant</li>
            <li>Submit support tickets</li>
          </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.FRONTEND_URL}/dashboard" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
            Access Your Dashboard
          </a>
        </div>
        
        <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            <strong>💡 Pro Tip:</strong> Check out our hosting packages and domain pricing on our website. We offer competitive rates and excellent support!
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            <strong>Need assistance?</strong><br>
            Email: websol@timepublishers.com<br>
            Phone: +92-21-34533913<br>
            Website: www.timepublishers.com
          </p>
        </div>
        
        <p style="color: #4b5563; font-size: 16px; margin-top: 20px;">
          Thank you for choosing Time Publishers Private Limited for your digital needs!
        </p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          Best regards,<br>
          <strong>The Time Publishers Team</strong>
        </p>
      </div>
    </div>
  `;

  const text = `
    Welcome to Time Publishers Private Limited!
    
    Hello ${fullName}!
    
    Your account has been successfully created and verified. You can now access all our services:
    
    - Register and manage domain names
    - Purchase web hosting packages  
    - Access your client dashboard
    - Get 24/7 technical support
    - Chat with our AI assistant
    - Submit support tickets
    
    Visit your dashboard: ${process.env.FRONTEND_URL}/dashboard
    
    Need assistance? Contact us at websol@timepublishers.com or +92-21-34533913
    
    Thank you for choosing Time Publishers Private Limited!
    
    Best regards,
    The Time Publishers Team
  `;

  await sendEmail(email, subject, html, text);
};

export const sendInvoiceEmail = async (email, fullName, invoice, services) => {
  const subject = `Invoice ${invoice.invoice_number} - Time Publishers`;
  
  const servicesHtml = services.map(service => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${service.description}</td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">PKR ${service.amount.toLocaleString()}</td>
    </tr>
  `).join('');
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #2563eb, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="margin: 0; font-size: 28px;">Time Publishers Private Limited</h1>
        <p style="margin: 10px 0 0 0; font-size: 16px;">Invoice ${invoice.invoice_number}</p>
      </div>
      
      <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
        <h2 style="color: #1f2937; margin-top: 0;">Hello ${fullName}!</h2>
        
        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
          Please find your invoice details below:
        </p>
        
        <div style="background: white; border-radius: 10px; padding: 20px; margin: 20px 0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px; font-weight: bold;">Invoice Number:</td>
              <td style="padding: 8px;">${invoice.invoice_number}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Due Date:</td>
              <td style="padding: 8px;">${new Date(invoice.due_date).toLocaleDateString()}</td>
            </tr>
            <tr>
              <td style="padding: 8px; font-weight: bold;">Total Amount:</td>
              <td style="padding: 8px; font-weight: bold; color: #2563eb;">PKR ${invoice.total_amount.toLocaleString()}</td>
            </tr>
          </table>
        </div>
        
        <h3 style="color: #1f2937;">Services:</h3>
        <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 10px; overflow: hidden;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 12px; text-align: left;">Description</th>
              <th style="padding: 12px; text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${servicesHtml}
          </tbody>
        </table>
        
        <div style="background: #dbeafe; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 5px;">
          <p style="margin: 0; color: #1e40af; font-size: 14px;">
            <strong>💡 Payment Instructions:</strong> You can mark this invoice as paid in your dashboard by uploading payment proof.
          </p>
        </div>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p style="color: #6b7280; font-size: 14px; margin: 0;">
            <strong>Need help?</strong><br>
            Email: websol@timepublishers.com<br>
            Phone: +92-21-34533913<br>
            Website: www.timepublishers.com
          </p>
        </div>
        
        <p style="color: #4b5563; font-size: 16px; margin-top: 20px;">
          Thank you for choosing Time Publishers Private Limited!
        </p>
      </div>
    </div>
  `;

  const text = `
    Time Publishers Private Limited - Invoice ${invoice.invoice_number}
    
    Hello ${fullName}!
    
    Invoice Number: ${invoice.invoice_number}
    Due Date: ${new Date(invoice.due_date).toLocaleDateString()}
    Total Amount: PKR ${invoice.total_amount.toLocaleString()}
    
    Services:
    ${services.map(s => `- ${s.description}: PKR ${s.amount.toLocaleString()}`).join('\n')}
    
    You can mark this invoice as paid in your dashboard by uploading payment proof.
    
    Need help? Contact us at websol@timepublishers.com or +92-21-34533913
    
    Thank you for choosing Time Publishers Private Limited!
  `;

  await sendEmail(email, subject, html, text);
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