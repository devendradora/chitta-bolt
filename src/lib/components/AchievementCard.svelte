<script>
  import { Trophy, Lock, ExternalLink, Calendar, Sparkles } from '@lucide/svelte'
  import { formatAddress, getNFTExplorerURL } from '$lib/stores/algorand.js'

  export let achievement
  export let isEarned = false
  export let progress = 0
  export let showProgress = true

  $: progressPercentage = achievement?.requirement_value ? Math.min((progress / achievement.requirement_value) * 100, 100) : 0
  $: rarityColor = getRarityColor(achievement?.nft_metadata?.rarity)
  $: categoryIcon = getCategoryIcon(achievement?.achievement_type)

  function getRarityColor(rarity) {
    const colors = {
      common: 'from-gray-400 to-gray-600',
      uncommon: 'from-blue-400 to-blue-600', 
      rare: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-orange-600'
    }
    return colors[rarity] || colors.common
  }

  function getCategoryIcon(type) {
    const icons = {
      meditation: '🧘‍♀️',
      mood: '😊',
      chat: '💬',
      motivation: '✨',
      overall: '🏆'
    }
    return icons[type] || '🏆'
  }

  function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }
</script>

<div class="bg-white rounded-3xl p-6 shadow-lg border border-gray-200 relative overflow-hidden group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
  <!-- Rarity glow effect -->
  <div class="absolute inset-0 bg-gradient-to-br {rarityColor} opacity-5 group-hover:opacity-10 transition-opacity duration-300"></div>
  
  <!-- Achievement image -->
  <div class="relative mb-4">
    <div class="w-20 h-20 mx-auto rounded-2xl overflow-hidden shadow-lg relative">
      <img 
        src={achievement.image_url} 
        alt={achievement.title}
        class="w-full h-full object-cover {isEarned ? '' : 'grayscale opacity-60'}"
      />
      
      <!-- Earned badge -->
      {#if isEarned}
        <div class="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg">
          <Trophy size={16} class="text-white" />
        </div>
      {:else}
        <div class="absolute -top-2 -right-2 w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center shadow-lg">
          <Lock size={16} class="text-white" />
        </div>
      {/if}
      
      <!-- Category icon -->
      <div class="absolute -bottom-2 -left-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-gray-100">
        <span class="text-lg">{categoryIcon}</span>
      </div>
    </div>
  </div>

  <!-- Achievement info -->
  <div class="text-center space-y-3 relative z-10">
    <div>
      <h3 class="font-bold text-gray-800 text-lg mb-1">{achievement.title}</h3>
      <p class="text-gray-600 text-sm leading-relaxed">{achievement.description}</p>
    </div>

    <!-- Rarity badge -->
    <div class="inline-flex items-center space-x-2 px-3 py-1 bg-gradient-to-r {rarityColor} rounded-full">
      <Sparkles size={12} class="text-white" />
      <span class="text-white text-xs font-bold uppercase tracking-wide">
        {achievement.nft_metadata?.rarity || 'Common'}
      </span>
    </div>

    <!-- Progress bar (for unearned achievements) -->
    {#if !isEarned && showProgress}
      <div class="space-y-2">
        <div class="flex items-center justify-between text-sm">
          <span class="text-gray-600">Progress</span>
          <span class="font-medium text-gray-800">
            {progress} / {achievement.requirement_value}
          </span>
        </div>
        <div class="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r {rarityColor} rounded-full transition-all duration-1000 ease-out"
            style="width: {progressPercentage}%"
          ></div>
        </div>
        <p class="text-xs text-gray-500">{achievement.requirement_description}</p>
      </div>
    {/if}

    <!-- Earned info -->
    {#if isEarned && achievement.earned_at}
      <div class="space-y-2 pt-2 border-t border-gray-100">
        <div class="flex items-center justify-center space-x-2 text-green-600">
          <Calendar size={14} />
          <span class="text-sm font-medium">Earned {formatDate(achievement.earned_at)}</span>
        </div>
        
        {#if achievement.nft_asset_id}
          <div class="space-y-2">
            <p class="text-xs text-gray-500">NFT Asset ID: {achievement.nft_asset_id}</p>
            {#if achievement.transaction_id}
              <a 
                href={getNFTExplorerURL(achievement.nft_asset_id)}
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-xs font-medium transition-colors"
              >
                <ExternalLink size={12} />
                <span>View on Explorer</span>
              </a>
            {/if}
          </div>
        {/if}
      </div>
    {/if}
  </div>
</div>