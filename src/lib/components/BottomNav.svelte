<script>
  import { page } from '$app/stores'
  import { Home, TrendingUp, User, MessageCircle, Sparkles, Trophy } from '@lucide/svelte'

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/progress', icon: TrendingUp, label: 'Progress' },
    { href: '/achievements', icon: Trophy, label: 'Achievements' },
    { href: '/motivation', icon: Sparkles, label: 'Motivation' },
    { href: '/chat', icon: MessageCircle, label: 'AI Chat' },
    { href: '/profile', icon: User, label: 'Profile' }
  ]
</script>

<nav class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 px-2 py-3 z-50 shadow-2xl">
  <div class="flex justify-around items-center max-w-md mx-auto">
    {#each navItems as item}
      <a 
        href={item.href}
        class="flex flex-col items-center p-2 rounded-2xl transition-all duration-300 group relative {
          $page.url.pathname === item.href 
            ? 'text-primary-600 bg-primary-50 shadow-lg scale-105' 
            : 'text-gray-500 hover:text-primary-600 hover:bg-primary-25'
        }"
      >
        <!-- Active indicator -->
        {#if $page.url.pathname === item.href}
          <div class="absolute -top-1 left-1/2 transform -translate-x-1/2 w-6 h-1 bg-primary-600 rounded-full"></div>
        {/if}
        
        <!-- Icon with special styling for special pages -->
        <div class="relative {(item.label === 'AI Chat' || item.label === 'Motivation' || item.label === 'Achievements') ? 'p-1 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl' : ''}">
          <svelte:component 
            this={item.icon} 
            size={20} 
            class="{(item.label === 'AI Chat' || item.label === 'Motivation' || item.label === 'Achievements') ? 'text-white' : ''} group-hover:scale-110 transition-transform duration-300" 
          />
          
          <!-- Pulse effect for special pages -->
          {#if item.label === 'AI Chat' || item.label === 'Motivation' || item.label === 'Achievements'}
            <div class="absolute inset-0 bg-gradient-to-r from-primary-400 to-secondary-400 rounded-xl animate-pulse opacity-50"></div>
          {/if}
        </div>
        
        <span class="text-xs mt-1 font-semibold group-hover:font-bold transition-all duration-300">
          {item.label}
        </span>
        
        <!-- Hover effect -->
        <div class="absolute inset-0 bg-primary-100 rounded-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10"></div>
      </a>
    {/each}
  </div>
</nav>