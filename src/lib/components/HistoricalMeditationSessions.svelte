<script>
  import { onMount } from 'svelte'
  import { user } from '$lib/stores/auth.js'
  import { getMeditationHistory } from '$lib/stores/meditation.js'
  import { ChevronDown, ChevronUp, Calendar, Clock, Brain, Music } from '@lucide/svelte'

  let meditationHistory = []
  let loading = true
  let groupedSessions = {}
  let expandedDates = new Set()

  onMount(async () => {
    if ($user) {
      await loadMeditationHistory()
    }
  })

  async function loadMeditationHistory() {
    loading = true
    try {
      const { data } = await getMeditationHistory($user.id)
      meditationHistory = data || []
      groupedSessions = groupSessionsByDate(meditationHistory)
    } catch (error) {
      console.error('Error loading meditation history:', error)
    } finally {
      loading = false
    }
  }

  function groupSessionsByDate(sessions) {
    const grouped = {}
    sessions.forEach(session => {
      const date = new Date(session.created_at).toDateString()
      if (!grouped[date]) {
        grouped[date] = []
      }
      grouped[date].push(session)
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

  function formatDuration(minutes) {
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  function getMusicName(musicValue) {
    const musicNames = {
      'silence': 'Silence',
      'nature': 'Nature Sounds',
      'ambient': 'Ambient Music',
      'binaural': 'Binaural Beats',
      'bowls': 'Tibetan Bowls',
      'whitenoise': 'White Noise',
      'custom': 'Custom Audio'
    }
    return musicNames[musicValue] || 'Unknown'
  }

  function getTotalMinutes(sessions) {
    return sessions.reduce((total, session) => total + (session.duration_minutes || 0), 0)
  }
</script>

<div class="historical-meditation-sessions">
  <div class="flex items-center space-x-3 mb-4">
    <Brain size={20} class="text-primary-600" />
    <h3 class="text-lg font-bold text-gray-800">Meditation History</h3>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else if Object.keys(groupedSessions).length === 0}
    <div class="text-center py-8 text-gray-500">
      <Brain size={48} class="mx-auto mb-4 opacity-50" />
      <p>No meditation sessions yet</p>
      <p class="text-sm">Start meditating to see your history here</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each Object.entries(groupedSessions) as [date, sessions]}
        <div class="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <!-- Date Header -->
          <button
            on:click={() => toggleDateExpansion(date)}
            class="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
          >
            <div class="flex items-center space-x-3">
              <div class="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Brain size={20} class="text-white" />
              </div>
              <div>
                <div class="font-semibold text-gray-800">{formatDate(date)}</div>
                <div class="text-sm text-gray-500">
                  {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} • {formatDuration(getTotalMinutes(sessions))}
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <!-- Session summary -->
              <div class="text-right">
                <div class="text-sm font-medium text-gray-800">{formatDuration(getTotalMinutes(sessions))}</div>
                <div class="text-xs text-gray-500">{sessions.length} sessions</div>
              </div>
              
              {#if expandedDates.has(date)}
                <ChevronUp size={20} class="text-gray-400" />
              {:else}
                <ChevronDown size={20} class="text-gray-400" />
              {/if}
            </div>
          </button>

          <!-- Expanded Sessions -->
          {#if expandedDates.has(date)}
            <div class="border-t border-gray-100">
              {#each sessions as session, index}
                <div class="p-4 {index > 0 ? 'border-t border-gray-50' : ''} hover:bg-gray-25 transition-colors">
                  <div class="flex items-start space-x-4">
                    <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
                      <Brain size={16} class="text-white" />
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-2">
                        <div class="font-medium text-gray-800">
                          {formatDuration(session.duration_minutes)} Meditation
                        </div>
                        <div class="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock size={14} />
                          <span>{formatTime(session.created_at)}</span>
                        </div>
                      </div>
                      
                      <div class="flex items-center space-x-4 mb-2">
                        {#if session.mood_before}
                          <div class="flex items-center space-x-1">
                            <span class="text-lg">{session.mood_before}</span>
                            <span class="text-xs text-gray-500">before</span>
                          </div>
                        {/if}
                        
                        {#if session.mood_after}
                          <div class="flex items-center space-x-1">
                            <span class="text-lg">{session.mood_after}</span>
                            <span class="text-xs text-gray-500">after</span>
                          </div>
                        {/if}
                        
                        {#if session.background_music && session.background_music !== 'silence'}
                          <div class="flex items-center space-x-1 text-xs text-gray-500">
                            <Music size={12} />
                            <span>{getMusicName(session.background_music)}</span>
                          </div>
                        {/if}
                      </div>
                      
                      {#if session.notes}
                        <p class="text-gray-600 text-sm leading-relaxed">{session.notes}</p>
                      {/if}
                      
                      <div class="flex items-center space-x-2 mt-2">
                        {#if session.completed}
                          <span class="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Completed
                          </span>
                        {:else}
                          <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            Partial
                          </span>
                        {/if}
                        
                        <span class="text-xs text-gray-500">
                          {session.background_theme || 'Default'} theme
                        </span>
                      </div>
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
  .historical-meditation-sessions {
    @apply bg-gray-50 rounded-2xl p-6 border border-gray-200;
  }
</style>