<script>
  import { createEventDispatcher } from 'svelte'
  import { BookOpen, ChevronLeft, ChevronRight, RotateCcw, X } from '@lucide/svelte'

  export let mood = ''
  export let category = ''

  const dispatch = createEventDispatcher()

  let currentCardIndex = 0
  let showAnswer = false

  // Flashcard data based on mood
  const flashcardData = {
    '😊': {
      title: 'Joy Boosting Techniques',
      description: 'Techniques to maintain and amplify happiness',
      cards: [
        {
          front: 'Gratitude Practice',
          back: 'Write down 3 things you\'re grateful for each day. This simple practice rewires your brain to notice positive aspects of life and increases overall happiness.',
          tip: 'Try doing this first thing in the morning or before bed.'
        },
        {
          front: 'Savoring Moments',
          back: 'Consciously slow down and fully experience positive moments. Pay attention to details, emotions, and sensations to make good feelings last longer.',
          tip: 'Use all your senses when savoring - what do you see, hear, smell, taste, and feel?'
        },
        {
          front: 'Acts of Kindness',
          back: 'Performing kind acts for others releases endorphins and creates a "helper\'s high." Even small gestures can boost your mood significantly.',
          tip: 'Start with one small act of kindness each day - hold a door, compliment someone, or send a thoughtful message.'
        },
        {
          front: 'Positive Visualization',
          back: 'Spend 5 minutes visualizing your ideal day or a happy memory in vivid detail. This activates the same neural pathways as actually experiencing joy.',
          tip: 'Make it as detailed as possible - include sounds, smells, and emotions.'
        }
      ]
    },
    '😌': {
      title: 'Relaxation Techniques',
      description: 'Methods to deepen calm and find inner peace',
      cards: [
        {
          front: 'Progressive Muscle Relaxation',
          back: 'Tense and then relax each muscle group in your body, starting from your toes and working up to your head. This releases physical tension and calms the mind.',
          tip: 'Hold the tension for 5 seconds, then release and notice the contrast.'
        },
        {
          front: '4-7-8 Breathing',
          back: 'Inhale for 4 counts, hold for 7 counts, exhale for 8 counts. This breathing pattern activates your parasympathetic nervous system and promotes deep relaxation.',
          tip: 'Practice this technique lying down in a quiet space for best results.'
        },
        {
          front: 'Body Scan Meditation',
          back: 'Slowly move your attention through each part of your body, noticing sensations without judgment. This increases body awareness and releases tension.',
          tip: 'Start at the top of your head and work down to your toes, spending 30 seconds on each area.'
        },
        {
          front: 'Mindful Walking',
          back: 'Walk slowly and deliberately, focusing on each step and the sensations in your feet. This combines movement with mindfulness for active relaxation.',
          tip: 'Try walking barefoot on grass or sand for enhanced sensory experience.'
        }
      ]
    },
    '😢': {
      title: 'Comfort & Healing Cards',
      description: 'Gentle techniques for processing difficult emotions',
      cards: [
        {
          front: 'Emotional Validation',
          back: 'Acknowledge your feelings without judgment: "It makes sense that I feel this way given what I\'m going through." Validation is the first step to healing.',
          tip: 'Speak to yourself with the same compassion you\'d show a good friend.'
        },
        {
          front: 'Gentle Self-Care',
          back: 'Engage in nurturing activities: warm bath, soft music, comfortable clothes, or your favorite tea. Physical comfort supports emotional healing.',
          tip: 'Create a "comfort kit" with items that soothe you for difficult days.'
        },
        {
          front: 'Journaling Release',
          back: 'Write freely about your feelings without editing or censoring. This helps process emotions and often provides clarity and relief.',
          tip: 'Try writing for 10 minutes without stopping, even if you repeat yourself.'
        },
        {
          front: 'Connection Seeking',
          back: 'Reach out to a trusted friend, family member, or counselor. Sharing your burden lightens it and reminds you that you\'re not alone.',
          tip: 'Even a simple text saying "I\'m having a hard day" can open the door to support.'
        }
      ]
    },
    '😠': {
      title: 'Cooling Techniques',
      description: 'Constructive ways to channel and release anger',
      cards: [
        {
          front: 'The STOP Technique',
          back: 'S-top what you\'re doing, T-ake a breath, O-bserve your feelings and thoughts, P-roceed with intention. This creates space between trigger and reaction.',
          tip: 'Practice this during minor irritations to build the habit for bigger moments.'
        },
        {
          front: 'Physical Release',
          back: 'Channel anger energy through vigorous exercise: running, boxing, dancing, or even cleaning. Physical activity metabolizes stress hormones naturally.',
          tip: 'Keep a jump rope or resistance band handy for quick anger release.'
        },
        {
          front: 'Anger Journaling',
          back: 'Write an uncensored letter expressing all your anger (don\'t send it). This helps process the emotion and often reveals underlying hurt or fear.',
          tip: 'After writing, you can tear up or burn the letter as a symbolic release.'
        },
        {
          front: 'Cool Down Visualization',
          back: 'Imagine anger as heat leaving your body with each exhale, or visualize yourself in a cool, peaceful place. This helps regulate your nervous system.',
          tip: 'Picture the anger as a color that gradually fades or transforms into a calming color.'
        }
      ]
    },
    '😰': {
      title: 'Grounding Techniques',
      description: 'Tools to manage worry and find your center',
      cards: [
        {
          front: '5-4-3-2-1 Grounding',
          back: 'Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This anchors you in the present moment.',
          tip: 'Take your time with each sense and really focus on the details.'
        },
        {
          front: 'Square Breathing',
          back: 'Breathe in for 4 counts, hold for 4, exhale for 4, hold empty for 4. Repeat 4-8 times. This regulates your nervous system and reduces anxiety.',
          tip: 'Visualize drawing a square as you breathe to help maintain the rhythm.'
        },
        {
          front: 'Worry Time',
          back: 'Set aside 15 minutes daily to worry intentionally. When anxious thoughts arise outside this time, remind yourself to save them for "worry time."',
          tip: 'Write down worries during worry time, then problem-solve or practice acceptance.'
        },
        {
          front: 'Butterfly Hug',
          back: 'Cross your arms over your chest and gently pat alternating sides. This bilateral stimulation calms the nervous system and provides self-comfort.',
          tip: 'Breathe slowly while doing this and imagine sending yourself love and comfort.'
        }
      ]
    }
  }

  $: currentDeck = flashcardData[mood] || {
    title: 'General Wellness Cards',
    description: 'Basic wellness techniques',
    cards: [
      {
        front: 'Deep Breathing',
        back: 'Take slow, deep breaths to activate your body\'s relaxation response.',
        tip: 'Practice for 2-3 minutes whenever you feel stressed.'
      }
    ]
  }

  $: currentCard = currentDeck.cards[currentCardIndex]
  $: isFirstCard = currentCardIndex === 0
  $: isLastCard = currentCardIndex === currentDeck.cards.length - 1

  function nextCard() {
    if (!isLastCard) {
      currentCardIndex++
      showAnswer = false
    }
  }

  function previousCard() {
    if (!isFirstCard) {
      currentCardIndex--
      showAnswer = false
    }
  }

  function flipCard() {
    showAnswer = !showAnswer
  }

  function resetDeck() {
    currentCardIndex = 0
    showAnswer = false
  }

  function closeDeck() {
    dispatch('close')
  }
</script>

<div class="wellness-flashcards">
  <!-- Header -->
  <div class="flashcard-header">
    <div class="flex items-center space-x-3 mb-4">
      <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl flex items-center justify-center">
        <BookOpen size={24} class="text-white" />
      </div>
      <div>
        <h2 class="text-xl font-bold text-gray-800">{currentDeck.title}</h2>
        <p class="text-gray-600 text-sm">{currentDeck.description}</p>
      </div>
    </div>
    
    <!-- Progress -->
    <div class="flex items-center justify-between mb-6">
      <span class="text-sm text-gray-600">
        Card {currentCardIndex + 1} of {currentDeck.cards.length}
      </span>
      <button
        on:click={closeDeck}
        class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        <X size={18} class="text-gray-600" />
      </button>
    </div>
  </div>

  <!-- Flashcard -->
  <div class="flashcard-container">
    <div class="flashcard {showAnswer ? 'flipped' : ''}" on:click={flipCard}>
      <div class="flashcard-front">
        <div class="card-content">
          <h3 class="text-2xl font-bold text-gray-800 mb-4 text-center">
            {currentCard.front}
          </h3>
          <p class="text-gray-600 text-center">
            Tap to reveal technique
          </p>
        </div>
      </div>
      
      <div class="flashcard-back">
        <div class="card-content">
          <h3 class="text-lg font-bold text-gray-800 mb-4">
            {currentCard.front}
          </h3>
          <p class="text-gray-700 leading-relaxed mb-4">
            {currentCard.back}
          </p>
          {#if currentCard.tip}
            <div class="tip-section">
              <div class="flex items-center space-x-2 mb-2">
                <div class="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                  <span class="text-xs">💡</span>
                </div>
                <span class="text-sm font-semibold text-gray-700">Pro Tip</span>
              </div>
              <p class="text-sm text-gray-600 italic">
                {currentCard.tip}
              </p>
            </div>
          {/if}
        </div>
      </div>
    </div>
  </div>

  <!-- Navigation -->
  <div class="flashcard-navigation">
    <button
      on:click={previousCard}
      disabled={isFirstCard}
      class="nav-button {isFirstCard ? 'disabled' : ''}"
    >
      <ChevronLeft size={20} />
      <span>Previous</span>
    </button>
    
    <div class="flex items-center space-x-4">
      <button
        on:click={resetDeck}
        class="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        title="Reset to first card"
      >
        <RotateCcw size={18} class="text-gray-600" />
      </button>
      
      <div class="flex space-x-1">
        {#each currentDeck.cards as _, index}
          <button
            on:click={() => { currentCardIndex = index; showAnswer = false; }}
            class="w-2 h-2 rounded-full transition-colors {
              index === currentCardIndex ? 'bg-green-500' : 'bg-gray-300'
            }"
          ></button>
        {/each}
      </div>
    </div>
    
    <button
      on:click={nextCard}
      disabled={isLastCard}
      class="nav-button {isLastCard ? 'disabled' : ''}"
    >
      <span>Next</span>
      <ChevronRight size={20} />
    </button>
  </div>
</div>

<style>
  .wellness-flashcards {
    @apply bg-white rounded-3xl p-8 shadow-lg border border-gray-200 max-w-2xl mx-auto;
  }

  .flashcard-container {
    @apply relative mb-8;
    height: 300px;
    perspective: 1000px;
  }

  .flashcard {
    @apply relative w-full h-full cursor-pointer;
    transform-style: preserve-3d;
    transition: transform 0.6s;
  }

  .flashcard.flipped {
    transform: rotateY(180deg);
  }

  .flashcard-front,
  .flashcard-back {
    @apply absolute inset-0 w-full h-full rounded-2xl border-2 border-gray-200 flex items-center justify-center p-6;
    backface-visibility: hidden;
  }

  .flashcard-front {
    @apply bg-gradient-to-br from-green-50 to-teal-50 border-green-200;
  }

  .flashcard-back {
    @apply bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200;
    transform: rotateY(180deg);
  }

  .card-content {
    @apply w-full h-full flex flex-col justify-center;
  }

  .tip-section {
    @apply bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4;
  }

  .flashcard-navigation {
    @apply flex items-center justify-between;
  }

  .nav-button {
    @apply flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium text-gray-700;
  }

  .nav-button.disabled {
    @apply opacity-50 cursor-not-allowed hover:bg-gray-100;
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .flashcard-container {
      height: 250px;
    }
    
    .card-content {
      @apply text-sm;
    }
    
    .flashcard-front h3 {
      @apply text-xl;
    }
    
    .flashcard-back h3 {
      @apply text-base;
    }
  }
</style>