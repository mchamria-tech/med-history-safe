import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface OtpRequest {
  partnerId: string;
  profileId: string;
  method: "email" | "sms";
}

const handler = async (req: Request): Promise<Response> => {
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
      .select("name, email, phone")
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

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
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

    // For production, integrate with email/SMS provider
    console.log(`OTP generated for profile ${profileId} by partner ${partnerId} (user: ${user.id})`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "OTP sent successfully",
        // In production, don't return the OTP
        // This is just for demo purposes
        demo_otp: otpCode 
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
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
