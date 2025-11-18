import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: "No image provided" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate that the file is an image (not PDF or other formats)
    if (!image.startsWith('data:image/')) {
      console.error('Invalid file type. Only images are supported. Received:', image.substring(0, 30));
      return new Response(
        JSON.stringify({ error: "Only image files (JPG, PNG, WEBP) are supported for AI extraction. PDFs are not supported." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Calling Lovable AI for metadata extraction...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'You are a medical document analyzer. Extract structured information from medical documents like prescriptions, lab reports, and medical certificates.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract the following information from this medical document: doctor name, document date, ailment/diagnosis, medicines prescribed, and document type (prescription/lab report/certificate/other).'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: 'function',
            function: {
              name: 'extract_metadata',
              description: 'Extract medical document metadata',
              parameters: {
                type: 'object',
                properties: {
                  doctor_name: {
                    type: 'string',
                    description: 'Name of the doctor or medical professional'
                  },
                  document_date: {
                    type: 'string',
                    description: 'Date of the document in YYYY-MM-DD format'
                  },
                  ailment: {
                    type: 'string',
                    description: 'Diagnosis or ailment mentioned in the document'
                  },
                  medicine: {
                    type: 'string',
                    description: 'Medicines or treatments prescribed'
                  },
                  document_type: {
                    type: 'string',
                    enum: ['prescription', 'lab report', 'medical certificate', 'other'],
                    description: 'Type of medical document'
                  }
                },
                required: ['document_type'],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: 'function', function: { name: 'extract_metadata' } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to extract metadata from document" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || !toolCall.function?.arguments) {
      return new Response(
        JSON.stringify({ error: "No metadata could be extracted from the document" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const metadata = JSON.parse(toolCall.function.arguments);
    console.log('Extracted metadata:', metadata);

    return new Response(
      JSON.stringify({ metadata }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in extract-document-metadata:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
