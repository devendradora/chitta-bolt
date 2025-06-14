<script>
  import { signIn, signUp } from '$lib/stores/auth.js'
  import { Mail, Lock, Eye, EyeOff, User, Brain } from '@lucide/svelte'

  export let isLogin = true

  let email = ''
  let password = ''
  let confirmPassword = ''
  let fullName = ''
  let showPassword = false
  let showConfirmPassword = false
  let loading = false
  let error = ''
  let success = ''

  function getErrorMessage(authError) {
    if (!authError) return ''
    
    console.log('Auth error:', authError) // Debug log
    
    const message = authError.message.toLowerCase()
    
    if (message.includes('invalid login credentials') || message.includes('invalid credentials')) {
      return isLogin 
        ? 'Email or password is incorrect. Please check your credentials and try again.'
        : 'Unable to create account. This email may already be registered.'
    }
    
    if (message.includes('email already registered') || message.includes('user already registered')) {
      return 'An account with this email already exists. Try signing in instead.'
    }
    
    if (message.includes('password')) {
      return 'Password must be at least 6 characters long.'
    }
    
    if (message.includes('email')) {
      return 'Please enter a valid email address.'
    }
    
    if (message.includes('signup is disabled')) {
      return 'Account creation is currently disabled. Please contact support.'
    }
    
    // Return original message if no specific match
    return authError.message
  }

  async function handleSubmit() {
    loading = true
    error = ''
    success = ''

    console.log('Form submission:', { isLogin, email, fullName }) // Debug log

    // Validation
    if (!email || !password) {
      error = 'Please fill in all required fields'
      loading = false
      return
    }

    if (!isLogin && password !== confirmPassword) {
      error = 'Passwords do not match'
      loading = false
      return
    }

    if (!isLogin && fullName.trim().length < 2) {
      error = 'Please enter your full name'
      loading = false
      return
    }

    if (password.length < 6) {
      error = 'Password must be at least 6 characters long'
      loading = false
      return
    }

    try {
      const { data, error: authError } = isLogin 
        ? await signIn(email, password)
        : await signUp(email, password, fullName.trim())

      console.log('Auth result:', { data, authError }) // Debug log

      if (authError) {
        error = getErrorMessage(authError)
      } else if (!isLogin) {
        // For signup, show success message
        success = 'Account created successfully! You can now sign in.'
        // Clear form
        email = ''
        password = ''
        confirmPassword = ''
        fullName = ''
        // Switch to login mode
        setTimeout(() => {
          isLogin = true
          success = ''
        }, 2000)
      }
    } catch (err) {
      console.error('Unexpected error:', err)
      error = 'An unexpected error occurred. Please try again.'
    }

    loading = false
  }

  // Clear messages when switching between login/signup
  $: if (isLogin !== undefined) {
    error = ''
    success = ''
  }
</script>

<div class="glass-effect rounded-3xl p-8 space-y-6 shadow-2xl border border-white/20 w-full max-w-md mx-auto">
  <!-- App Header -->
  <div class="text-center space-y-4">
    <div class="flex items-center justify-center space-x-3 mb-6">
      <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/30 shadow-xl">
        <Brain class="text-white" size={32} />
      </div>
    </div>
    
    <h2 class="text-3xl font-bold text-white mb-2 drop-shadow-md">
      {isLogin ? 'Welcome Back' : 'Begin Your Journey'}
    </h2>
    <p class="text-white/90 text-lg drop-shadow-sm">
      {isLogin ? 'Continue your path to inner peace' : 'Discover mindfulness and mental wellness'}
    </p>
  </div>

  <form on:submit|preventDefault={handleSubmit} class="space-y-6">
    {#if error}
      <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl text-sm">
        {error}
      </div>
    {/if}

    {#if success}
      <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-xl text-sm">
        {success}
      </div>
    {/if}

    <div class="space-y-5">
      {#if !isLogin}
        <div class="relative">
          <User class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            bind:value={fullName}
            placeholder="Full Name"
            required
            class="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all"
          />
        </div>
      {/if}

      <div class="relative">
        <Mail class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type="email"
          bind:value={email}
          placeholder="Email address"
          required
          class="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all"
        />
      </div>

      <div class="relative">
        <Lock class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
        <input
          type={showPassword ? 'text' : 'password'}
          bind:value={password}
          placeholder="Password (min. 6 characters)"
          required
          minlength="6"
          class="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all"
        />
        <button
          type="button"
          on:click={() => showPassword = !showPassword}
          class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          {#if showPassword}
            <EyeOff size={20} />
          {:else}
            <Eye size={20} />
          {/if}
        </button>
      </div>

      {#if !isLogin}
        <div class="relative">
          <Lock class="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            bind:value={confirmPassword}
            placeholder="Confirm password"
            required
            minlength="6"
            class="w-full pl-12 pr-12 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white/90 backdrop-blur-sm transition-all"
          />
          <button
            type="button"
            on:click={() => showConfirmPassword = !showConfirmPassword}
            class="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            {#if showConfirmPassword}
              <EyeOff size={20} />
            {:else}
              <Eye size={20} />
            {/if}
          </button>
        </div>
      {/if}
    </div>

    <button
      type="submit"
      disabled={loading}
      class="w-full bg-emerald-600 text-white py-4 rounded-xl font-semibold hover:bg-emerald-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
    >
      {loading ? 'Loading...' : (isLogin ? 'Sign In' : 'Create Account')}
    </button>

    <div class="text-center pt-4">
      <button
        type="button"
        on:click={() => isLogin = !isLogin}
        class="text-white/90 hover:text-white transition-colors font-medium"
      >
        {isLogin ? "New to Chitta? Create an account" : "Already have an account? Sign in"}
      </button>
    </div>

    <!-- Bolt.new Badge inside form, below the toggle text -->
    <div class="flex justify-center pt-4">
      <a 
        href="https://bolt.new" 
        target="_blank" 
        rel="noopener noreferrer"
        class="hover:opacity-80 transition-opacity duration-300 transform hover:scale-105"
      >
        <img 
          src="/images/logotext_poweredby_360w.png" 
          alt="Powered by Bolt.new" 
          class="h-9 w-auto"
        />
      </a>
    </div>
  </form>
</div>

<style>
  .glass-effect {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
</style>