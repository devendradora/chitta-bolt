<script>
  import '../app.css'
  import { user, loading } from '$lib/stores/auth.js'
  import { initializeSubscription } from '$lib/stores/subscription.js'
  import LandingPage from '$lib/components/LandingPage.svelte'
  import BottomNav from '$lib/components/BottomNav.svelte'
  import Header from '$lib/components/Header.svelte'
  import AchievementCelebration from '$lib/components/AchievementCelebration.svelte'
  import { onMount } from 'svelte'

  /** @type {{children: import('svelte').Snippet}} */
  let { children } = $props()

  // Use Svelte 5 $state() for reactivity
  let mounted = $state(false)
  let authTimeout = $state(null)

  onMount(() => {
    mounted = true
    console.log('Layout mounted, auth loading:', $loading, 'user:', $user?.id)
    
    // Initialize subscription system
    initializeSubscription()
    
    // Set a timeout to prevent infinite loading (increased to 20 seconds)
    authTimeout = setTimeout(() => {
      if ($loading) {
        console.log('Auth loading timeout - forcing to show login')
        loading.set(false)
      }
    }, 20000) // Increased from 10 seconds to 20 seconds
    
    // Clear timeout when loading completes
    const unsubscribe = loading.subscribe(isLoading => {
      if (!isLoading && authTimeout) {
        clearTimeout(authTimeout)
        authTimeout = null
      }
    })
    
    return () => {
      unsubscribe()
      if (authTimeout) {
        clearTimeout(authTimeout)
      }

    }
  })
</script>

{#if !mounted}
  <!-- Initial loading while component mounts -->
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-400 via-green-500 to-teal-600">
    <div class="text-center space-y-4">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
      <p class="text-white text-lg">Loading Chitta...</p>
    </div>
  </div>
{:else if $loading}
  <!-- Auth loading with timeout protection -->
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-400 via-green-500 to-teal-600">
    <div class="text-center space-y-4">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
      <p class="text-white text-lg">Checking authentication...</p>
      <p class="text-white/80 text-sm">This should only take a moment</p>
    </div>
  </div>
{:else if !$user}
  <!-- Show landing page with auth form if not authenticated -->
  <LandingPage />
{:else}
  <!-- Show main app if authenticated -->
  <div class="min-h-screen bg-gray-50">
    <Header />
    <div class="pt-20 pb-20">
      {@render children()}
    </div>
    <BottomNav />
    
    <!-- Achievement Celebration Modal -->
    <AchievementCelebration />
  </div>
{/if}