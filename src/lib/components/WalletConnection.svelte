<script>
  import { onMount } from 'svelte'
  import { 
    algorandAddress, 
    isConnecting, 
    connectionError, 
    connectAlgorandWallet, 
    disconnectWallet,
    loadAlgorandAddress,
    formatAddress,
    getAvailableWallets,
    WALLET_TYPES,
    connectedWallet
  } from '$lib/stores/algorand.js'
  import { 
    Wallet, 
    ExternalLink, 
    AlertCircle, 
    CheckCircle, 
    Loader, 
    HelpCircle, 
    Download, 
    Smartphone, 
    Globe,
    Monitor,
    Edit3,
    Shield,
    Zap,
    Gift
  } from '@lucide/svelte'

  export let showFullAddress = false
  export let size = 'normal' // 'small', 'normal', 'large'

  let mounted = false
  let showWalletOptions = false
  let availableWallets = []
  let currentStep = 1
  let showBenefits = true

  onMount(async () => {
    mounted = true
    availableWallets = getAvailableWallets()
    await loadAlgorandAddress()
  })

  async function handleConnect(walletType = null) {
    const result = await connectAlgorandWallet(walletType)
    if (result.success) {
      console.log('Wallet connected successfully:', result.address, 'via', result.wallet)
      showWalletOptions = false
      showBenefits = false
    }
  }

  async function handleDisconnect() {
    await disconnectWallet()
  }

  function getWalletIcon(walletType) {
    switch (walletType) {
      case WALLET_TYPES.LUTE:
        return Smartphone
      case WALLET_TYPES.MANUAL:
        return Edit3
      default:
        return Wallet
    }
  }

  $: buttonSize = {
    small: 'px-3 py-2 text-sm',
    normal: 'px-4 py-3',
    large: 'px-6 py-4 text-lg'
  }[size]

  $: iconSize = {
    small: 16,
    normal: 20,
    large: 24
  }[size]
</script>

{#if mounted}
  <div class="space-y-6">
    {#if $algorandAddress}
      <!-- Connected state -->
      <div class="bg-green-50 border border-green-200 rounded-2xl p-6">
        <div class="flex items-center space-x-4">
          <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
            <CheckCircle size={24} class="text-white" />
          </div>
          <div class="flex-1">
            <h4 class="font-bold text-green-800 text-lg">🎉 You're All Set!</h4>
            <p class="text-green-600 text-sm mb-2">
              Connected via {$connectedWallet === WALLET_TYPES.LUTE ? 'Lute Wallet' : 'Manual Entry'}
            </p>
            <p class="text-green-600 text-xs font-mono bg-green-100 px-2 py-1 rounded">
              {showFullAddress ? $algorandAddress : formatAddress($algorandAddress)}
            </p>
          </div>
          <button
            on:click={handleDisconnect}
            class="text-green-600 hover:text-green-800 text-sm font-medium underline transition-colors"
          >
            Change
          </button>
        </div>
        
        <div class="mt-4 pt-4 border-t border-green-200">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div class="bg-green-100 rounded-lg p-3">
              <div class="text-2xl mb-1">🏆</div>
              <p class="text-green-800 text-sm font-medium">Permanent Certificates</p>
            </div>
            <div class="bg-green-100 rounded-lg p-3">
              <div class="text-2xl mb-1">🔒</div>
              <p class="text-green-800 text-sm font-medium">Secure & Verified</p>
            </div>
            <div class="bg-green-100 rounded-lg p-3">
              <div class="text-2xl mb-1">💎</div>
              <p class="text-green-800 text-sm font-medium">Truly Yours</p>
            </div>
          </div>
          
          <div class="mt-4 text-center">
            <a 
              href="https://testnet.algoexplorer.io/address/{$algorandAddress}"
              target="_blank"
              rel="noopener noreferrer"
              class="inline-flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm font-medium transition-colors"
            >
              <ExternalLink size={14} />
              <span>View Your Certificates on Blockchain</span>
            </a>
          </div>
        </div>
      </div>
    {:else}
      <!-- Not connected state with step-by-step approach -->
      <div class="space-y-6">
        <!-- Benefits Section -->
        {#if showBenefits}
          <div class="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-2xl p-6">
            <div class="text-center space-y-4">
              <div class="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                <Gift size={32} class="text-white" />
              </div>
              
              <div>
                <h3 class="text-xl font-bold text-gray-800 mb-2">Why Connect Your Wallet?</h3>
                <p class="text-gray-600 text-sm leading-relaxed">
                  Transform your wellness achievements into permanent, verifiable certificates that you truly own
                </p>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div class="bg-white/50 rounded-lg p-4">
                  <Shield size={20} class="text-blue-600 mx-auto mb-2" />
                  <p class="font-medium text-gray-800">Permanent Proof</p>
                  <p class="text-gray-600 text-xs">Never lose your achievements</p>
                </div>
                <div class="bg-white/50 rounded-lg p-4">
                  <Zap size={20} class="text-purple-600 mx-auto mb-2" />
                  <p class="font-medium text-gray-800">True Ownership</p>
                  <p class="text-gray-600 text-xs">You control your certificates</p>
                </div>
                <div class="bg-white/50 rounded-lg p-4">
                  <ExternalLink size={20} class="text-green-600 mx-auto mb-2" />
                  <p class="font-medium text-gray-800">Shareable</p>
                  <p class="text-gray-600 text-xs">Prove your wellness journey</p>
                </div>
              </div>
              
              <button
                on:click={() => showBenefits = false}
                class="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-600 transition-all duration-300"
              >
                Get Started (2 minutes)
              </button>
            </div>
          </div>
        {:else}
          <!-- Setup Process -->
          <div class="bg-white border border-gray-200 rounded-2xl p-6">
            <div class="flex items-center space-x-3 mb-6">
              <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <Wallet size={20} class="text-white" />
              </div>
              <div>
                <h4 class="font-bold text-gray-800">Quick Wallet Setup</h4>
                <p class="text-gray-600 text-sm">Connect with Lute Wallet</p>
              </div>
            </div>

            <!-- Wallet Options -->
            <div class="space-y-3 mb-6">
              {#each availableWallets as wallet}
                <div class="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:bg-blue-25 transition-all duration-300 cursor-pointer group"
                     on:click={() => handleConnect(wallet.type)}>
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <div class="w-10 h-10 bg-gray-100 group-hover:bg-blue-100 rounded-lg flex items-center justify-center transition-colors">
                        <svelte:component this={getWalletIcon(wallet.type)} size={20} class="text-gray-600 group-hover:text-blue-600" />
                      </div>
                      <div>
                        <p class="font-medium text-gray-800">{wallet.name}</p>
                        <p class="text-xs text-gray-600">{wallet.description}</p>
                      </div>
                    </div>
                    <div class="flex items-center space-x-2">
                      {#if wallet.available}
                        <button
                          disabled={$isConnecting}
                          class="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50"
                        >
                          {$isConnecting ? 'Connecting...' : 'Connect'}
                        </button>
                      {:else if wallet.downloadUrl}
                        <a
                          href={wallet.downloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="inline-flex items-center space-x-1 px-3 py-2 bg-green-500 text-white text-sm rounded-lg hover:bg-green-600 transition-colors"
                        >
                          <Download size={12} />
                          <span>Get Lute</span>
                        </a>
                      {/if}
                    </div>
                  </div>
                </div>
              {/each}
            </div>

            <!-- Error Display -->
            {#if $connectionError}
              <div class="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <div class="flex items-center space-x-2 mb-2">
                  <AlertCircle size={16} class="text-red-500" />
                  <span class="text-red-700 text-sm font-medium">Connection Issue</span>
                </div>
                <p class="text-red-600 text-sm mb-3">{$connectionError}</p>
                
                <div class="bg-red-100 rounded-lg p-3">
                  <p class="text-red-700 text-xs font-medium mb-2">Quick fixes:</p>
                  <ul class="text-red-600 text-xs space-y-1">
                    <li>• Refresh page and try again</li>
                    <li>• Make sure Lute Wallet is installed</li>
                    <li>• Try "Manual Entry" option</li>
                    <li>• Use a different browser</li>
                  </ul>
                </div>
              </div>
            {/if}

            <!-- Help Section -->
            <div class="bg-gray-50 rounded-xl p-4">
              <div class="flex items-center space-x-2 mb-3">
                <HelpCircle size={16} class="text-gray-600" />
                <span class="text-gray-700 text-sm font-medium">Need Help?</span>
              </div>
              
              <div class="space-y-2 text-xs text-gray-600">
                <p><strong>New to crypto wallets?</strong> We recommend Lute Wallet - a modern, secure Algorand wallet</p>
                <p><strong>On mobile?</strong> Download the Lute Wallet app, then use "Manual Entry"</p>
                <p><strong>Having issues?</strong> Try the "Manual Entry" option - it works with any wallet</p>
              </div>
              
              <div class="mt-3 pt-3 border-t border-gray-200">
                <p class="text-xs text-gray-500">
                  🧪 <strong>Safe Testing:</strong> This uses Algorand TestNet - no real money involved!
                </p>
              </div>
            </div>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}