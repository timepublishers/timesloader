import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, phone, company, subject, message } = await req.json()

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Save to database
    const { error: dbError } = await supabase
      .from('contact_inquiries')
      .insert([{
        name,
        email,
        phone: phone || null,
        company: company || null,
        subject,
        message,
        status: 'new'
      }])

    if (dbError) {
      console.error('Database error:', dbError)
      throw new Error('Failed to save inquiry')
    }

    // Email templates
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
    `

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
    `

    // Send emails using Resend (you'll need to add RESEND_API_KEY to your environment)
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      // Send admin notification
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Time Publishers <noreply@timepublishers.com>',
          to: ['websol@timepublishers.com'],
          subject: `New Contact Form: ${subject}`,
          html: adminEmailHtml,
        }),
      })

      // Send user acknowledgment
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Time Publishers <websol@timepublishers.com>',
          to: [email],
          subject: `Thank you for contacting Time Publishers - ${subject}`,
          html: userEmailHtml,
        }),
      })
    } else {
      console.log('RESEND_API_KEY not found, emails not sent')
      console.log('Admin Email HTML:', adminEmailHtml)
      console.log('User Email HTML:', userEmailHtml)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Contact form submitted successfully. We will get back to you within 24 hours.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Contact form error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to submit contact form. Please try again or call us directly at +92-21-34533913.' 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})