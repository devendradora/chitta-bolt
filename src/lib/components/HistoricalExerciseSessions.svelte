<script>
  import { onMount } from 'svelte'
  import { user } from '$lib/stores/auth.js'
  import { supabase, makeAuthenticatedRequest } from '$lib/supabase.js'
  import { ChevronDown, ChevronUp, Calendar, Clock, Dumbbell, Flame, RotateCcw } from '@lucide/svelte'

  let exerciseHistory = []
  let loading = true
  let groupedSessions = {}
  let expandedDates = new Set()

  onMount(async () => {
    if ($user) {
      await loadExerciseHistory()
    }
  })

  async function loadExerciseHistory() {
    loading = true
    try {
      const result = await makeAuthenticatedRequest(() => 
        supabase
          .from('exercise_sessions')
          .select('*')
          .eq('user_id', $user.id)
          .order('created_at', { ascending: false })
      )

      exerciseHistory = result.data || []
      groupedSessions = groupSessionsByDate(exerciseHistory)
    } catch (error) {
      console.error('Error loading exercise history:', error)
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

  function getExerciseTypeIcon(type) {
    if (type === 'yoga') return '🧘‍♀️'
    if (type === 'cardio') return '🏃‍♂️'
    if (type === 'strength') return '💪'
    return '🏋️‍♀️'
  }

  function getTotalCalories(sessions) {
    return sessions.reduce((total, session) => total + (session.calories_burned || 0), 0)
  }

  function getTotalDuration(sessions) {
    return sessions.reduce((total, session) => total + (session.duration_seconds || 0), 0)
  }
</script>

<div class="historical-exercise-sessions">
  <div class="flex items-center space-x-3 mb-4">
    <Dumbbell size={20} class="text-primary-600" />
    <h3 class="text-lg font-bold text-gray-800">Exercise History</h3>
  </div>

  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  {:else if Object.keys(groupedSessions).length === 0}
    <div class="text-center py-8 text-gray-500">
      <Dumbbell size={48} class="mx-auto mb-4 opacity-50" />
      <p>No exercise sessions yet</p>
      <p class="text-sm">Start exercising to see your history here</p>
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
              <div class="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <Dumbbell size={20} class="text-white" />
              </div>
              <div>
                <div class="font-semibold text-gray-800">{formatDate(date)}</div>
                <div class="text-sm text-gray-500">
                  {sessions.length} {sessions.length === 1 ? 'workout' : 'workouts'} • {formatDuration(getTotalDuration(sessions))}
                </div>
              </div>
            </div>
            
            <div class="flex items-center space-x-2">
              <!-- Session summary -->
              <div class="text-right">
                <div class="text-sm font-medium text-gray-800">{getTotalCalories(sessions)} cal</div>
                <div class="text-xs text-gray-500">{formatDuration(getTotalDuration(sessions))}</div>
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
                    <div class="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                      <span class="text-white text-sm">{getExerciseTypeIcon(session.exercise_type)}</span>
                    </div>
                    <div class="flex-1">
                      <div class="flex items-center justify-between mb-2">
                        <div class="font-medium text-gray-800">
                          {session.exercise_name}
                        </div>
                        <div class="flex items-center space-x-1 text-sm text-gray-500">
                          <Clock size={14} />
                          <span>{formatTime(session.created_at)}</span>
                        </div>
                      </div>
                      
                      <div class="grid grid-cols-3 gap-2 mb-2">
                        <div class="flex items-center space-x-1 text-xs text-gray-600">
                          <Clock size={12} />
                          <span>{formatDuration(session.duration_seconds)}</span>
                        </div>
                        
                        <div class="flex items-center space-x-1 text-xs text-gray-600">
                          <RotateCcw size={12} />
                          <span>{session.rounds_completed}/{session.total_rounds} rounds</span>
                        </div>
                        
                        <div class="flex items-center space-x-1 text-xs text-gray-600">
                          <Flame size={12} />
                          <span>{session.calories_burned} cal</span>
                        </div>
                      </div>
                      
                      {#if session.notes}
                        <p class="text-gray-600 text-sm leading-relaxed">{session.notes}</p>
                      {/if}
                      
                      <div class="flex items-center space-x-2 mt-2">
                        <span class="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                          {session.exercise_type}
                        </span>
                        
                        {#if session.rounds_completed === session.total_rounds}
                          <span class="inline-block px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            Completed
                          </span>
                        {:else}
                          <span class="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                            Partial ({session.rounds_completed}/{session.total_rounds})
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
  .historical-exercise-sessions {
    @apply bg-gray-50 rounded-2xl p-6 border border-gray-200;
  }
</style>