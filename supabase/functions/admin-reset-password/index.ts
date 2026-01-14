import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Dynamic CORS headers based on origin
function getCorsHeaders(request: Request) {
  const origin = request.headers.get('origin') || '';
  const allowedOrigins = [
    'https://lovable.dev',
    'https://www.lovable.dev',
    'http://localhost:5173',
    'http://localhost:3000',
  ];
  
  const isLovablePreview = origin.includes('.lovable.app') || origin.includes('.lovableproject.com');
  
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) || isLovablePreview ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

interface AdminResetRequest {
  userEmail: string;
  userName?: string;
  userType: 'user' | 'partner';
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the request is from an authenticated super admin
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get the user from the auth token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !adminUser) {
      throw new Error("Invalid authentication token");
    }

    // Check if the user is a super admin
    const { data: roles, error: rolesError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", adminUser.id)
      .eq("role", "super_admin");

    if (rolesError || !roles || roles.length === 0) {
      throw new Error("Unauthorized: Super admin access required");
    }

    const { userEmail, userName, userType }: AdminResetRequest = await req.json();

    if (!userEmail) {
      throw new Error("User email is required");
    }

    console.log(`Admin ${adminUser.email} requesting password reset for ${userType}: ${userEmail}`);

    // Get the site URL from the request origin
    const origin = req.headers.get('origin') || 'https://carebag.lovable.app';
    const resetRedirectUrl = `${origin}/reset-password`;

    // Use Supabase's built-in password reset which triggers Lovable Cloud's email service
    // This uses the admin client to send the recovery email on behalf of the user
    const { error: resetError } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: userEmail,
      options: {
        redirectTo: resetRedirectUrl,
      },
    });

    if (resetError) {
      console.error("Failed to generate reset link:", resetError);
      throw new Error(`Failed to initiate password reset: ${resetError.message}`);
    }

    // The generateLink with admin client generates the link but doesn't send email automatically
    // We need to use the standard resetPasswordForEmail to trigger the email hook
    const anonClient = createClient(
      supabaseUrl, 
      Deno.env.get("SUPABASE_ANON_KEY")!
    );
    
    const { error: emailError } = await anonClient.auth.resetPasswordForEmail(userEmail, {
      redirectTo: resetRedirectUrl,
    });

    if (emailError) {
      console.error("Failed to send reset email:", emailError);
      throw new Error(`Failed to send password reset email: ${emailError.message}`);
    }

    // Log the admin action
    await supabase.from("admin_audit_logs").insert({
      admin_id: adminUser.id,
      action: "password_reset_initiated",
      target_type: userType,
      details: { 
        target_email: userEmail,
        target_name: userName,
      },
    });

    console.log("Password reset email sent successfully to:", userEmail);

    return new Response(
      JSON.stringify({ success: true, message: "Password reset email sent" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in admin-reset-password function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message.includes("Unauthorized") ? 403 : 500,
        headers: { "Content-Type": "application/json", ...getCorsHeaders(req) },
      }
    );
  }
};

serve(handler);
