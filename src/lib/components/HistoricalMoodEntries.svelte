<script>
  import { onMount } from 'svelte'
  import { user } from '$lib/stores/auth.js'
  import { getMoodHistory } from '$lib/stores/mood.js'
  import { ChevronDown, ChevronUp, Calendar, Clock } from '@lucide/svelte'

  let moodHistory = []
  let loading = true
  let groupedEntries = {}
  let expandedDates = new Set()

  onMount(async () => {
    if ($user) {
      await loadMoodHistory()
    }
  })

  async function loadMoodHistory() {
    loading = true
    try {
      const { data } = await getMoodHistory($user.id)
      moodHistory = data || []
      groupedEntries = groupEntriesByDate(moodHistory)
    } catch (error) {
      console.error('Error loading mood history:', error)
    } finally {
      loading = false
    }
  }

  function groupEntriesByDate(entries) {
    const grouped = {}
    entries.forEach(entry => {
      const date = new Date(entry.created_at).toDateString()
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(entry)
    })
    return grouped
  }

  function toggleDateExpansion(date) {
    if (expandedDates.has(date)) {
      expandedDates.delete(date)
    } else {
      expandedDates.add(date)
    }
    expandedDates = new Set(expandedDates) // Trigger reactivity
  }

  function formatDate(dateString) {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(today.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'short', 
        month: 'short', 
        day: 'numeric' 
      })
    }
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  function getMoodName(emoji) {
    const moodNames = {
      '😊': 'Happy',
      '😌': 'Calm',
      '😢': 'Sad',
      '😠': 'Angry',
      '😰': 'Anxious',
      '😴': 'Tired',
      '🤗': 'Loved',
      '😤': 'Frustrated'
    }
    return moodNames[emoji] || 'Unknown'
  }
</script>

<div class="historical-mood-entries">
  <div class="flex items-center space-x-3 mb-4">
    <Calendar size={20} class="text-primary-600" />
    <h3 class="text-lg font-bold text-gray-800">Mood History</h3>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else if Object.keys(groupedEntries).length === 0}
    <div class="text-center py-8 text-gray-500">
      <Calendar size={48} class="mx-auto mb-4 opacity-50" />
      <p>No mood entries yet</p>
      <p class="text-sm">Start tracking your mood to see your history here</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each Object.entries(groupedEntries) as [date, entries]}
        <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <!-- Date Header -->
          <button
            on:click={() => toggleDateExpansion(date)}
            class="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center space-x-3">
              <div class="text-2xl">{entries[0].mood}</div>
              <div>
                <div class="font-semibold text-gray-800">{formatDate(date)}</div>
                <div class="text-sm text-gray-500">
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <!-- Mood summary for the day -->
              <div class="flex space-x-1">
                {#each [...new Set(entries.map(e => e.mood))] as mood}
                  <span class="text-lg">{mood}</span>
                {/each}
              </div>
              
              {#if expandedDates.has(date)}
                <ChevronUp size={20} class="text-gray-400" />
              {:else}
                <ChevronDown size={20} class="text-gray-400" />
              {/if}
            </div>
          </button>

          <!-- Expanded Entries -->
          {#if expandedDates.has(date)}
            <div class="border-t border-gray-100">
              {#each entries as entry, index}
                <div class="p-4 {index > 0 ? 'border-t border-gray-50' : ''} hover:bg-gray-25 transition-colors">
                  <div class="flex items-start space-x-4">
                    <div class="text-3xl">{entry.mood}</div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-2">
                        <div class="font-medium text-gray-800">{getMoodName(entry.mood)}</div>
                        <div class="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock size={14} />
                          <span>{formatTime(entry.created_at)}</span>
                        </div>
                      </div>
                      
                      {#if entry.category}
                        <div class="inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full mb-2">
                          {entry.category}
                        </div>
                      {/if}
                      
                      {#if entry.description}
                        <p class="text-gray-600 text-sm leading-relaxed">{entry.description}</p>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .historical-mood-entries {
    @apply bg-gray-50 rounded-2xl p-6 border border-gray-200;
  }
</style>