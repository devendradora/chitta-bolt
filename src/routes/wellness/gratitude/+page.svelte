<script>
  import { onMount } from 'svelte'
  import { ArrowLeft, Camera, Heart, Calendar, Clock, Check, Plus, Edit3, Trash2 } from '@lucide/svelte'
  import { goto } from '$app/navigation'
  import { user } from '$lib/stores/auth.js'
  import { supabase, makeAuthenticatedRequest } from '$lib/supabase.js'
  import TextToSpeechPlayer from '$lib/components/TextToSpeechPlayer.svelte'

  let gratitudeEntries = []
  let newEntry = ''
  let isAddingEntry = false
  let loading = true
  let error = ''
  let selectedEntry = null
  let showEntryDetails = false
  let gratitudePrompts = [
    "What made you smile today?",
    "Name three things you're thankful for right now",
    "Who has positively impacted your life recently?",
    "What's something beautiful you noticed today?",
    "What's a challenge you're grateful to have overcome?",
    "What's a small pleasure you enjoyed today?",
    "What's something you're looking forward to?",
    "What's a quality in yourself you're grateful for?",
    "What's something you learned recently?",
    "What's a comfort or convenience you often take for granted?"
  ]
  let currentPrompt = gratitudePrompts[Math.floor(Math.random() * gratitudePrompts.length)]

  // Gratitude practice text
  const gratitudePracticeText = `Gratitude is a powerful practice that can transform your mental wellbeing. Taking time to acknowledge the good things in your life, no matter how small, can shift your perspective and increase your overall happiness.

When we practice gratitude regularly, we train our minds to notice the positive aspects of our lives that we might otherwise take for granted. This simple shift in attention can have profound effects on our mood, stress levels, and even physical health.

Research has shown that consistent gratitude practice can:

• Improve sleep quality
• Reduce stress and anxiety
• Enhance feelings of connection with others
• Increase resilience during challenging times
• Boost overall life satisfaction

To get the most benefit from your gratitude practice:

1. Be specific about what you're grateful for
2. Focus on people rather than just things
3. Consider what your life would be like without certain blessings
4. Record surprising or unexpected events that made you grateful
5. Commit to daily practice, even when it feels difficult

Remember that gratitude isn't about ignoring life's difficulties or challenges. Rather, it's about acknowledging that even amid struggles, there are still things to appreciate. This balanced perspective helps build resilience and emotional wellbeing.

As you write your gratitude entries, try to really feel the emotion of appreciation. Take a moment to savor the positive feelings that arise when you reflect on the good things in your life, no matter how small they might seem.`

  onMount(async () => {
    if ($user) {
      await loadGratitudeEntries()
    }
  })

  async function loadGratitudeEntries() {
    if (!$user) return
    
    loading = true
    error = ''
    
    try {
      // This is a mock implementation since we don't have a gratitude_entries table
      // In a real implementation, you would fetch from the database
      
      // Simulate loading from database with a delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Sample entries
      gratitudeEntries = [
        {
          id: '1',
          content: 'I\'m grateful for the warm cup of tea I had this morning. The simple pleasure of holding the warm mug and enjoying the aroma helped me start my day with a moment of peace.',
          created_at: new Date(Date.now() - 86400000).toISOString() // yesterday
        },
        {
          id: '2',
          content: 'Today I\'m thankful for my friend who called just to check in. Their thoughtfulness reminded me that I\'m not alone, even when life gets busy.',
          created_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
        },
        {
          id: '3',
          content: 'I\'m grateful for the beautiful sunset I witnessed today. The vibrant colors in the sky were a reminder of the natural beauty that surrounds us every day.',
          created_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
        }
      ]
    } catch (err) {
      console.error('Error loading gratitude entries:', err)
      error = 'Failed to load your gratitude entries'
    } finally {
      loading = false
    }
  }

  async function addGratitudeEntry() {
    if (!$user || !newEntry.trim()) return
    
    isAddingEntry = true
    error = ''
    
    try {
      // This is a mock implementation
      // In a real implementation, you would save to the database
      
      // Simulate saving to database with a delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const newEntryObj = {
        id: Date.now().toString(),
        content: newEntry.trim(),
        created_at: new Date().toISOString()
      }
      
      gratitudeEntries = [newEntryObj, ...gratitudeEntries]
      newEntry = ''
      
      // Get a new prompt
      currentPrompt = gratitudePrompts[Math.floor(Math.random() * gratitudePrompts.length)]
    } catch (err) {
      console.error('Error adding gratitude entry:', err)
      error = 'Failed to save your gratitude entry'
    } finally {
      isAddingEntry = false
    }
  }

  function selectEntry(entry) {
    selectedEntry = entry
    showEntryDetails = true
  }

  function backToList() {
    showEntryDetails = false
    selectedEntry = null
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  function formatTime(dateString) {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
</script>

<svelte:head>
  <title>Gratitude Practice - Chitta</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 px-4 py-6">
  <!-- Header -->
  {#if !showEntryDetails}
    <div class="flex items-center justify-between mb-8">
      <button 
        on:click={() => goto('/wellness')} 
        class="p-3 rounded-2xl hover:bg-white/70 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <ArrowLeft size={24} class="text-gray-600" />
      </button>
      <h1 class="text-2xl font-bold text-gray-800">Gratitude Practice</h1>
      <div class="w-12"></div>
    </div>
  {/if}

  <div class="max-w-4xl mx-auto">
    {#if showEntryDetails && selectedEntry}
      <!-- Entry Details View -->
      <div class="bg-white rounded-3xl p-6 shadow-lg border border-amber-100">
        <div class="flex items-center space-x-3 mb-6">
          <button 
            on:click={backToList}
            class="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} class="text-gray-600" />
          </button>
          <h2 class="text-xl font-bold text-gray-800">Gratitude Entry</h2>
        </div>
        
        <div class="flex items-center space-x-3 text-gray-600 mb-6">
          <Calendar size={16} />
          <span>{formatDate(selectedEntry.created_at)}</span>
          <Clock size={16} class="ml-2" />
          <span>{formatTime(selectedEntry.created_at)}</span>
        </div>
        
        <!-- Text-to-Speech Player -->
        <div class="mb-6">
          <TextToSpeechPlayer text={selectedEntry.content} />
        </div>
        
        <!-- Entry Content -->
        <div class="bg-amber-50 rounded-2xl p-6 border border-amber-200">
          <p class="text-gray-700 leading-relaxed whitespace-pre-line">
            {selectedEntry.content}
          </p>
        </div>
        
        <!-- Actions -->
        <div class="flex justify-end mt-6 space-x-3">
          <button class="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors">
            <Edit3 size={16} />
            <span>Edit</span>
          </button>
          <button class="flex items-center space-x-2 px-4 py-2 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-colors">
            <Trash2 size={16} />
            <span>Delete</span>
          </button>
        </div>
      </div>
    {:else}
      <!-- Gratitude List View -->
      <div class="space-y-6">
        <!-- Gratitude Practice Info -->
        <div class="bg-white rounded-3xl p-6 shadow-lg border border-amber-100">
          <div class="flex items-center space-x-4 mb-4">
            <div class="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full flex items-center justify-center">
              <Heart size={24} class="text-white" />
            </div>
            <div>
              <h2 class="text-xl font-bold text-gray-800">Gratitude Practice</h2>
              <p class="text-gray-600 text-sm">Cultivate appreciation for life's gifts</p>
            </div>
          </div>
          
          <!-- Text-to-Speech Player -->
          <div class="mb-4">
            <TextToSpeechPlayer text={gratitudePracticeText} />
          </div>
          
          <div class="prose prose-sm max-w-none text-gray-700">
            <p>
              Gratitude is a powerful practice that can transform your mental wellbeing. Taking time to acknowledge the good things in your life, no matter how small, can shift your perspective and increase your overall happiness.
            </p>
            <p>
              When we practice gratitude regularly, we train our minds to notice the positive aspects of our lives that we might otherwise take for granted. This simple shift in attention can have profound effects on our mood, stress levels, and even physical health.
            </p>
            <p>
              Research has shown that consistent gratitude practice can:
            </p>
            <ul>
              <li>Improve sleep quality</li>
              <li>Reduce stress and anxiety</li>
              <li>Enhance feelings of connection with others</li>
              <li>Increase resilience during challenging times</li>
              <li>Boost overall life satisfaction</li>
            </ul>
          </div>
        </div>
        
        <!-- Add New Entry -->
        <div class="bg-white rounded-3xl p-6 shadow-lg border border-amber-100">
          <h3 class="font-bold text-gray-800 mb-4">Add Today's Gratitude</h3>
          
          <!-- Prompt -->
          <div class="bg-amber-50 rounded-xl p-4 border border-amber-200 mb-4">
            <p class="text-amber-800 font-medium">{currentPrompt}</p>
          </div>
          
          <textarea
            bind:value={newEntry}
            placeholder="What are you grateful for today?"
            class="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all resize-none"
            rows="4"
          ></textarea>
          
          <button
            on:click={addGratitudeEntry}
            disabled={!newEntry.trim() || isAddingEntry}
            class="mt-4 w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-semibold hover:from-amber-600 hover:to-orange-600 transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {#if isAddingEntry}
              <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Saving...</span>
            {:else}
              <Plus size={20} />
              <span>Add Gratitude Entry</span>
            {/if}
          </button>
        </div>
        
        <!-- Entries List -->
        <div class="bg-white rounded-3xl p-6 shadow-lg border border-amber-100">
          <h3 class="font-bold text-gray-800 mb-4">Your Gratitude Journal</h3>
          
          {#if loading}
            <div class="flex items-center justify-center py-12">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
            </div>
          {:else if error}
            <div class="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
              {error}
            </div>
          {:else if gratitudeEntries.length === 0}
            <div class="text-center py-12 text-gray-500">
              <Heart size={48} class="mx-auto mb-4 opacity-50" />
              <p>No gratitude entries yet</p>
              <p class="text-sm mt-2">Start your gratitude practice today</p>
            </div>
          {:else}
            <div class="space-y-4">
              {#each gratitudeEntries as entry}
                <button
                  on:click={() => selectEntry(entry)}
                  class="w-full text-left bg-amber-50 rounded-xl p-4 border border-amber-200 hover:bg-amber-100 transition-colors"
                >
                  <p class="text-gray-700 line-clamp-2 mb-2">{entry.content}</p>
                  <div class="flex items-center text-amber-700 text-sm">
                    <Calendar size={14} class="mr-1" />
                    <span>{formatDate(entry.created_at)}</span>
                  </div>
                </button>
              {/each}
            </div>
          {/if}
        </div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Line clamp for truncating text */
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>