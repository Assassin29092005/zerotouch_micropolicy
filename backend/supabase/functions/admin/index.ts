// Path: backend/supabase/functions/admin/index.js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseAdminClient = createClient(
    Deno.env.get('PROJECT_URL'),
    Deno.env.get('SERVICE_ROLE_KEY')
  );

  try {
    const { action, payload } = await req.json();

    let result = null;
    switch (action) {
      case 'create_admin_user':
        const { email, password, username, adminSecret } = payload;
        const expectedAdminSecret = Deno.env.get('ADMIN_SECRET_KEY');

        if (adminSecret !== expectedAdminSecret) {
          return new Response(JSON.stringify({ error: 'Invalid admin secret key' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { data: userData, error: authError } = await supabaseAdminClient.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { username: username, is_admin: true }
        });

        if (authError) throw authError;

        const { error: profileError } = await supabaseAdminClient.from('users').insert([
          {
            id: userData.user.id,
            username: username,
            email: userData.user.email,
            wallet_balance: 1000.00,
            is_admin: true,
          }
        ]);

        if (profileError) throw profileError;
        result = { user: userData.user, message: "Admin user created successfully!" };
        break;

      case 'delete_user':
        const authHeader = req.headers.get('Authorization');
        const token = authHeader?.split(' ')[1];
        if (!token) {
          return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const supabaseClientForUserCheck = createClient(
            Deno.env.get('PROJECT_URL'),
            Deno.env.get('ANON_KEY'),
            { global: { headers: { 'Authorization': authHeader } } }
        );
        const { data: { user: callingUser } } = await supabaseClientForUserCheck.auth.getUser();

        if (!callingUser) {
            return new Response(JSON.stringify({ error: 'Authentication failed' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { data: adminCheckData, error: adminCheckError } = await supabaseAdminClient
            .from('users')
            .select('is_admin')
            .eq('id', callingUser.id)
            .single();

        if (adminCheckError || !adminCheckData?.is_admin) {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const { userId } = payload;
        await supabaseAdminClient.from('policies').delete().eq('user_id', userId);
        await supabaseAdminClient.from('claims').delete().eq('user_id', userId);
        await supabaseAdminClient.from('transactions').delete().eq('user_id', userId);
        await supabaseAdminClient.from('users').delete().eq('id', userId);
        result = await supabaseAdminClient.auth.admin.deleteUser(userId);
        break;
      case 'trigger_claim':
        const triggerUserId = payload.userId;
        const triggerPolicyId = payload.policyId;
        const triggerEventData = payload.eventData || {};

        // Basic check: Ensure the calling user is an admin
        const { data: callerUser } = await supabaseClientForUserCheck.auth.getUser();
        const { data: callerProfile, error: callerProfileError } = await supabaseAdminClient.from('users').select('is_admin').eq('id', callerUser.id).single();
        if (callerProfileError || !callerProfile?.is_admin) {
            return new Response(JSON.stringify({ error: 'Forbidden: Admin access required to trigger claims' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        // Get policy details to determine payout
        const { data: policyData, error: policyError } = await supabaseAdminClient
            .from('policies')
            .select('cost, coverage_amount')
            .eq('id', triggerPolicyId)
            .single();

        if (policyError || !policyData) {
            throw new Error('Policy not found or could not retrieve details for claim triggering.');
        }

        // Insert claim record
        const { data: newClaim, error: claimError } = await supabaseAdminClient.from('claims').insert([
            {
                policy_id: triggerPolicyId,
                user_id: triggerUserId,
                status: 'approved', // Manually triggered claims are approved for now
                event_data: triggerEventData,
                event_hash: Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15), // Simple hash
                payout_amount: policyData.coverage_amount || policyData.cost, // Payout is coverage or cost
                confidence_score: 100, // Manual trigger, so high confidence
                processed_at: new Date().toISOString()
            }
        ]).select().single(); // Select the inserted claim

        if (claimError) throw claimError;

        // Update user's wallet balance (payout)
        const { data: userProfile, error: userProfileError } = await supabaseAdminClient.from('users').select('wallet_balance').eq('id', triggerUserId).single();
        if (userProfileError || !userProfile) {
            throw new Error('User profile not found for payout.');
        }
        const newWalletBalance = userProfile.wallet_balance + (newClaim.payout_amount || 0);
        await supabaseAdminClient.from('users').update({ wallet_balance: newWalletBalance }).eq('id', triggerUserId);

        // Record transaction
        await supabaseAdminClient.from('transactions').insert([
            {
                user_id: triggerUserId,
                amount: newClaim.payout_amount,
                type: 'payout',
                description: `Claim payout for policy ${triggerPolicyId}`,
                blockchain_hash: newClaim.event_hash,
                created_at: new Date().toISOString()
            }
        ]);

        result = { claim: newClaim, message: "Claim triggered and processed successfully!" };
        break;
      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify(result), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error("Edge Function Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});