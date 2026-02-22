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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Verify caller
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
    const userId = claimsData.claims.sub;

    // Get partner ID
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: partnerRow } = await adminClient
      .from("partners")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!partnerRow) {
      return new Response(JSON.stringify({ error: "Not a partner" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profileId } = await req.json();
    if (!profileId) {
      return new Response(JSON.stringify({ error: "profileId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify link exists
    const { data: link } = await adminClient
      .from("partner_users")
      .select("id")
      .eq("partner_id", partnerRow.id)
      .eq("profile_id", profileId)
      .eq("consent_given", true)
      .maybeSingle();

    if (!link) {
      return new Response(
        JSON.stringify({ error: "Profile not linked or consent not given" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the most recent document uploaded by this partner for this profile
    const { data: docs, error: docsError } = await adminClient
      .from("documents")
      .select("id, document_name, document_url, document_date")
      .eq("partner_id", partnerRow.id)
      .eq("profile_id", profileId)
      .order("document_date", { ascending: false })
      .limit(1);

    if (docsError) throw docsError;

    if (!docs || docs.length === 0) {
      return new Response(
        JSON.stringify({ error: "No documents found for this patient", parameters: [] }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const doc = docs[0];

    // Generate signed URL and download file
    const filePath = doc.document_url.replace(/^.*profile-documents\//, "");
    const { data: signedData, error: signedError } = await adminClient.storage
      .from("profile-documents")
      .createSignedUrl(filePath, 300);

    if (signedError || !signedData?.signedUrl) {
      throw new Error("Failed to generate signed URL for document");
    }

    const fileResp = await fetch(signedData.signedUrl);
    if (!fileResp.ok) throw new Error("Failed to download document file");

    const fileBuffer = await fileResp.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(fileBuffer).reduce((s, b) => s + String.fromCharCode(b), "")
    );

    // Determine MIME type
    const ext = doc.document_name.split(".").pop()?.toLowerCase() || "";
    let mimeType = "image/jpeg";
    if (ext === "png") mimeType = "image/png";
    else if (ext === "pdf") mimeType = "application/pdf";
    else if (ext === "webp") mimeType = "image/webp";

    // Call Lovable AI Gateway with tool calling
    const aiResponse = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content:
                "You are a medical lab report analyzer. Extract ALL lab parameters from the provided report image/document. For each parameter, identify its name, measured value, unit, reference range, whether it is out of range, and its status (normal, high, or low). Use the extract_lab_parameters tool to return your findings.",
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this lab report. Extract every lab parameter with its value, unit, reference range, and whether it is out of range. Return structured data using the provided tool.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`,
                  },
                },
              ],
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_lab_parameters",
                description:
                  "Extract lab parameters from a medical lab report with their values, reference ranges, and out-of-range status.",
                parameters: {
                  type: "object",
                  properties: {
                    parameters: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          name: { type: "string", description: "Name of the lab parameter" },
                          value: { type: "string", description: "Measured value" },
                          unit: { type: "string", description: "Unit of measurement" },
                          reference_range: {
                            type: "string",
                            description: "Normal reference range",
                          },
                          is_out_of_range: {
                            type: "boolean",
                            description: "Whether the value is outside the reference range",
                          },
                          status: {
                            type: "string",
                            enum: ["normal", "high", "low"],
                            description: "Whether the value is normal, high, or low",
                          },
                        },
                        required: [
                          "name",
                          "value",
                          "unit",
                          "reference_range",
                          "is_out_of_range",
                          "status",
                        ],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["parameters"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_lab_parameters" },
          },
        }),
      }
    );

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errText = await aiResponse.text();
      console.error("AI gateway error:", aiResponse.status, errText);
      throw new Error("AI analysis failed");
    }

    const aiData = await aiResponse.json();

    // Extract tool call arguments
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    let parameters: any[] = [];
    if (toolCall?.function?.arguments) {
      try {
        const parsed =
          typeof toolCall.function.arguments === "string"
            ? JSON.parse(toolCall.function.arguments)
            : toolCall.function.arguments;
        parameters = parsed.parameters || [];
      } catch {
        console.error("Failed to parse AI tool call arguments");
      }
    }

    return new Response(
      JSON.stringify({
        document_name: doc.document_name,
        document_date: doc.document_date,
        parameters,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-lab-report error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
