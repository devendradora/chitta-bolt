<script>
  import { user } from '$lib/stores/auth.js'
  import { Brain } from '@lucide/svelte'
  import { goto } from '$app/navigation'
  
  async function handleSignOut() {
    const { signOut } = await import('$lib/stores/auth.js')
    const { error: signOutError } = await signOut()
    if (!signOutError) {
      goto('/')
    }
  }

  function getUserName() {
    if ($user?.user_metadata?.full_name) {
      return $user.user_metadata.full_name.split(' ')[0]
    }
    if ($user?.user_metadata?.name) {
      return $user.user_metadata.name.split(' ')[0]
    }
    return $user?.email?.split('@')[0] || 'User'
  }
</script>

<header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 px-4 py-3 shadow-lg">
  <div class="flex items-center justify-between max-w-7xl mx-auto">
    <!-- App Logo and Name -->
    <div class="flex items-center space-x-3">
      <div class="bg-gradient-to-r from-primary-500 to-secondary-500 p-2 rounded-xl shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl hover:animate-pulse">
        <Brain class="text-white" size={24} />
      </div>
      <div>
        <h1 class="text-xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
          Chitta
        </h1>
        {#if $user}
          <p class="text-xs text-gray-500 font-medium">Welcome, {getUserName()}!</p>
        {:else}
          <p class="text-xs text-gray-500 font-medium">Mental Wellness Companion</p>
        {/if}
      </div>
    </div>

    <!-- Right side controls -->
    <div class="flex items-center space-x-4">
      {#if $user}
        <!-- Logout Button -->
        <button 
          on:click|preventDefault={handleSignOut}
          class="p-2 rounded-full hover:bg-gray-100 transition-colors duration-200 text-gray-600 hover:text-red-500"
          aria-label="Logout"
          title="Logout"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      {/if}
      
      <!-- Bolt.new Badge -->
      <a 
        href="https://bolt.new" 
        target="_blank" 
        rel="noopener noreferrer"
        class="hover:opacity-80 transition-opacity duration-300 transform hover:scale-105"
      >
        <img 
          src="/images/white_circle_360x360.png" 
          alt="Made with Bolt.new" 
          class="h-10 w-10 md:h-12 md:w-12"
        />
      </a>
    </div>
  </div>
</header>