import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { global_id, password } = await req.json();

    if (!global_id || !password) {
      return new Response(
        JSON.stringify({ error: "Global ID and password are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate format
    const globalIdPattern = /^[A-Z]{3}-0[A-Z0-9]{5}$/i;
    if (!globalIdPattern.test(global_id)) {
      return new Response(
        JSON.stringify({ error: "Invalid Admin Global ID format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Look up email by global ID server-side
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, user_id")
      .eq("carebag_id", global_id.toUpperCase())
      .single();

    if (profileError || !profile?.email) {
      // Generic error to prevent enumeration
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify super_admin role before attempting login
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", profile.user_id)
      .eq("role", "super_admin");

    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Attempt sign-in with the resolved email
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (authError || !authData.session) {
      return new Response(
        JSON.stringify({ error: "Invalid credentials" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        session: authData.session,
        user: authData.user,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin global ID lookup error:", error);
    return new Response(
      JSON.stringify({ error: "Invalid credentials" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
