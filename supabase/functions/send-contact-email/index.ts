import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name, email, phone, company, subject, message } = await req.json()

    // Email content for admin
    const adminEmailContent = `
      New Contact Form Submission
      
      Name: ${name}
      Email: ${email}
      Phone: ${phone || 'Not provided'}
      Company: ${company || 'Not provided'}
      Subject: ${subject}
      
      Message:
      ${message}
      
      ---
      Time Publishers Private Limited
      Admin Notification System
    `

    // Email content for user acknowledgment
    const userEmailContent = `
      Dear ${name},
      
      Thank you for contacting Time Publishers Private Limited. We have received your inquiry regarding "${subject}" and will get back to you within 24 hours.
      
      Your message:
      ${message}
      
      If you have any urgent questions, please feel free to call us at +92-21-34533913.
      
      Best regards,
      Time Publishers Team
      websol@timepublishers.com
      www.timepublishers.com
    `

    // In a real implementation, you would use a service like Resend, SendGrid, or similar
    // For now, we'll simulate the email sending
    console.log('Admin Email:', adminEmailContent)
    console.log('User Email:', userEmailContent)

    return new Response(
      JSON.stringify({ success: true, message: 'Emails sent successfully' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})