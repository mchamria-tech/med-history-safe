import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseAnon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAnon.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = claimsData.claims.sub;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 2. Verify caller is a partner
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "partner");

    if (!roles || roles.length === 0) {
      return new Response(
        JSON.stringify({ error: "Forbidden: Partner role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Get partner record
    const { data: partnerData, error: partnerError } = await supabaseAdmin
      .from("partners")
      .select("id, name")
      .eq("user_id", userId)
      .single();

    if (partnerError || !partnerData) {
      return new Response(
        JSON.stringify({ error: "Partner record not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Parse body
    const body = await req.json();
    const {
      profile_id,
      file_base64,
      file_name,
      document_name,
      document_date,
      document_type,
      doctor_name,
      ailment,
      medicine,
      other_tags,
    } = body;

    if (!profile_id || !file_base64 || !file_name || !document_name || !document_date) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: profile_id, file_base64, file_name, document_name, document_date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 5. Validate file size (base64 is ~33% larger than binary; 10MB binary ≈ 13.3MB base64)
    if (file_base64.length > 14_000_000) {
      return new Response(
        JSON.stringify({ error: "File too large. Maximum size is 10MB." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 6. Verify profile is linked to this partner with consent
    const { data: link } = await supabaseAdmin
      .from("partner_users")
      .select("id")
      .eq("partner_id", partnerData.id)
      .eq("profile_id", profile_id)
      .eq("consent_given", true)
      .maybeSingle();

    if (!link) {
      return new Response(
        JSON.stringify({ error: "Profile is not linked to your partner account or consent not given" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 7. Get profile's user_id for storage path
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("user_id")
      .eq("id", profile_id)
      .single();

    if (profileError || !profileData) {
      return new Response(
        JSON.stringify({ error: "Profile not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 8. Upload file to storage using service role
    const fileExt = file_name.split(".").pop() || "pdf";
    const storagePath = `${profileData.user_id}/${profile_id}/${Date.now()}.${fileExt}`;
    const fileBytes = base64ToUint8Array(file_base64);

    const { error: uploadError } = await supabaseAdmin.storage
      .from("profile-documents")
      .upload(storagePath, fileBytes, {
        contentType: getContentType(fileExt),
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return new Response(
        JSON.stringify({ error: "Failed to upload file to storage" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 9. Insert document record using service role
    const { data: docData, error: dbError } = await supabaseAdmin
      .from("documents")
      .insert({
        user_id: profileData.user_id,
        profile_id: profile_id,
        document_name: document_name.trim(),
        document_url: storagePath,
        document_date: document_date,
        document_type: document_type || null,
        doctor_name: doctor_name?.trim() || null,
        ailment: ailment?.trim() || null,
        medicine: medicine?.trim() || null,
        other_tags: other_tags?.trim() || null,
        partner_id: partnerData.id,
        partner_source_name: partnerData.name,
      })
      .select("id")
      .single();

    if (dbError) {
      console.error("Document insert error:", dbError);
      // Clean up uploaded file
      await supabaseAdmin.storage.from("profile-documents").remove([storagePath]);
      return new Response(
        JSON.stringify({ error: "Failed to create document record" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, document_id: docData.id }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("partner-upload-document error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getContentType(ext: string): string {
  const map: Record<string, string> = {
    pdf: "application/pdf",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    doc: "application/msword",
    docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  };
  return map[ext.toLowerCase()] || "application/octet-stream";
}
