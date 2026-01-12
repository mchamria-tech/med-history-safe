import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create admin client with service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create regular client to verify the requesting user is a super admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the requesting user
    const {
      data: { user: requestingUser },
      error: userError,
    } = await supabaseClient.auth.getUser();
    if (userError || !requestingUser) {
      console.error("Auth error:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Verify requesting user is a super admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", requestingUser.id)
      .eq("role", "super_admin")
      .single();

    if (roleError || !roleData) {
      console.error("Role check error:", roleError);
      return new Response(
        JSON.stringify({ error: "Only super admins can delete users" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Parse request body
    const { user_id, delete_type } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "User ID is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Prevent deleting yourself
    if (user_id === requestingUser.id) {
      return new Response(
        JSON.stringify({ error: "You cannot delete your own account" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log("Deleting user:", user_id, "Type:", delete_type);

    // Get user info before deletion for logging
    const { data: userProfiles } = await supabaseAdmin
      .from("profiles")
      .select("name, email")
      .eq("user_id", user_id)
      .limit(1);

    const userName = userProfiles?.[0]?.name || "Unknown";
    const userEmail = userProfiles?.[0]?.email || "Unknown";

    // Check if user is a partner
    const { data: partnerData } = await supabaseAdmin
      .from("partners")
      .select("id, name")
      .eq("user_id", user_id)
      .single();

    if (delete_type === "full") {
      // Full deletion - delete auth user (cascades to profiles, etc.)
      const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(
        user_id,
      );

      if (deleteAuthError) {
        console.error("Error deleting auth user:", deleteAuthError);
        return new Response(
          JSON.stringify({ error: deleteAuthError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      console.log("User fully deleted:", user_id);
    } else {
      // Partial deletion - only delete profiles, documents, keep auth user
      // Delete documents first (they reference profiles)
      const { error: docsError } = await supabaseAdmin
        .from("documents")
        .delete()
        .eq("user_id", user_id);

      if (docsError) {
        console.error("Error deleting documents:", docsError);
      }

      // Delete profiles
      const { error: profilesError } = await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("user_id", user_id);

      if (profilesError) {
        console.error("Error deleting profiles:", profilesError);
        return new Response(
          JSON.stringify({ error: profilesError.message }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      console.log("User profiles and documents deleted:", user_id);
    }

    // Log the admin action
    await supabaseAdmin.from("admin_audit_logs").insert({
      admin_id: requestingUser.id,
      action: delete_type === "full" ? "delete_user" : "delete_user_data",
      target_type: partnerData ? "partner" : "user",
      target_id: user_id,
      details: {
        user_name: userName,
        user_email: userEmail,
        partner_name: partnerData?.name || null,
        delete_type,
      },
    });

    return new Response(
      JSON.stringify({ success: true, deleted_type: delete_type }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
      },
    );
  }
});
