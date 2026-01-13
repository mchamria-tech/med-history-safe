import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

interface OtpRequest {
  partnerId: string;
  profileId: string;
  method: "email" | "sms";
}

// Helper to mask email for display
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}@${domain}`;
}

// Generate branded HTML email template
function generateOtpEmailHtml(otpCode: string, partnerName: string, userName: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 12px 12px 0 0;">
          <tr>
            <td style="padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 700;">CareBag</h1>
              <p style="margin: 5px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Medical History Storage</p>
            </td>
          </tr>
        </table>
        
        <!-- Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="margin: 0 0 10px 0; color: #18181b; font-size: 20px; font-weight: 600;">Verification Code</h2>
              <p style="margin: 0 0 25px 0; color: #71717a; font-size: 15px; line-height: 1.5;">
                Hi ${userName}, here is your one-time verification code:
              </p>
              
              <!-- OTP Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="background-color: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center;">
                    <span style="font-family: 'SF Mono', Monaco, 'Courier New', monospace; font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #18181b;">${otpCode}</span>
                  </td>
                </tr>
              </table>
              
              <!-- Partner Info -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top: 25px;">
                <tr>
                  <td style="background-color: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 15px;">
                    <p style="margin: 0; color: #1e40af; font-size: 14px;">
                      <strong>Requested by:</strong> ${partnerName}
                    </p>
                    <p style="margin: 5px 0 0 0; color: #3b82f6; font-size: 13px;">
                      This code expires in 10 minutes
                    </p>
                  </td>
                </tr>
              </table>
              
              <!-- Security Notice -->
              <p style="margin: 25px 0 0 0; color: #a1a1aa; font-size: 13px; line-height: 1.5;">
                If you didn't request this code, you can safely ignore this email. Never share this code with anyone.
              </p>
            </td>
          </tr>
        </table>
        
        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding: 25px; text-align: center;">
              <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                © ${new Date().getFullYear()} CareBag. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Unauthorized: Missing authorization header" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client with user's JWT to verify authentication
    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader },
        },
      }
    );

    // Verify the user is authenticated
    const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();
    if (userError || !user) {
      console.error("User authentication failed:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized: Invalid token" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log("Authenticated user:", user.id);

    // Create admin client for database operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { partnerId, profileId, method }: OtpRequest = await req.json();

    // Input validation
    if (!partnerId || !profileId || !method) {
      console.error("Missing required fields:", { partnerId, profileId, method });
      return new Response(
        JSON.stringify({ error: "Missing required fields: partnerId, profileId, method" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate method
    if (method !== "email" && method !== "sms") {
      console.error("Invalid method:", method);
      return new Response(
        JSON.stringify({ error: "Invalid method. Must be 'email' or 'sms'" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // For now, only email is supported
    if (method === "sms") {
      console.error("SMS not yet supported");
      return new Response(
        JSON.stringify({ error: "SMS delivery is not yet available. Please use email." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify the authenticated user is a partner and matches the partnerId
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from("partners")
      .select("id, name, user_id")
      .eq("id", partnerId)
      .single();

    if (partnerError || !partner) {
      console.error("Partner not found:", partnerError);
      return new Response(
        JSON.stringify({ error: "Partner not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Verify the authenticated user owns this partner account
    if (partner.user_id !== user.id) {
      console.error("User does not own this partner account:", { userId: user.id, partnerUserId: partner.user_id });
      return new Response(
        JSON.stringify({ error: "Unauthorized: You do not have access to this partner account" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Rate limiting: Check for recent OTP requests for this profile by this partner
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: recentOtps, error: recentError } = await supabaseAdmin
      .from("partner_otp_requests")
      .select("id")
      .eq("partner_id", partnerId)
      .eq("profile_id", profileId)
      .gte("created_at", oneHourAgo);

    if (recentError) {
      console.error("Error checking recent OTPs:", recentError);
    } else if (recentOtps && recentOtps.length >= 3) {
      console.error("Rate limit exceeded for profile:", profileId);
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Maximum 3 OTP requests per profile per hour." }),
        {
          status: 429,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Get profile details
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, name, email, phone, user_id, carebag_id")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      console.error("Profile not found:", profileError);
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Check if user has an email address
    if (!profile.email) {
      console.error("Profile does not have an email address:", profileId);
      return new Response(
        JSON.stringify({ error: "User does not have an email address on file. Please contact them directly." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Authorization check: Partner must have a valid relationship with the profile
    const isProfileOwnedByPartner = profile.user_id === partner.user_id;
    
    const { data: existingLink } = await supabaseAdmin
      .from("partner_users")
      .select("id")
      .eq("partner_id", partnerId)
      .eq("profile_id", profileId)
      .maybeSingle();

    const isAlreadyLinked = !!existingLink;

    // For security, we also check if there's NO existing link - this is for new linking flow
    if (!isProfileOwnedByPartner && !isAlreadyLinked) {
      console.log(`Partner ${partnerId} requesting OTP for unlinked profile ${profileId} - allowed for linking flow`);
      
      // Additional security: Only allow if the profile has a carebag_id (registered user)
      if (!profile.carebag_id) {
        console.error("Profile does not have a CareBag ID - cannot send OTP");
        return new Response(
          JSON.stringify({ error: "This profile cannot be linked. Contact support for assistance." }),
          {
            status: 403,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }
    }

    // Generate cryptographically secure 6-digit OTP
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    const otpCode = String(array[0]).slice(0, 6).padStart(6, '0');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: otpError } = await supabaseAdmin
      .from("partner_otp_requests")
      .insert({
        partner_id: partnerId,
        profile_id: profileId,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
      });

    if (otpError) {
      console.error("Error storing OTP:", otpError);
      return new Response(
        JSON.stringify({ error: "Failed to create OTP request" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send OTP via email using Resend API
    console.log(`Sending OTP email to ${maskEmail(profile.email)} for profile ${profileId}`);
    
    const emailHtml = generateOtpEmailHtml(otpCode, partner.name, profile.name);
    
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "CareBag <onboarding@resend.dev>",
        to: [profile.email],
        subject: "Your CareBag Verification Code",
        html: emailHtml,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok || emailResult.error) {
      console.error("Error sending email:", emailResult.error || emailResult);
      return new Response(
        JSON.stringify({ error: "Failed to send verification email. Please try again." }),
        {
          status: 500,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    console.log(`OTP email sent successfully to ${maskEmail(profile.email)} (ID: ${emailResult.id})`);

    // Return success with masked email for confirmation
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        maskedEmail: maskEmail(profile.email)
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-partner-otp function:", error);
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
