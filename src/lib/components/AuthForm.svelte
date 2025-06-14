<script>
  import { signIn, signUp } from '$lib/stores/auth.js'
  import { supabase } from '$lib/supabase.js'
  import { Mail, Lock, Eye, EyeOff, User, Brain, LogIn } from '@lucide/svelte'

  export let isLogin = true

  let email = ''
  let password = ''
  let confirmPassword = ''
  let fullName = ''
  let showPassword = false
  let showConfirmPassword = false
  let loading = false
  let googleLoading = false
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

  async function handleGoogleSignIn() {
    googleLoading = true
    error = ''
    
    try {
      const { data, error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      })
      
      if (authError) {
        error = getErrorMessage(authError)
      }
    } catch (err) {
      console.error('Google sign in error:', err)
      error = 'Failed to sign in with Google. Please try again.'
    }
    
    googleLoading = false
  }

  // Clear messages when switching between login/signup
  $: if (isLogin !== undefined) {
    error = ''
    success = ''
  }
</script>

<div class="glass-effect rounded-3xl p-8 space-y-6 shadow-2xl border border-white/20 w-full max-w-md mx-auto">
  <!-- App Header with Back Button -->
  <div class="space-y-2">
    <div class="flex items-center justify-center">
      <button 
        on:click|preventDefault={() => {
          const event = new CustomEvent('closeAuth');
          window.dispatchEvent(event);
        }}
        class="absolute left-8 text-white/80 hover:text-white transition-colors flex items-center"
        aria-label="Back to home"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
        </svg>
      </button>
      <h2 class="text-3xl font-bold text-white drop-shadow-md text-center">
        {isLogin ? 'Welcome Back' : 'Begin Your Journey'}
      </h2>
    </div>
    <p class="text-white/90 text-lg drop-shadow-sm text-center">
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

    <!-- Divider with "or" text -->
    <div class="relative my-6">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-white/20"></div>
      </div>
      <div class="relative flex justify-center text-sm">
        <span class="px-2 text-white">Or continue with</span>
      </div>
    </div>

    <!-- Google Sign In Button -->
    <button
      type="button"
      on:click={handleGoogleSignIn}
      disabled={googleLoading}
      class="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors duration-200"
    >
      {#if googleLoading}
        <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-700 mr-2"></div>
        <span>Connecting...</span>
      {:else}
        <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <g transform="matrix(1, 0, 0, 1, 27.009001, -39.238998)">
            <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.28426 53.749 C -8.52426 55.529 -9.42426 57.089 -10.7843 58.129 L -10.8043 58.249 L -4.42426 62.929 L -4.42426 62.929 C -1.96426 60.649 -0.764 57.599 -0.764 54.329 C -0.764 53.229 -0.884 52.159 -1.114 51.129 L -1.114 51.129 L -3.264 51.509 Z"/>
            <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.704 62.159 -6.52426 60.249 L -10.7843 58.129 C -11.9143 58.919 -13.354 59.369 -14.754 59.369 C -17.884 59.369 -20.554 57.369 -21.414 54.529 L -21.414 54.529 L -25.664 55.059 L -25.664 55.059 C -24.554 58.789 -21.364 61.519 -17.514 62.409 L -17.514 62.409 L -14.754 63.239 Z"/>
            <path fill="#FBBC05" d="M -21.414 54.529 C -21.664 53.709 -21.804 52.839 -21.804 51.949 C -21.804 51.059 -21.664 50.189 -21.414 49.369 L -21.414 49.369 L -25.664 48.839 L -25.664 48.839 C -26.784 51.299 -26.334 54.229 -24.514 56.199 L -21.414 54.529 Z"/>
            <path fill="#EA4335" d="M -14.754 44.529 C -12.084 44.529 -9.704 45.519 -7.82426 47.429 L -7.80426 47.429 L -3.50426 43.099 C -6.98426 39.809 -11.704 38.759 -16.424 39.979 C -15.244 40.259 -14.134 40.819 -13.194 41.639 L -13.194 41.659 L -9.16426 38.929 C -10.934 37.319 -13.194 36.369 -15.624 36.369 C -11.694 36.369 -7.904 38.579 -6.52426 41.999 L -1.114 41.129 C -2.564 36.719 -6.52426 33.239 -11.274 33.239 C -14.064 33.239 -16.654 34.249 -18.604 35.919 C -20.554 37.589 -21.804 39.919 -21.804 42.479 C -21.804 43.569 -21.534 44.599 -21.074 45.529 L -14.754 44.529 Z"/>
          </g>
        </svg>
        <span>{isLogin ? 'Continue with Google' : 'Continue with Google'}</span>
      {/if}
    </button>

    <div class="text-center pt-4">
      <button
        type="button"
        on:click={() => isLogin = !isLogin}
        class="group transition-colors font-medium"
      >
        {#if isLogin}
          <span class="text-white/90">New to Chitta? </span>
          <span class="text-cyan-200 hover:text-white font-semibold border-b border-cyan-300/40 hover:border-white/60 transition-colors">Create an account</span>
        {:else}
          <span class="text-white/90">Already have an account? </span>
          <span class="text-cyan-200 hover:text-white font-semibold border-b border-cyan-300/40 hover:border-white/60 transition-colors">Sign in</span>
        {/if}
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