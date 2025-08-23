// Path: backend/supabase/functions/admin/index.ts
// This code has been refactored for improved readability and reusability.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Helper to check if a user is admin
async function isAdminUser(supabaseAdminClient: any, userId: string): Promise<boolean> {
  const { data, error } = await supabaseAdminClient
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single();
  return !error && !!data?.is_admin;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdminClient = createClient(
    Deno.env.get('PROJECT_URL') || '',
    Deno.env.get('SERVICE_ROLE_KEY') || ''
  );

  try {
    const { action, payload } = await req.json();
    let result = null;

    // Authorization block: Check if the calling user is an admin for privileged actions
    let callerIsAdmin = false;
    let callerUser = null;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const supabaseClientForUserCheck = createClient(
        Deno.env.get('PROJECT_URL') || '',
        Deno.env.get('ANON_KEY') || '',
        { global: { headers: { 'Authorization': authHeader } } }
      );
      const { data } = await supabaseClientForUserCheck.auth.getUser();
      callerUser = data?.user;
      if (callerUser) {
        callerIsAdmin = await isAdminUser(supabaseAdminClient, callerUser.id);
      }
    }

    switch (action) {
      case 'create_admin_user': {
        const { email, password, username, adminSecret } = payload || {};
        const expectedAdminSecret = Deno.env.get('ADMIN_SECRET_KEY');

        if (adminSecret !== expectedAdminSecret) {
          return new Response(JSON.stringify({ error: 'Invalid admin secret key' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { data: userData, error: authError } = await supabaseAdminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username, is_admin: true }
        });
        if (authError) throw authError;
        if (!userData?.user) throw new Error('User creation failed');

        const { error: profileError } = await supabaseAdminClient.from('users').insert([{
          id: userData.user.id,
          username,
          email: userData.user.email,
          wallet_balance: 1000.00,
          is_admin: true,
        }]);
        if (profileError) throw profileError;

        result = { user: userData.user, message: "Admin user created successfully!" };
        break;
      }

      case 'delete_user': {
        if (!callerIsAdmin) {
          return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const { userId } = payload || {};
        if (!userId) {
          return new Response(JSON.stringify({ error: 'Missing userId in payload' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        await supabaseAdminClient.from('policies').delete().eq('user_id', userId);
        await supabaseAdminClient.from('claims').delete().eq('user_id', userId);
        await supabaseAdminClient.from('transactions').delete().eq('user_id', userId);
        await supabaseAdminClient.from('users').delete().eq('id', userId);
        result = await supabaseAdminClient.auth.admin.deleteUser(userId);
        break;
      }

      case 'trigger_claim': {
        if (!callerIsAdmin) {
          return new Response(JSON.stringify({ error: 'Forbidden: Admin access required to trigger claims' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const { userId: triggerUserId, policyId: triggerPolicyId, eventData: triggerEventData = {} } = payload || {};
        
        const { data: policyData, error: policyError } = await supabaseAdminClient
          .from('policies')
          .select('cost, coverage_amount')
          .eq('id', triggerPolicyId)
          .single();
        if (policyError || !policyData) {
          throw new Error('Policy not found or could not retrieve details for claim triggering.');
        }

        const { data: newClaim, error: claimError } = await supabaseAdminClient.from('claims').insert([{
          policy_id: triggerPolicyId,
          user_id: triggerUserId,
          status: 'approved',
          event_data: triggerEventData,
          event_hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
          payout_amount: policyData.coverage_amount || policyData.cost,
          confidence_score: 100,
          processed_at: new Date().toISOString()
        }]).select().single();
        if (claimError) throw claimError;

        const { data: userProfile, error: userProfileError } = await supabaseAdminClient.from('users').select('wallet_balance').eq('id', triggerUserId).single();
        if (userProfileError || !userProfile) {
          throw new Error('User profile not found for payout.');
        }
        const newWalletBalance = userProfile.wallet_balance + (newClaim.payout_amount || 0);
        await supabaseAdminClient.from('users').update({ wallet_balance: newWalletBalance }).eq('id', triggerUserId);

        await supabaseAdminClient.from('transactions').insert([{
          user_id: triggerUserId,
          amount: newClaim.payout_amount,
          type: 'payout',
          description: `Claim payout for policy ${triggerPolicyId}`,
          blockchain_hash: newClaim.event_hash,
          created_at: new Date().toISOString()
        }]);

        result = { claim: newClaim, message: "Claim triggered and processed successfully!" };
        break;
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});