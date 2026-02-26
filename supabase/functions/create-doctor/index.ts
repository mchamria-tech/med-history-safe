import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
        JSON.stringify({ error: 'Unauthorized' }),
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

    // Verify partner role
    const { data: roleData } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'partner')
      .single();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: 'Only partners can create doctor accounts.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get partner record
    const { data: partnerRecord } = await supabaseAdmin
      .from('partners')
      .select('id, country')
      .eq('user_id', requestingUser.id)
      .single();

    if (!partnerRecord) {
      return new Response(
        JSON.stringify({ error: 'Partner record not found.' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { name, email, password, specialty, hospital, phone } = await req.json();

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and password are required.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      let msg = authError.message;
      if (msg?.includes('already been registered')) {
        msg = 'This email is already registered. Try linking an existing doctor instead.';
      }
      return new Response(
        JSON.stringify({ error: msg }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!authData.user) {
      return new Response(
        JSON.stringify({ error: 'Failed to create user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = authData.user.id;

    // Generate doctor Global ID
    const { data: globalId, error: idError } = await supabaseAdmin.rpc('generate_global_id', {
      role_type: 'doctor',
      country_code: partnerRecord.country || 'IND',
    });

    if (idError || !globalId) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: 'Failed to generate doctor ID' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert doctor record
    const { data: doctorData, error: doctorError } = await supabaseAdmin
      .from('doctors')
      .insert({
        user_id: userId,
        global_id: globalId,
        name,
        email,
        specialty: specialty || null,
        hospital: hospital || null,
        phone: phone || null,
        partner_id: partnerRecord.id,
        is_active: true,
      })
      .select()
      .single();

    if (doctorError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: doctorError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Add doctor role
    const { error: roleInsertError } = await supabaseAdmin
      .from('user_roles')
      .insert({ user_id: userId, role: 'doctor' });

    if (roleInsertError) {
      await supabaseAdmin.from('doctors').delete().eq('id', doctorData.id);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return new Response(
        JSON.stringify({ error: roleInsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, doctor: doctorData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: msg }),
      { status: 500, headers: { ...getCorsHeaders(req), 'Content-Type': 'application/json' } }
    );
  }
});
