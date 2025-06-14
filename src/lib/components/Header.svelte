<script>
  import { user } from '$lib/stores/auth.js'
  import { Brain } from '@lucide/svelte'

  function getUserName() {
    if ($user?.user_metadata?.full_name) {
      return $user.user_metadata.full_name.split(' ')[0]
    }
    return $user?.email?.split('@')[0] || 'User'
  }
</script>

<header class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-gray-200/50 px-4 py-3 shadow-lg">
  <div class="flex items-center justify-between max-w-7xl mx-auto">
    <!-- App Logo and Name -->
    <div class="flex items-center space-x-3">
      <div class="bg-gradient-to-r from-primary-500 to-secondary-500 p-2 rounded-xl shadow-lg">
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

    <!-- Bolt.new White Circle Badge in Top Right -->
    <a 
      href="https://bolt.new" 
      target="_blank" 
      rel="noopener noreferrer"
      class="hover:opacity-80 transition-opacity duration-300 transform hover:scale-105"
    >
      <img 
        src="/src/lib/images/white_circle_360x360.png" 
        alt="Made with Bolt.new" 
        class="h-12 w-12"
      />
    </a>
  </div>
</header>