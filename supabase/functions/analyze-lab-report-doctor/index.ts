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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller has doctor role
    const { data: roleRow } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", userId)
      .eq("role", "doctor")
      .maybeSingle();

    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Not a doctor" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get doctor record
    const { data: doctorRow } = await adminClient
      .from("doctors")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (!doctorRow) {
      return new Response(JSON.stringify({ error: "Doctor record not found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { profileId, documentId } = await req.json();
    if (!profileId) {
      return new Response(JSON.stringify({ error: "profileId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check doctor has active access (time-limited via doctor_access)
    const { data: accessRow } = await adminClient
      .from("doctor_access")
      .select("id")
      .eq("doctor_id", doctorRow.id)
      .eq("profile_id", profileId)
      .eq("is_revoked", false)
      .gt("expires_at", new Date().toISOString())
      .maybeSingle();

    // Also check persistent access via doctor_patients (if table exists in future)
    let hasPersistentAccess = false;
    try {
      const { data: persistentRow } = await adminClient
        .from("doctor_patients")
        .select("id")
        .eq("doctor_id", doctorRow.id)
        .eq("profile_id", profileId)
        .eq("is_active", true)
        .maybeSingle();
      hasPersistentAccess = !!persistentRow;
    } catch {
      // Table doesn't exist yet, skip
    }

    if (!accessRow && !hasPersistentAccess) {
      return new Response(
        JSON.stringify({ error: "No active access to this patient's records" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the most recent document for this profile (any uploader)
    const { data: docs, error: docsError } = await adminClient
      .from("documents")
      .select("id, document_name, document_url, document_date")
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
    const bytes = new Uint8Array(fileBuffer);
    const base64 = btoa(bytes.reduce((s, b) => s + String.fromCharCode(b), ""));

    // Detect MIME type
    const contentTypeHeader = fileResp.headers.get("content-type")?.split(";")[0]?.trim()?.toLowerCase();

    const detectFromMagicBytes = (buf: Uint8Array): string | null => {
      if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return "application/pdf";
      if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return "image/jpeg";
      if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return "image/png";
      if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 && buf.length > 11 &&
          buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
      return null;
    };

    const detectFromExtension = (name: string): string | null => {
      const ext = name.split(".").pop()?.toLowerCase() || "";
      if (ext === "pdf") return "application/pdf";
      if (ext === "png") return "image/png";
      if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
      if (ext === "webp") return "image/webp";
      return null;
    };

    const knownTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp"];
    const mimeType =
      (contentTypeHeader && knownTypes.includes(contentTypeHeader) ? contentTypeHeader : null)
      || detectFromMagicBytes(bytes)
      || detectFromExtension(doc.document_name)
      || "image/jpeg";

    console.log("MIME detection — Content-Type header:", contentTypeHeader, "| Magic bytes:", detectFromMagicBytes(bytes), "| Final:", mimeType);

    const fileContentBlock = {
      type: "image_url",
      image_url: {
        url: `data:${mimeType};base64,${base64}`,
      },
    };

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
                fileContentBlock,
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
                          reference_range: { type: "string", description: "Normal reference range" },
                          is_out_of_range: { type: "boolean", description: "Whether the value is outside the reference range" },
                          status: { type: "string", enum: ["normal", "high", "low"], description: "Whether the value is normal, high, or low" },
                        },
                        required: ["name", "value", "unit", "reference_range", "is_out_of_range", "status"],
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

      let errorMessage = "AI analysis failed";
      try {
        const errJson = JSON.parse(errText);
        if (errJson?.error?.metadata?.raw) {
          const raw = JSON.parse(errJson.error.metadata.raw);
          if (raw?.error?.message?.includes("Unable to process input image")) {
            errorMessage = "The document format could not be processed by the AI. Please try uploading a JPEG, PNG, or WebP image of the report instead.";
          } else {
            errorMessage = raw?.error?.message || errorMessage;
          }
        } else if (errJson?.error?.message) {
          errorMessage = errJson.error.message;
        }
      } catch { /* use default */ }

      return new Response(
        JSON.stringify({ error: errorMessage }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();

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

    // Generate educational insights for out-of-range parameters
    let insights: string | undefined;
    const outOfRange = parameters.filter((p: any) => p.is_out_of_range);
    if (outOfRange.length > 0) {
      try {
        const outOfRangeText = outOfRange
          .map((p: any) => `- ${p.name}: ${p.value} ${p.unit} (Reference: ${p.reference_range}, Status: ${p.status})`)
          .join("\n");

        const insightsResponse = await fetch(
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
                    "You are a medical education assistant. Given a list of out-of-range lab parameters, provide brief educational context about what each parameter measures and what abnormal values may commonly be associated with. Do NOT diagnose. Do NOT recommend treatment. Use phrases like 'commonly associated with', 'may indicate', 'often seen in'. Always remind that only a qualified healthcare provider can interpret results in clinical context. Keep your response concise and well-structured with one paragraph per parameter.",
                },
                {
                  role: "user",
                  content: `The following lab parameters were found to be out of range:\n\n${outOfRangeText}\n\nPlease provide brief educational context for each out-of-range parameter.`,
                },
              ],
            }),
          }
        );

        if (insightsResponse.ok) {
          const insightsData = await insightsResponse.json();
          insights = insightsData.choices?.[0]?.message?.content || undefined;
        } else {
          console.error("Insights AI call failed:", insightsResponse.status);
        }
      } catch (insightsErr) {
        console.error("Insights generation error:", insightsErr);
      }
    }

    return new Response(
      JSON.stringify({
        document_name: doc.document_name,
        document_date: doc.document_date,
        parameters,
        ...(insights ? { insights } : {}),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("analyze-lab-report-doctor error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
