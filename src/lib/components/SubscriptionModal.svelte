<script>
  import { subscriptionStatus, startFreeTrial, openSubscriptionPage } from '$lib/stores/subscription.js'
  import { X, Crown, Zap, Check, Star, Gift } from '@lucide/svelte'

  export let isOpen = false
  export let feature = ''
  export let onClose = () => {}

  const premiumFeatures = [
    { icon: '🎵', title: 'Custom Music Upload', description: 'Upload your own meditation music' },
    { icon: '💬', title: 'Unlimited AI Chat', description: 'No daily limits on wellness coaching' },
    { icon: '✨', title: 'Unlimited Motivation', description: 'Access all quotes anytime' },
    { icon: '🎥', title: 'AI Video Coach', description: 'Personal video wellness sessions' },
    { icon: '🧠', title: 'Interactive Learning', description: 'Quizzes and flashcards for growth' },
    { icon: '📊', title: 'Advanced Analytics', description: 'Detailed progress insights' },
    { icon: '📤', title: 'Export Data', description: 'Download your wellness data' },
    { icon: '🎯', title: 'Priority Support', description: '24/7 premium customer support' }
  ]

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
    <div class="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative">
      <!-- Close Button -->
      <button 
        on:click={handleClose}
        class="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
      >
        <X size={24} class="text-gray-600" />
      </button>

      <!-- Header -->
      <div class="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-8 rounded-t-3xl">
        <div class="text-center space-y-4">
          <div class="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto">
            <Crown size={40} class="text-white" />
          </div>
          <h2 class="text-3xl font-bold">Unlock Premium Features</h2>
          <p class="text-white/90 text-lg">
            {feature ? `${feature} requires a premium subscription` : 'Enhance your wellness journey with unlimited access'}
          </p>
        </div>
      </div>

      <!-- Trial Offer -->
      <div class="p-8 bg-gradient-to-r from-yellow-50 to-orange-50 border-b border-gray-200">
        <div class="text-center space-y-4">
          <div class="flex items-center justify-center space-x-2">
            <Gift size={24} class="text-orange-500" />
            <h3 class="text-2xl font-bold text-gray-800">7-Day Free Trial</h3>
          </div>
          <p class="text-gray-600">
            Try all premium features free for 7 days. Cancel anytime.
          </p>
          <button
            on:click={handleStartTrial}
            class="bg-gradient-to-r from-orange-500 to-red-500 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Start Free Trial
          </button>
          <p class="text-sm text-gray-500">No credit card required</p>
        </div>
      </div>

      <!-- Premium Features -->
      <div class="p-8">
        <h3 class="text-2xl font-bold text-gray-800 mb-6 text-center">Premium Features</h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {#each premiumFeatures as feature}
            <div class="flex items-start space-x-4 p-4 rounded-2xl border border-gray-200 hover:border-primary-300 hover:bg-primary-25 transition-all duration-300">
              <div class="text-3xl">{feature.icon}</div>
              <div>
                <h4 class="font-bold text-gray-800 mb-1">{feature.title}</h4>
                <p class="text-gray-600 text-sm">{feature.description}</p>
              </div>
              <Check size={20} class="text-green-500 mt-1" />
            </div>
          {/each}
        </div>

        <!-- Pricing -->
        <div class="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-2xl p-6 mb-6">
          <div class="text-center space-y-4">
            <div class="flex items-center justify-center space-x-2">
              <Star size={24} class="text-yellow-500" />
              <h3 class="text-2xl font-bold text-gray-800">Premium Plan</h3>
            </div>
            <div class="text-4xl font-bold text-gray-800">
              $9.99<span class="text-lg text-gray-600">/month</span>
            </div>
            <p class="text-gray-600">
              Billed monthly • Cancel anytime
            </p>
          </div>
        </div>

        <!-- Subscribe Button -->
        <div class="text-center space-y-4">
          <button
            on:click={handleSubscribe}
            class="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-4 rounded-2xl font-bold text-lg hover:from-primary-600 hover:to-secondary-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            Subscribe Now
          </button>
          <p class="text-sm text-gray-500">
            Secure payment powered by RevenueCat
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="bg-gray-50 p-6 rounded-b-3xl text-center">
        <p class="text-gray-600 text-sm">
          Join thousands of users improving their mental wellness with Chitta Premium
        </p>
      </div>
    </div>
  </div>
{/if}