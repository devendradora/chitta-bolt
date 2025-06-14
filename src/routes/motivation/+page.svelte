<script>
  import { onMount } from 'svelte'
  import { user, loading as authLoading, sessionError, makeAuthenticatedDbRequest } from '$lib/stores/auth.js'
  import { subscriptionStatus, canUseService, incrementUsage } from '$lib/stores/subscription.js'
  import SubscriptionModal from '$lib/components/SubscriptionModal.svelte'
  import UsageLimitModal from '$lib/components/UsageLimitModal.svelte'
  import { 
    fetchQuotes, 
    quotes, 
    currentQuote, 
    currentQuoteIndex, 
    loading, 
    error,
    categories,
    toggleLike,
    shareQuote,
    addComment,
    getQuoteComments,
    updateQuotesWithInteractions
  } from '$lib/stores/motivation.js'
  import { 
    ArrowLeft, 
    Heart, 
    Share2, 
    MessageCircle, 
    Send,
    Filter,
    Sparkles,
    Copy,
    Check,
    Loader,
    X,
    ChevronUp,
    ChevronDown,
    Crown
  } from '@lucide/svelte'
  import { goto } from '$app/navigation'

  let selectedCategory = 'all'
  let showComments = false
  let newComment = ''
  let comments = []
  let addingComment = false
  let showCategoryFilter = false
  let copiedQuoteId = null
  let container = null
  let startY = 0
  let currentY = 0
  let isDragging = false
  let translateY = 0
  let mounted = false
  let commentsContainer = null
  let showSubscriptionModal = false
  let showUsageLimitModal = false
  let usageInfo = { remaining: 0, limit: 0 }

  onMount(async () => {
    console.log('Motivation page mounted')
    mounted = true
    
    // Always load quotes regardless of user state
    await loadQuotes()
    setupTouchEvents()
  })

  // Watch for user changes but don't block loading
  $: if (mounted && $user) {
    console.log('User authenticated, updating quotes with interactions')
    updateQuotesWithUserData()
  }

  async function updateQuotesWithUserData() {
    if ($quotes.length > 0 && $user) {
      try {
        const updatedQuotes = await makeAuthenticatedDbRequest(() => 
          updateQuotesWithInteractions($quotes, $user.id)
        )
        quotes.set(updatedQuotes)
      } catch (err) {
        console.error('Error updating quotes with user data:', err)
        // Don't show error, just continue without user interactions
      }
    }
  }

  function setupTouchEvents() {
    if (!container) return

    let startY = 0
    let currentY = 0
    let isDragging = false
    let translateY = 0

    const handleTouchStart = (e) => {
      if (showComments) return
      startY = e.touches[0].clientY
      isDragging = true
      translateY = 0
    }

    const handleTouchMove = (e) => {
      if (!isDragging || showComments) return
      e.preventDefault()
      currentY = e.touches[0].clientY
      translateY = currentY - startY
      
      // Limit the drag distance
      const maxDrag = 100
      translateY = Math.max(-maxDrag, Math.min(maxDrag, translateY))
      
      container.style.transform = `translateY(${translateY}px)`
      container.style.opacity = 1 - Math.abs(translateY) / 200
    }

    const handleTouchEnd = (e) => {
      if (!isDragging || showComments) return
      isDragging = false
      
      const threshold = 50
      
      if (translateY > threshold) {
        // Swipe down - previous quote
        prevQuote()
      } else if (translateY < -threshold) {
        // Swipe up - next quote
        nextQuote()
      }
      
      // Reset transform
      container.style.transform = 'translateY(0px)'
      container.style.opacity = '1'
      translateY = 0
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd, { passive: false })

    // Mouse events for desktop
    const handleMouseDown = (e) => {
      if (showComments) return
      startY = e.clientY
      isDragging = true
      translateY = 0
      e.preventDefault()
    }

    const handleMouseMove = (e) => {
      if (!isDragging || showComments) return
      e.preventDefault()
      currentY = e.clientY
      translateY = currentY - startY
      
      const maxDrag = 100
      translateY = Math.max(-maxDrag, Math.min(maxDrag, translateY))
      
      container.style.transform = `translateY(${translateY}px)`
      container.style.opacity = 1 - Math.abs(translateY) / 200
    }

    const handleMouseUp = (e) => {
      if (!isDragging || showComments) return
      isDragging = false
      
      const threshold = 50
      
      if (translateY > threshold) {
        prevQuote()
      } else if (translateY < -threshold) {
        nextQuote()
      }
      
      container.style.transform = 'translateY(0px)'
      container.style.opacity = '1'
      translateY = 0
    }

    container.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)

    // Cleanup function
    return () => {
      container?.removeEventListener('touchstart', handleTouchStart)
      container?.removeEventListener('touchmove', handleTouchMove)
      container?.removeEventListener('touchend', handleTouchEnd)
      container?.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }

  async function loadQuotes() {
    console.log('Loading quotes for category:', selectedCategory)
    
    try {
      const { data, error: fetchError } = await fetchQuotes(selectedCategory, 50)
      
      if (fetchError) {
        console.error('Failed to load quotes:', fetchError)
        return
      }
      
      if (data && data.length > 0) {
        console.log('Quotes loaded successfully:', data.length)
        
        // Update with interaction data if user is logged in
        if ($user) {
          try {
            const updatedQuotes = await makeAuthenticatedDbRequest(() => 
              updateQuotesWithInteractions(data, $user.id)
            )
            quotes.set(updatedQuotes)
            if (updatedQuotes.length > 0) {
              currentQuote.set(updatedQuotes[0])
              currentQuoteIndex.set(0)
            }
          } catch (err) {
            console.error('Error updating with interactions:', err)
            // Fallback to quotes without interactions
            quotes.set(data)
            if (data.length > 0) {
              currentQuote.set(data[0])
              currentQuoteIndex.set(0)
            }
          }
        } else {
          quotes.set(data)
          if (data.length > 0) {
            currentQuote.set(data[0])
            currentQuoteIndex.set(0)
          }
        }
      } else {
        console.log('No quotes found')
        // Set empty state instead of staying in loading
        quotes.set([])
        currentQuote.set(null)
        currentQuoteIndex.set(0)
      }
    } catch (err) {
      console.error('Error in loadQuotes:', err)
      error.set('Failed to load quotes')
      // Set empty state on error
      quotes.set([])
      currentQuote.set(null)
      currentQuoteIndex.set(0)
    }
  }

  async function handleCategoryChange(category) {
    selectedCategory = category
    showCategoryFilter = false
    await loadQuotes()
  }

  function nextQuote() {
    if ($quotes.length === 0) return
    
    // Check usage limits for free users
    if (!$subscriptionStatus.isPremium && !$subscriptionStatus.isTrialActive) {
      const usage = canUseService('motivationQuotes')
      if (!usage.allowed) {
        usageInfo = { remaining: usage.remaining, limit: usage.limit }
        showUsageLimitModal = true
        return
      }
      
      // Increment usage
      incrementUsage('motivationQuotes')
    }
    
    const nextIndex = ($currentQuoteIndex + 1) % $quotes.length
    currentQuoteIndex.set(nextIndex)
    currentQuote.set($quotes[nextIndex])
    showComments = false
  }

  function prevQuote() {
    if ($quotes.length === 0) return
    
    // Check usage limits for free users
    if (!$subscriptionStatus.isPremium && !$subscriptionStatus.isTrialActive) {
      const usage = canUseService('motivationQuotes')
      if (!usage.allowed) {
        usageInfo = { remaining: usage.remaining, limit: usage.limit }
        showUsageLimitModal = true
        return
      }
      
      // Increment usage
      incrementUsage('motivationQuotes')
    }
    
    const prevIndex = $currentQuoteIndex === 0 ? $quotes.length - 1 : $currentQuoteIndex - 1
    currentQuoteIndex.set(prevIndex)
    currentQuote.set($quotes[prevIndex])
    showComments = false
  }

  async function handleLike() {
    if (!$user || !$currentQuote) {
      console.log('Cannot like: user not authenticated or no current quote')
      return
    }

    try {
      const { liked, error: likeError } = await makeAuthenticatedDbRequest(() => 
        toggleLike($currentQuote.id, $user.id)
      )
      
      if (!likeError) {
        // Update the current quote and quotes array
        const updatedQuote = {
          ...$currentQuote,
          user_liked: liked,
          likes_count: liked ? $currentQuote.likes_count + 1 : $currentQuote.likes_count - 1
        }
        
        currentQuote.set(updatedQuote)
        
        const updatedQuotes = $quotes.map(q => 
          q.id === $currentQuote.id ? updatedQuote : q
        )
        quotes.set(updatedQuotes)
      }
    } catch (err) {
      console.error('Error liking quote:', err)
    }
  }

  async function handleShare() {
    if (!$currentQuote) return

    // Copy to clipboard
    const shareText = `"${$currentQuote.quote}" - ${$currentQuote.author}`
    
    try {
      await navigator.clipboard.writeText(shareText)
      copiedQuoteId = $currentQuote.id
      setTimeout(() => copiedQuoteId = null, 2000)
      
      // Track share in database if user is logged in
      if ($user) {
        try {
          await makeAuthenticatedDbRequest(() => 
            shareQuote($currentQuote.id, $user.id)
          )
          
          // Update share count
          const updatedQuote = {
            ...$currentQuote,
            user_shared: true,
            shares_count: $currentQuote.shares_count + 1
          }
          
          currentQuote.set(updatedQuote)
          
          const updatedQuotes = $quotes.map(q => 
            q.id === $currentQuote.id ? updatedQuote : q
          )
          quotes.set(updatedQuotes)
        } catch (err) {
          console.error('Error tracking share:', err)
          // Don't show error, sharing still worked
        }
      }
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
    }
  }

  async function handleShowComments() {
    if (!$currentQuote) return
    
    showComments = !showComments
    
    if (showComments) {
      await loadComments()
    }
  }

  async function loadComments() {
    if (!$currentQuote) return
    
    try {
      const { data } = await getQuoteComments($currentQuote.id)
      comments = data || []
    } catch (err) {
      console.error('Error loading comments:', err)
      comments = []
    }
  }

  async function handleAddComment() {
    if (!$user || !$currentQuote || !newComment.trim()) {
      console.log('Cannot add comment: missing requirements')
      return
    }

    addingComment = true
    
    try {
      const { data, error: commentError } = await makeAuthenticatedDbRequest(() => 
        addComment($currentQuote.id, $user.id, newComment)
      )
      
      if (!commentError && data) {
        // Add the new comment with user info
        const newCommentData = {
          ...data,
          user_email: $user.email,
          user_name: $user.user_metadata?.full_name || $user.email.split('@')[0]
        }
        
        comments = [...comments, newCommentData]
        newComment = ''
        
        // Update comments count
        const updatedQuote = {
          ...$currentQuote,
          comments_count: $currentQuote.comments_count + 1
        }
        
        currentQuote.set(updatedQuote)
        
        const updatedQuotes = $quotes.map(q => 
          q.id === $currentQuote.id ? updatedQuote : q
        )
        quotes.set(updatedQuotes)
      }
    } catch (err) {
      console.error('Error adding comment:', err)
    }
    
    addingComment = false
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      handleAddComment()
    }
  }

  function formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now - date) / (1000 * 60 * 60)
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`
    } else {
      return `${Math.floor(diffInHours / 24)}d ago`
    }
  }

  function getCategoryEmoji(category) {
    const cat = categories.find(c => c.value === category)
    return cat ? cat.emoji : '✨'
  }

  function handleUpgrade() {
    showSubscriptionModal = true
  }

  // Keyboard navigation
  function handleKeyDown(event) {
    if (showComments) return // Don't navigate when comments are open
    
    switch(event.key) {
      case 'ArrowUp':
        event.preventDefault()
        prevQuote()
        break
      case 'ArrowDown':
        event.preventDefault()
        nextQuote()
        break
      case ' ':
        event.preventDefault()
        handleLike()
        break
    }
  }

  // Get current usage info
  $: currentUsage = canUseService('motivationQuotes')
</script>

<svelte:head>
  <title>Motivation - Chitta</title>
</svelte:head>

<svelte:window on:keydown={handleKeyDown} />

<div class="min-h-screen bg-black text-white relative overflow-hidden select-none">
  <!-- Header -->
  <div class="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-gradient-to-b from-black/80 to-transparent">
    <button 
      on:click={() => goto('/')} 
      class="p-3 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all duration-300"
    >
      <ArrowLeft size={24} class="text-white" />
    </button>
    
    <div class="flex items-center space-x-3">
      <Sparkles size={24} class="text-yellow-400" />
      <h1 class="text-xl font-bold">Motivation</h1>
    </div>
    
    <div class="flex items-center space-x-2">
      <!-- Usage indicator for free users -->
      {#if !$subscriptionStatus.isPremium && !$subscriptionStatus.isTrialActive}
        <button
          on:click={handleUpgrade}
          class="flex items-center space-x-1 px-3 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-full hover:from-orange-600 hover:to-red-600 transition-all duration-300 shadow-lg text-sm"
        >
          <Crown size={14} />
          <span class="font-medium">{currentUsage.remaining}/{currentUsage.limit}</span>
        </button>
      {/if}
      
      <button 
        on:click={() => showCategoryFilter = !showCategoryFilter}
        class="p-3 rounded-full bg-black/50 backdrop-blur-sm hover:bg-black/70 transition-all duration-300 relative"
      >
        <Filter size={24} class="text-white" />
        {#if selectedCategory !== 'all'}
          <div class="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"></div>
        {/if}
      </button>
    </div>
  </div>

  <!-- Trial/Premium Status Banner -->
  {#if $subscriptionStatus.isTrialActive}
    <div class="absolute top-20 left-0 right-0 z-40 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-4 py-2 text-center">
      <p class="text-sm font-medium">
        🎉 Free Trial Active - Unlimited quotes for {$subscriptionStatus.trialDaysLeft} more days
      </p>
    </div>
  {:else if $subscriptionStatus.isPremium}
    <div class="absolute top-20 left-0 right-0 z-40 bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 text-center">
      <p class="text-sm font-medium">
        👑 Premium Active - Unlimited Motivation Quotes
      </p>
    </div>
  {/if}

  <!-- Category Filter Dropdown -->
  {#if showCategoryFilter}
    <div class="absolute top-20 right-4 z-50 bg-black/90 backdrop-blur-lg rounded-2xl p-4 border border-white/20 shadow-2xl">
      <div class="space-y-2">
        {#each categories as category}
          <button
            on:click={() => handleCategoryChange(category.value)}
            class="w-full flex items-center space-x-3 p-3 rounded-xl transition-all duration-300 {
              selectedCategory === category.value 
                ? 'bg-white/20 text-yellow-400' 
                : 'hover:bg-white/10 text-white'
            }"
          >
            <span class="text-xl">{category.emoji}</span>
            <span class="font-medium">{category.label}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Loading State -->
  {#if $loading}
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center space-y-4">
        <Loader size={48} class="text-white animate-spin mx-auto" />
        <p class="text-white/80 text-lg">Loading inspiration...</p>
      </div>
    </div>
  {:else if $error}
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="text-center space-y-4">
        <p class="text-red-400 text-lg">Failed to load quotes</p>
        <p class="text-white/60 text-sm">{$error}</p>
        <button 
          on:click={loadQuotes}
          class="px-6 py-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
        >
          Try Again
        </button>
      </div>
    </div>
  {:else if $quotes.length === 0}
    <!-- No Quotes State -->
    <div class="flex items-center justify-center min-h-screen p-4">
      <div class="text-center space-y-4">
        <Sparkles size={64} class="text-white/40 mx-auto" />
        <h2 class="text-2xl font-bold text-white/80">No quotes found</h2>
        <p class="text-white/60">Try selecting a different category</p>
        <button 
          on:click={() => handleCategoryChange('all')}
          class="px-6 py-3 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
        >
          Show All Quotes
        </button>
      </div>
    </div>
  {:else if $currentQuote}
    <!-- Main Quote Display Container -->
    <div 
      bind:this={container}
      class="relative min-h-screen flex items-center justify-center transition-all duration-300 ease-out"
      style="touch-action: pan-y;"
    >
      <!-- Dynamic Background Gradient -->
      <div class="absolute inset-0 bg-gradient-to-br {$currentQuote.background || 'from-purple-900 via-blue-900 to-indigo-900'} transition-all duration-1000"></div>
      
      <!-- Animated Background Elements -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-yellow-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div class="absolute -bottom-40 -left-40 w-96 h-96 bg-pink-400/10 rounded-full blur-3xl animate-pulse" style="animation-delay: 2s"></div>
        <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-blue-400/10 rounded-full blur-2xl animate-bounce" style="animation-delay: 4s"></div>
      </div>

      <!-- Quote Content -->
      <div class="relative z-10 max-w-4xl mx-auto text-center space-y-8 px-4 pr-24">
        <!-- Category Badge -->
        <div class="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/20">
          <span class="text-2xl">{getCategoryEmoji($currentQuote.category)}</span>
          <span class="text-sm font-medium capitalize">{$currentQuote.category}</span>
        </div>

        <!-- Quote Text -->
        <div class="space-y-6">
          <blockquote class="text-2xl md:text-3xl lg:text-4xl font-light leading-relaxed text-white/95 quote-fade">
            "{$currentQuote.quote}"
          </blockquote>
          <cite class="text-lg md:text-xl text-white/70 font-medium">
            — {$currentQuote.author}
          </cite>
        </div>

        <!-- Quote Counter -->
        <div class="text-white/60 text-sm font-medium">
          {$currentQuoteIndex + 1} of {$quotes.length}
        </div>
        
        <!-- Usage info for free users -->
        {#if !$subscriptionStatus.isPremium && !$subscriptionStatus.isTrialActive}
          <div class="bg-black/30 backdrop-blur-sm rounded-2xl p-4 border border-white/20">
            <p class="text-white/80 text-sm font-medium">
              Free Plan: {currentUsage.remaining} quotes remaining today
            </p>
            <button
              on:click={handleUpgrade}
              class="text-yellow-400 hover:text-yellow-300 text-sm font-medium underline mt-1"
            >
              Upgrade for unlimited access
            </button>
          </div>
        {/if}
      </div>

      <!-- TikTok-style Right Side Action Buttons -->
      <div class="absolute right-4 top-1/2 transform -translate-y-1/2 z-50 flex flex-col space-y-6">
        <!-- Like Button -->
        <button 
          on:click={handleLike}
          class="flex flex-col items-center space-y-2 p-3 transition-all duration-300 group"
          disabled={!$user}
        >
          <div class="relative w-14 h-14 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 group-hover:bg-black/50 transition-all duration-300 {!$user ? 'opacity-50' : ''}">
            <Heart 
              size={28} 
              class="transition-all duration-300 group-hover:scale-110 {
                $currentQuote.user_liked ? 'fill-red-500 text-red-500' : 'text-white group-hover:text-red-400'
              }" 
            />
            {#if $currentQuote.user_liked}
              <div class="absolute inset-0 bg-red-400/20 rounded-full blur-xl animate-pulse"></div>
            {/if}
          </div>
          <span class="text-xs font-bold text-white/90 min-w-[20px] text-center">
            {$currentQuote.likes_count || 0}
          </span>
        </button>

        <!-- Comments Button -->
        <button 
          on:click={handleShowComments}
          class="flex flex-col items-center space-y-2 p-3 transition-all duration-300 group"
        >
          <div class="relative w-14 h-14 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 group-hover:bg-black/50 transition-all duration-300">
            <MessageCircle 
              size={28} 
              class="transition-all duration-300 group-hover:scale-110 text-white group-hover:text-yellow-400 {
                showComments ? 'text-yellow-400' : ''
              }" 
            />
          </div>
          <span class="text-xs font-bold text-white/90 min-w-[20px] text-center">
            {$currentQuote.comments_count || 0}
          </span>
        </button>

        <!-- Share Button -->
        <button 
          on:click={handleShare}
          class="flex flex-col items-center space-y-2 p-3 transition-all duration-300 group"
        >
          <div class="relative w-14 h-14 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 group-hover:bg-black/50 transition-all duration-300">
            {#if copiedQuoteId === $currentQuote.id}
              <Check size={28} class="text-green-400 transition-all duration-300" />
            {:else}
              <Share2 size={28} class="text-white group-hover:text-blue-400 transition-all duration-300 group-hover:scale-110" />
            {/if}
          </div>
          <span class="text-xs font-bold text-white/90 min-w-[20px] text-center">
            {copiedQuoteId === $currentQuote.id ? '✓' : ($currentQuote.shares_count || 0)}
          </span>
        </button>

        <!-- Navigation Arrows -->
        <div class="flex flex-col space-y-2 mt-8">
          <button 
            on:click={prevQuote}
            class="w-12 h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-black/50 transition-all duration-300 group"
          >
            <ChevronUp size={24} class="text-white group-hover:text-blue-400 transition-all duration-300" />
          </button>
          <button 
            on:click={nextQuote}
            class="w-12 h-12 flex items-center justify-center rounded-full bg-black/30 backdrop-blur-sm border border-white/20 hover:bg-black/50 transition-all duration-300 group"
          >
            <ChevronDown size={24} class="text-white group-hover:text-blue-400 transition-all duration-300" />
          </button>
        </div>
      </div>

      <!-- Swipe Indicator -->
      <div class="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-40">
        <div class="flex flex-col items-center space-y-2 text-white/60">
          <div class="w-1 h-8 bg-white/30 rounded-full animate-bounce"></div>
          <p class="text-xs font-medium">Swipe up for next</p>
        </div>
      </div>
    </div>

    <!-- Comments Panel -->
    {#if showComments}
      <div class="fixed inset-0 z-60 bg-black/95 backdrop-blur-lg">
        <div class="h-full flex flex-col">
          <!-- Comments Header -->
          <div class="flex items-center justify-between p-4 border-b border-white/20 bg-black/50">
            <h3 class="text-xl font-bold">Comments</h3>
            <button 
              on:click={() => showComments = false}
              class="p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <!-- Comments List -->
          <div bind:this={commentsContainer} class="flex-1 overflow-y-auto p-4 space-y-4">
            {#if comments.length === 0}
              <div class="text-center py-12">
                <MessageCircle size={48} class="text-white/40 mx-auto mb-4" />
                <p class="text-white/60">No comments yet. Be the first to share your thoughts!</p>
              </div>
            {:else}
              {#each comments as comment}
                <div class="bg-white/10 rounded-2xl p-4 space-y-2 backdrop-blur-sm border border-white/10">
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-white/90">
                      {comment.user_name || comment.user_email || 'Anonymous'}
                    </span>
                    <span class="text-xs text-white/60">
                      {formatTime(comment.created_at)}
                    </span>
                  </div>
                  <p class="text-white/80 leading-relaxed">{comment.comment}</p>
                </div>
              {/each}
            {/if}
          </div>

          <!-- Add Comment -->
          {#if $user}
            <div class="p-4 border-t border-white/20 bg-black/50">
              <div class="flex space-x-3">
                <input
                  type="text"
                  bind:value={newComment}
                  on:keypress={handleKeyPress}
                  placeholder="Add a comment..."
                  class="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/60 focus:ring-2 focus:ring-yellow-400/50 focus:border-transparent transition-all backdrop-blur-sm"
                  disabled={addingComment}
                />
                <button
                  on:click={handleAddComment}
                  disabled={!newComment.trim() || addingComment}
                  class="px-6 py-3 bg-yellow-400 text-black rounded-xl font-medium hover:bg-yellow-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {#if addingComment}
                    <Loader size={18} class="animate-spin" />
                  {:else}
                    <Send size={18} />
                  {/if}
                  <span>{addingComment ? 'Posting...' : 'Post'}</span>
                </button>
              </div>
            </div>
          {:else}
            <div class="p-4 border-t border-white/20 bg-black/50 text-center">
              <p class="text-white/60">Please sign in to add comments</p>
            </div>
          {/if}
        </div>
      </div>
    {/if}
  {/if}
</div>

<!-- Subscription Modal -->
<SubscriptionModal 
  bind:isOpen={showSubscriptionModal}
  feature="Unlimited Motivation Quotes"
  onClose={() => showSubscriptionModal = false}
/>

<!-- Usage Limit Modal -->
<UsageLimitModal 
  bind:isOpen={showUsageLimitModal}
  service="motivationQuotes"
  remaining={usageInfo.remaining}
  limit={usageInfo.limit}
  onClose={() => showUsageLimitModal = false}
/>

<style>
  /* Custom scrollbar for comments */
  .overflow-y-auto::-webkit-scrollbar {
    width: 6px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  .overflow-y-auto::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }

  /* Quote fade animation */
  .quote-fade {
    animation: fadeIn 0.8s ease-in-out;
  }

  @keyframes fadeIn {
    from { 
      opacity: 0; 
      transform: translateY(20px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }

  /* Disable text selection for better mobile experience */
  .select-none {
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
  }

  /* Smooth transitions */
  * {
    transition-property: color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;
    transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
    transition-duration: 150ms;
  }

  /* Prevent overscroll on mobile */
  body {
    overscroll-behavior: none;
  }
</style>