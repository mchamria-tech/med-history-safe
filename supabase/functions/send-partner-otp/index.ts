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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { partnerId, profileId, method }: OtpRequest = await req.json();

    // Generate 6-digit OTP
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Get profile details
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("name, email, phone")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    // Get partner details
    const { data: partner, error: partnerError } = await supabaseClient
      .from("partners")
      .select("name")
      .eq("id", partnerId)
      .single();

    if (partnerError || !partner) {
      throw new Error("Partner not found");
    }

    // Store OTP in database
    const { error: otpError } = await supabaseClient
      .from("partner_otp_requests")
      .insert({
        partner_id: partnerId,
        profile_id: profileId,
        otp_code: otpCode,
        expires_at: expiresAt.toISOString(),
      });

    if (otpError) {
      console.error("Error storing OTP:", otpError);
      throw new Error("Failed to create OTP request");
    }

    // For production, integrate with email/SMS provider
    // OTP is stored in database for verification
    console.log(`OTP ${otpCode} generated for profile ${profileId} by partner ${partnerId}`);

    // For SMS, you would integrate with an SMS provider here
    // if (method === "sms" && profile.phone) {
    //   // Send SMS using Twilio, etc.
    // }

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
