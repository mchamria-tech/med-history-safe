import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

// Dynamic CORS headers based on origin
function getCorsHeaders(request: Request) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = [
    'https://lovable.dev',
    'https://www.lovable.dev',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  // Allow Lovable preview URLs
  const isLovablePreview = origin.includes('.lovable.app') || origin.includes('.lovableproject.com');
  
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) || isLovablePreview ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

interface PasswordResetRequest {
  user: {
    email: string;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
  };
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload: PasswordResetRequest = await req.json();
    console.log("Password reset request received for:", payload.user.email);

    const { user, email_data } = payload;
    const resetLink = `${email_data.site_url}/reset-password?token=${email_data.token_hash}&type=${email_data.email_action_type}`;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CareBag <onboarding@resend.dev>",
        to: [user.email],
        subject: "Reset Your CareBag Password",
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
              <div style="background: linear-gradient(135deg, #3DB4E6 0%, #2a9fd4 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0; font-size: 28px;">CareBag</h1>
                <p style="color: white; margin: 10px 0 0 0; font-size: 14px;">Medical History Storage</p>
              </div>
              
              <div style="background: #ffffff; padding: 40px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #3DB4E6; margin-top: 0;">Password Reset Request</h2>
                
                <p>Hello,</p>
                
                <p>We received a request to reset your CareBag password. Click the button below to create a new password:</p>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" 
                     style="background: #3DB4E6; color: white; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    Reset Password
                  </a>
                </div>
                
                <p>Or copy and paste this link into your browser:</p>
                <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px;">
                  ${resetLink}
                </p>
                
                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
                  <strong>Important:</strong> This link will expire in 1 hour for security reasons.
                </p>
                
                <p style="color: #666; font-size: 14px;">
                  If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.
                </p>
              </div>
              
              <div style="text-align: center; margin-top: 20px; color: #999; font-size: 12px;">
                <p>© 2025 CareBag. All rights reserved.</p>
              </div>
            </body>
          </html>
        `,
      }),
    });

    const data = await emailResponse.json();
    
    if (!emailResponse.ok) {
      throw new Error(data.message || "Failed to send email");
    }

    console.log("Password reset email sent successfully:", data);

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-password-reset function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    );
  }
};

serve(handler);
