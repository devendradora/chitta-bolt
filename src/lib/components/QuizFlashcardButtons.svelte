<script>
  import { BookOpen, Brain, Play, Sparkles } from '@lucide/svelte'
  import { subscriptionStatus, canUseFeature } from '$lib/stores/subscription.js'

  export let mood = ''
  export let category = ''
  export let onQuizStart = () => {}
  export let onFlashcardsStart = () => {}
  export let onUpgradeRequired = () => {}

  $: canUseQuizFeatures = canUseFeature('quizFlashcards')

  const moodActivities = {
    '😊': {
      quiz: 'Happiness & Gratitude Quiz',
      flashcards: 'Joy Boosting Techniques',
      description: 'Explore what brings you joy and learn to amplify positive emotions'
    },
    '😌': {
      quiz: 'Mindfulness & Calm Quiz',
      flashcards: 'Relaxation Techniques',
      description: 'Deepen your understanding of peace and tranquility practices'
    },
    '😢': {
      quiz: 'Emotional Processing Quiz',
      flashcards: 'Comfort & Healing Cards',
      description: 'Learn healthy ways to process and work through difficult emotions'
    },
    '😠': {
      quiz: 'Anger Management Quiz',
      flashcards: 'Cooling Techniques',
      description: 'Discover constructive ways to channel and release anger'
    },
    '😰': {
      quiz: 'Anxiety Coping Quiz',
      flashcards: 'Grounding Techniques',
      description: 'Master tools to manage worry and find your center'
    },
    '😴': {
      quiz: 'Energy & Rest Quiz',
      flashcards: 'Vitality Boosters',
      description: 'Learn to restore energy and combat fatigue naturally'
    },
    '🤗': {
      quiz: 'Love & Connection Quiz',
      flashcards: 'Relationship Cards',
      description: 'Strengthen bonds and cultivate meaningful connections'
    },
    '😤': {
      quiz: 'Frustration Relief Quiz',
      flashcards: 'Patience Practices',
      description: 'Transform frustration into productive action and inner peace'
    }
  }

  const categoryActivities = {
    'Work': {
      quiz: 'Workplace Wellness Quiz',
      flashcards: 'Professional Balance Cards'
    },
    'Relationships': {
      quiz: 'Relationship Dynamics Quiz',
      flashcards: 'Communication Cards'
    },
    'Health': {
      quiz: 'Wellness Knowledge Quiz',
      flashcards: 'Healthy Habits Cards'
    },
    'Family': {
      quiz: 'Family Harmony Quiz',
      flashcards: 'Family Connection Cards'
    },
    'Achievement': {
      quiz: 'Success Mindset Quiz',
      flashcards: 'Goal Achievement Cards'
    },
    'Love': {
      quiz: 'Love Languages Quiz',
      flashcards: 'Romance & Affection Cards'
    }
  }

  function handleQuizClick() {
    if (!canUseQuizFeatures) {
      onUpgradeRequired()
      return
    }
    onQuizStart()
  }

  function handleFlashcardsClick() {
    if (!canUseQuizFeatures) {
      onUpgradeRequired()
      return
    }
    onFlashcardsStart()
  }

  function getActivityInfo() {
    const moodInfo = moodActivities[mood] || {}
    const categoryInfo = categoryActivities[category] || {}
    
    return {
      quiz: categoryInfo.quiz || moodInfo.quiz || 'Wellness Quiz',
      flashcards: categoryInfo.flashcards || moodInfo.flashcards || 'Wellness Cards',
      description: moodInfo.description || 'Explore wellness techniques and insights'
    }
  }

  $: activityInfo = getActivityInfo()
</script>

<div class="quiz-flashcard-section">
  <div class="section-header">
    <div class="flex items-center space-x-3 mb-3">
      <div class="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
        <Sparkles size={20} class="text-white" />
      </div>
      <div>
        <h3 class="text-lg font-bold text-gray-800">Explore & Learn</h3>
        <p class="text-sm text-gray-600">{activityInfo.description}</p>
      </div>
    </div>
    
    {#if !canUseQuizFeatures}
      <div class="premium-badge">
        <Sparkles size={14} class="text-orange-400" />
        <span class="text-orange-600 text-xs font-bold">Premium Feature</span>
      </div>
    {/if}
  </div>

  <div class="activities-grid">
    <!-- Quiz Button -->
    <button
      on:click={handleQuizClick}
      class="activity-card quiz-card"
      class:premium-locked={!canUseQuizFeatures}
    >
      <div class="activity-icon quiz-icon">
        <Brain size={24} class="text-white" />
        {#if !canUseQuizFeatures}
          <div class="lock-overlay">
            <Sparkles size={16} class="text-orange-400" />
          </div>
        {/if}
      </div>
      
      <div class="activity-content">
        <h4 class="activity-title">{activityInfo.quiz}</h4>
        <p class="activity-description">
          {#if canUseQuizFeatures}
            Test your knowledge and learn new insights about your emotional state
          {:else}
            Unlock interactive quizzes to deepen your self-understanding
          {/if}
        </p>
        
        <div class="activity-action">
          <Play size={16} class="mr-2" />
          <span>{canUseQuizFeatures ? 'Start Quiz' : 'Upgrade to Play'}</span>
        </div>
      </div>
    </button>

    <!-- Flashcards Button -->
    <button
      on:click={handleFlashcardsClick}
      class="activity-card flashcards-card"
      class:premium-locked={!canUseQuizFeatures}
    >
      <div class="activity-icon flashcards-icon">
        <BookOpen size={24} class="text-white" />
        {#if !canUseQuizFeatures}
          <div class="lock-overlay">
            <Sparkles size={16} class="text-orange-400" />
          </div>
        {/if}
      </div>
      
      <div class="activity-content">
        <h4 class="activity-title">{activityInfo.flashcards}</h4>
        <p class="activity-description">
          {#if canUseQuizFeatures}
            Browse curated techniques and tips for your current emotional state
          {:else}
            Access personalized flashcards with wellness techniques
          {/if}
        </p>
        
        <div class="activity-action">
          <BookOpen size={16} class="mr-2" />
          <span>{canUseQuizFeatures ? 'Browse Cards' : 'Upgrade to Access'}</span>
        </div>
      </div>
    </button>
  </div>

  {#if !canUseQuizFeatures}
    <div class="upgrade-prompt">
      <div class="upgrade-content">
        <h4 class="font-semibold text-gray-800 mb-2">Unlock Interactive Learning</h4>
        <p class="text-sm text-gray-600 mb-3">
          Get personalized quizzes and flashcards tailored to your mood and situation
        </p>
        <ul class="text-xs text-gray-500 space-y-1 mb-4">
          <li>• Mood-specific learning content</li>
          <li>• Interactive wellness quizzes</li>
          <li>• Personalized technique cards</li>
          <li>• Progress tracking</li>
        </ul>
        <button
          on:click={onUpgradeRequired}
          class="upgrade-button"
        >
          Upgrade for Learning Tools
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .quiz-flashcard-section {
    @apply bg-white rounded-3xl p-6 shadow-lg border border-gray-200 space-y-6;
  }

  .section-header {
    @apply flex items-start justify-between;
  }

  .premium-badge {
    @apply flex items-center space-x-1 px-2 py-1 bg-orange-50 border border-orange-200 rounded-full;
  }

  .activities-grid {
    @apply grid grid-cols-1 md:grid-cols-2 gap-4;
  }

  .activity-card {
    @apply p-4 rounded-2xl border-2 border-gray-200 hover:border-primary-300 transition-all duration-300 text-left group relative overflow-hidden;
  }

  .activity-card:hover {
    @apply shadow-lg transform -translate-y-1;
  }

  .activity-card.premium-locked {
    @apply border-orange-200 hover:border-orange-300;
  }

  .activity-icon {
    @apply w-12 h-12 rounded-xl flex items-center justify-center mb-3 relative;
  }

  .quiz-icon {
    @apply bg-gradient-to-r from-blue-500 to-indigo-500;
  }

  .flashcards-icon {
    @apply bg-gradient-to-r from-green-500 to-teal-500;
  }

  .lock-overlay {
    @apply absolute -top-1 -right-1 w-6 h-6 bg-orange-100 border-2 border-orange-300 rounded-full flex items-center justify-center;
  }

  .activity-content {
    @apply space-y-2;
  }

  .activity-title {
    @apply font-bold text-gray-800 group-hover:text-primary-700 transition-colors;
  }

  .activity-description {
    @apply text-sm text-gray-600 leading-relaxed;
  }

  .activity-action {
    @apply flex items-center text-sm font-medium text-primary-600 group-hover:text-primary-700 transition-colors mt-3;
  }

  .upgrade-prompt {
    @apply bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-4;
  }

  .upgrade-content {
    @apply text-center;
  }

  .upgrade-button {
    @apply w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-2 px-4 rounded-xl font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-300;
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .activities-grid {
      @apply grid-cols-1;
    }
    
    .section-header {
      @apply flex-col space-y-3;
    }
  }
</style>