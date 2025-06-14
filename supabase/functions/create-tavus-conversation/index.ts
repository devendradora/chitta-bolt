const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Import Supabase client
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the request
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { mood, category, context } = await req.json();

    if (!mood) {
      return new Response(
        JSON.stringify({ error: 'Mood is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get Tavus API key from environment
    const tavusApiKey = Deno.env.get('TAVUS_API_KEY');
    if (!tavusApiKey) {
      return new Response(
        JSON.stringify({ error: 'Tavus API key not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create mood-specific persona context
    const moodContexts = {
      '😊': 'You are a warm and enthusiastic wellness coach. The user is feeling happy today. Celebrate their positive mood and help them maintain this energy while exploring what brought them joy.',
      '😌': 'You are a gentle and calming wellness coach. The user is feeling calm and peaceful. Help them appreciate this tranquil state and explore mindfulness practices that enhance their serenity.',
      '😢': 'You are a compassionate and understanding wellness coach. The user is feeling sad today. Provide gentle support, validate their feelings, and offer comfort while exploring healthy ways to process emotions.',
      '😠': 'You are a patient and grounding wellness coach. The user is feeling angry or frustrated. Help them understand their emotions, provide calming techniques, and guide them toward constructive outlets.',
      '😰': 'You are a reassuring and supportive wellness coach. The user is feeling anxious or worried. Offer grounding techniques, breathing exercises, and help them feel safe and supported.',
      '😴': 'You are an understanding and energizing wellness coach. The user is feeling tired or exhausted. Help them explore what might be draining their energy and suggest gentle ways to restore vitality.',
      '🤗': 'You are a warm and affirming wellness coach. The user is feeling loved and appreciated. Help them savor these positive feelings and explore gratitude practices.',
      '😤': 'You are a calm and patient wellness coach. The user is feeling frustrated or overwhelmed. Help them process these feelings and find constructive ways to move forward.'
    };

    const baseContext = moodContexts[mood] || 'You are a supportive wellness coach helping the user explore their current emotional state.';
    const fullContext = category 
      ? `${baseContext} They mentioned this feeling is related to: ${category}. ${context || ''}`
      : `${baseContext} ${context || ''}`;

    // Create Tavus conversation
    const tavusResponse = await fetch('https://tavusapi.com/v2/conversations', {
      method: 'POST',
      headers: {
        'x-api-key': tavusApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        replica_id: Deno.env.get('TAVUS_REPLICA_ID') || 'default-replica-id',
        persona_id: Deno.env.get('TAVUS_PERSONA_ID') || 'default-persona-id',
        conversation_name: `Mood Check-in: ${mood}`,
        custom_greeting: `Hello! I can see you're feeling ${mood} today. I'm here to support you through this moment. How are you doing right now?`,
        properties: {
          max_call_duration: 600, // 10 minutes
          participant_left_timeout: 60,
          participant_absent_timeout: 30,
          enable_recording: false,
          enable_transcription: true,
        },
        callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/tavus-callback`,
        context: fullContext,
      }),
    });

    if (!tavusResponse.ok) {
      const errorText = await tavusResponse.text();
      console.error('Tavus API error:', errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to create Tavus conversation',
          details: errorText 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const tavusData = await tavusResponse.json();

    // Log the conversation creation for analytics
    await supabaseClient
      .from('tavus_conversations')
      .insert({
        user_id: user.id,
        conversation_id: tavusData.conversation_id,
        mood: mood,
        category: category,
        context: context,
        conversation_url: tavusData.conversation_url,
      })
      .catch(error => {
        console.warn('Failed to log Tavus conversation:', error);
        // Don't fail the request if logging fails
      });

    return new Response(
      JSON.stringify({
        success: true,
        conversation_id: tavusData.conversation_id,
        conversation_url: tavusData.conversation_url,
        status: tavusData.status,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error creating Tavus conversation:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});