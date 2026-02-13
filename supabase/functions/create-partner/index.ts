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
  
  const isLovablePreview = origin.includes('.lovable.app') || origin.includes('.lovableproject.com');
  
  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) || isLovablePreview ? origin : allowedOrigins[0],
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Credentials': 'true',
  };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Verify auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Your session has expired. Please log in again.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !requestingUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify super admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'super_admin')
      .single();

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'You do not have permission to create partners. Only Super Admins can perform this action.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { name, email, password, is_active, logo_url, address, gst_number, govt_certification, country } = await req.json();

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Please provide all required fields: Business Name, Email, and Password.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const partnerCountry = country || 'IND';

    console.log('Creating partner auth user for:', email, 'country:', partnerCountry);

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      let userMessage = authError.message;
      if (authError.message?.includes('already been registered')) {
        userMessage = 'This email address is already registered. If this partner already has an account, search for them in the Partners list instead.';
      }
      return new Response(
        JSON.stringify({ error: userMessage }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Auth user created:', authData.user.id);

    // Generate partner code using the database function with country support
    const { data: generatedCode, error: codeError } = await supabaseAdmin.rpc('generate_global_id', {
      role_type: 'partner',
      country_code: partnerCountry,
    });

    if (codeError || !generatedCode) {
      console.error('Code generation error:', codeError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: 'Failed to generate partner code' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Generated partner code:', generatedCode);

    // Create partner record
    const { data: partnerData, error: partnerError } = await supabaseAdmin
      .from('partners')
      .insert({
        user_id: authData.user.id,
        partner_code: generatedCode,
        name,
        email,
        is_active: is_active ?? true,
        logo_url: logo_url || null,
        address: address || null,
        gst_number: gst_number || null,
        govt_certification: govt_certification || null,
        country: partnerCountry,
      })
      .select()
      .single();

    if (partnerError) {
      console.error('Partner creation error:', partnerError);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: partnerError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Partner created:', partnerData.id);

    // Add partner role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({
        user_id: authData.user.id,
        role: 'partner',
      });

    if (roleInsertError) {
      console.error('Role insertion error:', roleInsertError);
      await supabaseAdmin.from('partners').delete().eq('id', partnerData.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: roleInsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log the admin action
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: requestingUser.id,
      action: 'create_partner',
      target_type: 'partner',
      target_id: partnerData.id,
      details: { partner_name: name, partner_code: generatedCode, country: partnerCountry },
    });

    console.log('Partner creation completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        partner: partnerData,
        partner_code: generatedCode,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
