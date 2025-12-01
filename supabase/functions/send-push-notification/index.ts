/**
 * Supabase Edge Function: Send Push Notification
 *
 * Sends push notifications to children when parent misses medication
 * Uses Expo Push API
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const EXPO_PUSH_URL = 'https://exp.host/--/api/v2/push/send';

interface PushMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: string;
  badge?: number;
  priority?: 'default' | 'normal' | 'high';
}

interface RequestBody {
  parent_id: string;
  medication_name: string;
  scheduled_time: string;
  skip_reason?: string;
  event_id: string;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body: RequestBody = await req.json();
    const { parent_id, medication_name, scheduled_time, skip_reason, event_id } = body;

    if (!parent_id || !medication_name || !event_id) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get parent's name
    const { data: parentData } = await supabaseClient
      .from('users')
      .select('name')
      .eq('id', parent_id)
      .single();

    const parentName = parentData?.name || '부모님';

    // Get children's push tokens using the helper function
    const { data: childrenTokens, error: tokensError } = await supabaseClient
      .rpc('get_children_push_tokens', { parent_user_id: parent_id });

    if (tokensError) {
      console.error('Error getting children tokens:', tokensError);
      return new Response(
        JSON.stringify({ error: 'Failed to get children tokens' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!childrenTokens || childrenTokens.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No children with push tokens found' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format time for display
    const timeDate = new Date(scheduled_time);
    const formattedTime = `${timeDate.getHours().toString().padStart(2, '0')}:${timeDate.getMinutes().toString().padStart(2, '0')}`;

    // Prepare push messages
    const messages: PushMessage[] = childrenTokens
      .filter((child: { push_token: string; missed_alert_enabled: boolean }) =>
        child.push_token && child.missed_alert_enabled
      )
      .map((child: { push_token: string }) => ({
        to: child.push_token,
        title: `${parentName}님 복약 알림`,
        body: skip_reason
          ? `${formattedTime} ${medication_name} 복용을 건너뛰었습니다. (사유: ${skip_reason})`
          : `${formattedTime} ${medication_name} 복용을 건너뛰었습니다.`,
        data: {
          type: 'missed_medication',
          event_id,
          parent_id,
          medication_name,
          scheduled_time,
        },
        sound: 'default',
        priority: 'high' as const,
      }));

    if (messages.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No children with notifications enabled' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Send push notifications via Expo Push API
    const pushResponse = await fetch(EXPO_PUSH_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });

    const pushResult = await pushResponse.json();

    // Update missed_medication_event as notified
    await supabaseClient
      .from('missed_medication_events')
      .update({ notified: true })
      .eq('id', event_id);

    return new Response(
      JSON.stringify({
        success: true,
        sent_count: messages.length,
        expo_response: pushResult,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error sending push notification:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
