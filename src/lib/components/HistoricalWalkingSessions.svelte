<script>
  import { onMount } from 'svelte'
  import { user } from '$lib/stores/auth.js'
  import { supabase, makeAuthenticatedRequest } from '$lib/supabase.js'
  import { ChevronDown, ChevronUp, Calendar, Clock, Footprints, Flame } from '@lucide/svelte'

  let walkingHistory = []
  let loading = true
  let groupedSessions = {}
  let expandedDates = new Set()

  onMount(async () => {
    if ($user) {
      await loadWalkingHistory()
    }
  })

  async function loadWalkingHistory() {
    loading = true
    try {
      const result = await makeAuthenticatedRequest(() => 
        supabase
          .from('walking_sessions')
          .select('*')
          .eq('user_id', $user.id)
          .order('created_at', { ascending: false })
      )

      walkingHistory = result.data || []
      groupedSessions = groupSessionsByDate(walkingHistory)
    } catch (error) {
      console.error('Error loading walking history:', error)
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

  function formatDuration(seconds) {
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`
  }

  function formatDistance(km) {
    return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(2)}km`
  }

  function getTotalSteps(sessions) {
    return sessions.reduce((total, session) => total + (session.steps || 0), 0)
  }

  function getTotalDistance(sessions) {
    return sessions.reduce((total, session) => total + (session.distance_km || 0), 0)
  }
</script>

<div class="historical-walking-sessions">
  <div class="flex items-center space-x-3 mb-4">
    <Footprints size={20} class="text-primary-600" />
    <h3 class="text-lg font-bold text-gray-800">Walking History</h3>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else if Object.keys(groupedSessions).length === 0}
    <div class="text-center py-8 text-gray-500">
      <Footprints size={48} class="mx-auto mb-4 opacity-50" />
      <p>No walking sessions yet</p>
      <p class="text-sm">Start tracking your steps to see your history here</p>
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
              <div class="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <Footprints size={20} class="text-white" />
              </div>
              <div>
                <div class="font-semibold text-gray-800">{formatDate(date)}</div>
                <div class="text-sm text-gray-500">
                  {sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} • {getTotalSteps(sessions).toLocaleString()} steps
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <!-- Session summary -->
              <div class="text-right">
                <div class="text-sm font-medium text-gray-800">{formatDistance(getTotalDistance(sessions))}</div>
                <div class="text-xs text-gray-500">{getTotalSteps(sessions).toLocaleString()} steps</div>
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
                    <div class="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <Footprints size={16} class="text-white" />
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-2">
                        <div class="font-medium text-gray-800">
                          {session.steps.toLocaleString()} Steps
                        </div>
                        <div class="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock size={14} />
                          <span>{formatTime(session.created_at)}</span>
                        </div>
                      </div>
                      
                      <div class="grid grid-cols-3 gap-2 mb-2">
                        <div class="flex items-center space-x-1 text-xs text-gray-600">
                          <Footprints size={12} />
                          <span>{formatDistance(session.distance_km)}</span>
                        </div>
                        
                        <div class="flex items-center space-x-1 text-xs text-gray-600">
                          <Clock size={12} />
                          <span>{formatDuration(session.duration_seconds)}</span>
                        </div>
                        
                        <div class="flex items-center space-x-1 text-xs text-gray-600">
                          <Flame size={12} />
                          <span>{session.calories_burned} cal</span>
                        </div>
                      </div>
                      
                      <div class="flex items-center space-x-2 mt-2">
                        <span class="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                          Completed
                        </span>
                        
                        {#if session.start_time && session.end_time}
                          <span class="text-xs text-gray-500">
                            {formatTime(session.start_time)} - {formatTime(session.end_time)}
                          </span>
                        {/if}
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
  .historical-walking-sessions {
    @apply bg-gray-50 rounded-2xl p-6 border border-gray-200;
  }
</style>