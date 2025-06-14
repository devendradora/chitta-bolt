<script>
  import { subscriptionStatus, startFreeTrial, openSubscriptionPage } from '$lib/stores/subscription.js'
  import { X, AlertCircle, Crown, Gift } from '@lucide/svelte'

  export let isOpen = false
  export let service = ''
  export let remaining = 0
  export let limit = 0
  export let onClose = () => {}

  const serviceNames = {
    aiChat: 'AI Chat Messages',
    motivationQuotes: 'Motivation Quotes'
  }

  function handleStartTrial() {
    const success = startFreeTrial()
    if (success) {
      onClose()
    }
  }

  function handleSubscribe() {
    openSubscriptionPage()
  }

  function handleClose() {
    isOpen = false
    onClose()
  }
</script>

{#if isOpen}
  <!-- Modal Backdrop -->
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white rounded-3xl max-w-md w-full shadow-2xl relative">
      <!-- Close Button -->
      <button 
        on:click={handleClose}
        class="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
      >
        <X size={20} class="text-gray-600" />
      </button>

      <!-- Header -->
      <div class="p-8 text-center space-y-4">
        <div class="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
          <AlertCircle size={32} class="text-orange-500" />
        </div>
        <h2 class="text-2xl font-bold text-gray-800">Daily Limit Reached</h2>
        <p class="text-gray-600">
          You've used all {limit} {serviceNames[service] || service} for today.
        </p>
      </div>

      <!-- Usage Progress -->
      <div class="px-8 pb-6">
        <div class="bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            class="bg-gradient-to-r from-orange-400 to-red-400 h-full transition-all duration-500"
            style="width: 100%"
          ></div>
        </div>
        <div class="flex justify-between text-sm text-gray-600 mt-2">
          <span>{limit}/{limit} used</span>
          <span>Resets tomorrow</span>
        </div>
      </div>

      <!-- Trial Offer -->
      <div class="mx-8 mb-6 p-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl border border-orange-200">
        <div class="text-center space-y-3">
          <div class="flex items-center justify-center space-x-2">
            <Gift size={20} class="text-orange-500" />
            <h3 class="font-bold text-gray-800">Start Free Trial</h3>
          </div>
          <p class="text-gray-600 text-sm">
            Get unlimited access for 7 days, completely free!
          </p>
          <button
            on:click={handleStartTrial}
            class="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-bold hover:from-orange-600 hover:to-red-600 transition-all duration-300"
          >
            Start Free Trial
          </button>
        </div>
      </div>

      <!-- Subscribe Option -->
      <div class="px-8 pb-8">
        <div class="text-center space-y-3">
          <div class="flex items-center justify-center space-x-2">
            <Crown size={20} class="text-primary-500" />
            <h3 class="font-bold text-gray-800">Go Premium</h3>
          </div>
          <p class="text-gray-600 text-sm">
            Unlimited access to all features for $9.99/month
          </p>
          <button
            on:click={handleSubscribe}
            class="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-xl font-bold hover:from-primary-600 hover:to-secondary-600 transition-all duration-300"
          >
            Subscribe Now
          </button>
        </div>
      </div>
    </div>
  </div>
{/if}