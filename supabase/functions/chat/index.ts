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

    const { message } = await req.json();

    if (!message) {
      return new Response(
        JSON.stringify({ error: 'Message is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Enhanced AI responses for mental wellness coaching
    const aiResponses = [
      "I understand you're feeling this way. Let's explore what might be contributing to these feelings. Can you tell me more about what's been on your mind lately?",
      "That sounds challenging. Remember that it's completely normal to experience these emotions. What usually helps you feel more centered?",
      "Thank you for sharing that with me. It takes courage to open up about our feelings. Have you tried any mindfulness techniques that resonate with you?",
      "I hear you. Sometimes our minds can feel overwhelming. Would you like to try a brief breathing exercise together, or would you prefer to talk more about what's troubling you?",
      "Your feelings are valid and important. It's wonderful that you're taking time to check in with yourself. What would feel most supportive for you right now?",
      "That's a great insight. Self-awareness is the first step toward positive change. How do you think we could build on this understanding?",
      "I appreciate you trusting me with your thoughts. Mental wellness is a journey, and every step counts. What small action could you take today to nurture your wellbeing?",
      "It sounds like you're going through a lot right now. Remember that seeking support is a sign of strength, not weakness. How can I best support you today?",
      "I notice you mentioned feeling stressed. Stress is our body's natural response to challenges. Have you tried any relaxation techniques like deep breathing or progressive muscle relaxation?",
      "That's wonderful that you're taking steps toward better mental health. Consistency is key in building healthy habits. What motivates you to continue this journey?",
      "I can sense the effort you're putting into understanding yourself better. This kind of self-reflection is incredibly valuable. What patterns have you noticed in your thoughts or feelings?",
      "It's okay to have difficult days. They're part of the human experience. What are some things that have helped you get through tough times before?",
      "Your awareness of your emotional state is really impressive. Many people struggle to identify their feelings. How do you think this awareness can help you moving forward?",
      "I'm glad you feel comfortable sharing with me. Creating a safe space for our thoughts and feelings is so important. Is there anything specific you'd like to explore today?",
      "That sounds like a positive step forward. Celebrating small victories is important for maintaining motivation. How does it feel to acknowledge this progress?"
    ];

    // Generate contextual AI response
    let aiResponse = aiResponses[Math.floor(Math.random() * aiResponses.length)];
    
    // Add some context-aware responses
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes('anxious') || lowerMessage.includes('anxiety')) {
      aiResponse = "I understand that anxiety can feel overwhelming. It's your mind's way of trying to protect you, even when there might not be immediate danger. Have you tried grounding techniques like the 5-4-3-2-1 method? It can help bring you back to the present moment.";
    } else if (lowerMessage.includes('sad') || lowerMessage.includes('depressed')) {
      aiResponse = "I hear that you're feeling sad, and I want you to know that these feelings are valid. Sadness is a natural human emotion, and it's okay to sit with it. Sometimes talking about what's contributing to these feelings can help. What's been weighing on your heart lately?";
    } else if (lowerMessage.includes('meditation') || lowerMessage.includes('meditate')) {
      aiResponse = "Meditation is a wonderful practice for mental wellness! Even just a few minutes daily can make a significant difference. Are you new to meditation, or are you looking to deepen your existing practice? I can guide you through some simple techniques to get started.";
    } else if (lowerMessage.includes('stress')) {
      aiResponse = "Stress is something we all experience, and it sounds like you're dealing with quite a bit right now. The good news is that there are many effective ways to manage stress. Have you tried any stress-reduction techniques like deep breathing, progressive muscle relaxation, or mindful walking?";
    } else if (lowerMessage.includes('happy') || lowerMessage.includes('good') || lowerMessage.includes('great')) {
      aiResponse = "It's wonderful to hear that you're feeling positive! These moments of happiness and contentment are precious. What do you think contributed to this good feeling? Recognizing these patterns can help you cultivate more joy in your daily life.";
    } else if (lowerMessage.includes('tired') || lowerMessage.includes('exhausted')) {
      aiResponse = "Feeling tired can be both physical and emotional. It's important to listen to what your body and mind are telling you. Are you getting enough quality sleep? Sometimes fatigue can also be a sign that we need to recharge emotionally or set better boundaries.";
    }

    // Save conversation to database
    const { data, error } = await supabaseClient
      .from('chat_conversations')
      .insert({
        user_id: user.id,
        user_message: message,
        ai_response: aiResponse
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save conversation' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        response: aiResponse,
        conversation: data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});