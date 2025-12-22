import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create admin client with service role for creating users
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create regular client to verify the requesting user is a super admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the requesting user
    const { data: { user: requestingUser }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !requestingUser) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify requesting user is a super admin
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', requestingUser.id)
      .eq('role', 'super_admin')
      .single();

    if (roleError || !roleData) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Only super admins can create partners' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { name, email, password, is_active, logo_url, address, gst_number, govt_certification } = await req.json();

    if (!name || !email || !password) {
      return new Response(
        JSON.stringify({ error: 'Name, email, and password are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Creating partner auth user for:', email);

    // Create auth user using admin client (doesn't affect requesting user's session)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
    });

    if (authError) {
      console.error('Auth user creation error:', authError);
      return new Response(
        JSON.stringify({ error: authError.message }),
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

    // Generate partner code
    const generatedCode = 'X' + Math.random().toString(36).substring(2, 7).toUpperCase();

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
      })
      .select()
      .single();

    if (partnerError) {
      console.error('Partner creation error:', partnerError);
      // Cleanup: delete the auth user if partner creation fails
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
      // Cleanup
      await supabaseAdmin.from('partners').delete().eq('id', partnerData.id);
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return new Response(
        JSON.stringify({ error: roleInsertError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Partner role assigned');

    // Log the admin action
    await supabaseAdmin.from('admin_audit_logs').insert({
      admin_id: requestingUser.id,
      action: 'create_partner',
      target_type: 'partner',
      target_id: partnerData.id,
      details: { partner_name: name, partner_code: generatedCode },
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
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
