<script>
  import { newAchievementEarned, clearNewAchievement } from '$lib/stores/achievements.js'
  import { algorandAddress, getNFTExplorerURL } from '$lib/stores/algorand.js'
  import { Trophy, ExternalLink, X, Sparkles, Gift } from '@lucide/svelte'
  import { onMount } from 'svelte'

  let showCelebration = false
  let achievement = null

  onMount(() => {
    const unsubscribe = newAchievementEarned.subscribe(value => {
      if (value) {
        achievement = value
        showCelebration = true
      }
    })

    return unsubscribe
  })

  function closeCelebration() {
    showCelebration = false
    clearNewAchievement()
  }

  function getRarityColor(rarity) {
    const colors = {
      common: 'from-gray-400 to-gray-600',
      uncommon: 'from-blue-400 to-blue-600', 
      rare: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-orange-600'
    }
    return colors[rarity] || colors.common
  }
</script>

{#if showCelebration && achievement}
  <!-- Celebration Modal -->
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden">
      <!-- Close Button -->
      <button 
        on:click={closeCelebration}
        class="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
      >
        <X size={20} class="text-gray-600" />
      </button>

      <!-- Celebration Content -->
      <div class="p-8 text-center space-y-6">
        <!-- Animated Trophy -->
        <div class="relative">
          <div class="w-24 h-24 bg-gradient-to-br {getRarityColor(achievement.achievement_nfts?.nft_metadata?.rarity)} rounded-full flex items-center justify-center mx-auto shadow-2xl animate-bounce">
            <Trophy size={48} class="text-white" />
          </div>
          
          <!-- Sparkle effects -->
          <div class="absolute -top-2 -left-2 w-6 h-6 bg-yellow-400 rounded-full animate-ping"></div>
          <div class="absolute -top-2 -right-2 w-4 h-4 bg-pink-400 rounded-full animate-pulse"></div>
          <div class="absolute -bottom-2 -left-2 w-4 h-4 bg-blue-400 rounded-full animate-bounce"></div>
          <div class="absolute -bottom-2 -right-2 w-6 h-6 bg-green-400 rounded-full animate-ping" style="animation-delay: 0.5s"></div>
        </div>

        <!-- Achievement Info -->
        <div class="space-y-3">
          <h2 class="text-3xl font-bold text-gray-800">🎉 Achievement Unlocked!</h2>
          <h3 class="text-xl font-bold text-primary-600">{achievement.achievement_nfts?.title}</h3>
          <p class="text-gray-600 leading-relaxed">{achievement.achievement_nfts?.description}</p>
          
          <!-- Rarity Badge -->
          <div class="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r {getRarityColor(achievement.achievement_nfts?.nft_metadata?.rarity)} rounded-full">
            <Sparkles size={16} class="text-white" />
            <span class="text-white text-sm font-bold uppercase tracking-wide">
              {achievement.achievement_nfts?.nft_metadata?.rarity || 'Common'} Achievement
            </span>
          </div>
        </div>

        <!-- NFT Info -->
        {#if $algorandAddress && achievement.nft_asset_id}
          <div class="bg-green-50 border border-green-200 rounded-2xl p-4">
            <div class="flex items-center space-x-3 mb-3">
              <Gift size={20} class="text-green-600" />
              <span class="font-bold text-green-800">Digital Certificate Earned!</span>
            </div>
            
            <div class="space-y-2 text-sm text-green-700">
              <p>Your achievement has been minted as a permanent digital certificate</p>
              <p class="font-mono text-xs bg-green-100 px-2 py-1 rounded">
                NFT ID: {achievement.nft_asset_id}
              </p>
            </div>
            
            <a 
              href={getNFTExplorerURL(achievement.nft_asset_id)}
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center space-x-2 mt-3 text-green-600 hover:text-green-800 font-medium transition-colors"
            >
              <ExternalLink size={16} />
              <span>View Certificate on Blockchain</span>
            </a>
          </div>
        {:else if !$algorandAddress}
          <div class="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
            <div class="flex items-center space-x-3 mb-2">
              <Trophy size={20} class="text-yellow-600" />
              <span class="font-bold text-yellow-800">Achievement Recorded!</span>
            </div>
            <p class="text-yellow-700 text-sm">
              Connect your wallet to turn this into a permanent digital certificate
            </p>
          </div>
        {/if}

        <!-- Action Button -->
        <button
          on:click={closeCelebration}
          class="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          Continue Your Journey
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  @keyframes sparkle {
    0%, 100% { 
      transform: scale(1) rotate(0deg);
      opacity: 1;
    }
    50% { 
      transform: scale(1.2) rotate(180deg);
      opacity: 0.8;
    }
  }
</style>