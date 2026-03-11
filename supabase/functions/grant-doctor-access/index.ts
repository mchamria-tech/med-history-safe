import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claimsData.claims.sub as string;

    const { doctor_global_id, profile_id, access_type, document_ids } = await req.json();

    if (!doctor_global_id || !profile_id || !access_type) {
      return new Response(
        JSON.stringify({ error: "doctor_global_id, profile_id, and access_type are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["temporary", "persistent"].includes(access_type)) {
      return new Response(
        JSON.stringify({ error: "access_type must be 'temporary' or 'persistent'" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify the calling user owns this profile
    const { data: profileRow } = await adminClient
      .from("profiles")
      .select("id, user_id")
      .eq("id", profile_id)
      .maybeSingle();

    if (!profileRow) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (profileRow.user_id !== userId) {
      return new Response(
        JSON.stringify({ error: "You can only share your own profiles" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Look up doctor by Global ID
    const { data: doctorRow } = await adminClient
      .from("doctors")
      .select("id, name, partner_id, is_active")
      .eq("global_id", doctor_global_id.toUpperCase().trim())
      .maybeSingle();

    if (!doctorRow) {
      return new Response(
        JSON.stringify({ error: "No doctor found with this Global ID. Please check and try again." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!doctorRow.is_active) {
      return new Response(
        JSON.stringify({ error: "This doctor's account is currently inactive" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create document access grants for selected documents
    const selectedDocs: string[] = Array.isArray(document_ids) ? document_ids : [];
    let grantsCreated = 0;

    if (selectedDocs.length > 0) {
      // Set expiry: 1 hour for temporary, 100 years for persistent
      const grantExpiry = access_type === "temporary"
        ? new Date(Date.now() + 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000).toISOString();

      // Verify documents belong to this profile
      const { data: validDocs } = await adminClient
        .from("documents")
        .select("id")
        .eq("profile_id", profile_id)
        .in("id", selectedDocs);

      const validDocIds = (validDocs || []).map((d: any) => d.id);

      if (validDocIds.length > 0) {
        const grants = validDocIds.map((docId: string) => ({
          document_id: docId,
          granted_to_type: "doctor" as const,
          granted_to_id: doctorRow.id,
          granted_by_user_id: userId,
          expires_at: grantExpiry,
          is_revoked: false,
        }));

        const { error: grantsError } = await adminClient
          .from("document_access_grants")
          .insert(grants);

        if (grantsError) {
          console.error("Document grants error:", grantsError);
          // Non-fatal: continue with profile access
        } else {
          grantsCreated = validDocIds.length;
        }
      }
    }

    if (access_type === "temporary") {
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

      const { error: insertError } = await adminClient
        .from("doctor_access")
        .insert({
          doctor_id: doctorRow.id,
          profile_id: profile_id,
          granted_by_user_id: userId,
          expires_at: expiresAt,
          is_revoked: false,
        });

      if (insertError) {
        console.error("Insert doctor_access error:", insertError);
        throw new Error("Failed to grant temporary access");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Temporary access granted to Dr. ${doctorRow.name} for 1 hour`,
          doctor_name: doctorRow.name,
          expires_at: expiresAt,
          documents_shared: grantsCreated,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (access_type === "persistent") {
      if (doctorRow.partner_id) {
        return new Response(
          JSON.stringify({
            error: "This doctor is attached to a healthcare organization. Use 'Quick Access' instead.",
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: upsertError } = await adminClient
        .from("doctor_patients")
        .upsert(
          {
            doctor_id: doctorRow.id,
            profile_id: profile_id,
            granted_by_user_id: userId,
            is_active: true,
          },
          { onConflict: "doctor_id,profile_id" }
        );

      if (upsertError) {
        console.error("Upsert doctor_patients error:", upsertError);
        throw new Error("Failed to add doctor to care team");
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: `Dr. ${doctorRow.name} has been added to this profile's care team`,
          doctor_name: doctorRow.name,
          documents_shared: grantsCreated,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  } catch (e) {
    console.error("grant-doctor-access error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
