<script>
  import { user } from '$lib/stores/auth.js'
  import { moods } from '$lib/stores/mood.js'
  import { Heart, Brain, Footprints, Dumbbell, Music, Camera, Users, Sparkles, Moon, TrendingUp, Zap } from '@lucide/svelte'

  const activities = [
    { 
      icon: Brain, 
      title: 'Meditation', 
      subtitle: '5-30 min sessions', 
      description: 'Find inner peace through guided meditation',
      color: 'bg-primary-500', 
      href: '/meditation' 
    },
    { 
      icon: Footprints, 
      title: 'Walking', 
      subtitle: 'Track your steps', 
      description: 'Monitor daily activity and reach your goals',
      color: 'bg-secondary-500', 
      href: '/walking'
    },
    { 
      icon: Dumbbell, 
      title: 'Exercise', 
      subtitle: 'Stay fit & healthy', 
      description: 'Workouts, yoga, and Surya Namaskara',
      color: 'bg-accent-500', 
      href: '/exercise'
    }
  ]

  const wellnessFeatures = [
    { icon: Moon, title: 'Sleep Stories', subtitle: 'Peaceful bedtime tales', color: 'bg-primary-500', href: '/wellness/sleep' },
    { icon: Camera, title: 'Gratitude', subtitle: 'Daily reflections', color: 'bg-secondary-500', href: '/wellness/gratitude' },
    { icon: Sparkles, title: 'Affirmations', subtitle: 'Positive self-talk', color: 'bg-accent-500', href: '/wellness/affirmations' }
  ]
</script>

<svelte:head>
  <title>Chitta - Your Mental Wellness Companion</title>
</svelte:head>

<div class="px-4 py-6 space-y-8 bg-gradient-to-br from-primary-50 via-white to-secondary-50 min-h-screen">
  <!-- Mood Check-in Section with Carousel -->
  <section class="space-y-6">
    <div class="text-center">
      <h2 class="text-2xl font-bold text-gray-800 mb-2">How are you feeling now?</h2>
    </div>
    
    <!-- Carousel Layout -->
    <div class="relative overflow-hidden">
      <div class="flex space-x-3 overflow-x-auto pb-6 px-4 scrollbar-hide snap-x snap-mandatory">
        {#each moods as mood, index}
          <a 
            href="/mood/{mood.emoji}"
            class="mood-card flex-shrink-0 w-20 bg-white rounded-3xl p-3 text-center space-y-2 hover:shadow-2xl transition-all duration-500 border border-primary-100 group relative overflow-hidden snap-center"
            style="animation-delay: {index * 100}ms"
          >
            <!-- Gradient overlay on hover -->
            <div class="absolute inset-0 bg-gradient-to-br from-primary-50 to-secondary-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-3xl"></div>
            
            <!-- Background div for emoji -->
            <div class="absolute inset-2 bg-gradient-to-br {mood.color} opacity-10 rounded-2xl"></div>
            
            <!-- Floating particles effect -->
            <div class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
              <div class="absolute top-1 left-1 w-1 h-1 bg-primary-300 rounded-full animate-ping"></div>
              <div class="absolute top-2 right-1 w-0.5 h-0.5 bg-secondary-400 rounded-full animate-pulse"></div>
              <div class="absolute bottom-1 left-1 w-0.5 h-0.5 bg-accent-300 rounded-full animate-bounce"></div>
            </div>
            
            <div class="relative z-10">
              <div class="text-3xl transform group-hover:scale-125 transition-transform duration-500 mb-2 group-hover:rotate-12">
                {mood.emoji}
              </div>
              <div class="text-xs font-bold text-gray-800 group-hover:text-primary-700 transition-colors duration-300">
                {mood.name}
              </div>
              
              <!-- Progress bar animation -->
              <div class="w-full h-0.5 bg-gray-100 rounded-full overflow-hidden mt-2">
                <div class="h-full {mood.color} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
              </div>
            </div>
          </a>
        {/each}
      </div>
      
      <!-- Scroll indicators -->
      <div class="flex justify-center space-x-2 mt-4">
        {#each moods as _, index}
          <div class="w-2 h-2 bg-gray-300 rounded-full transition-colors duration-300"></div>
        {/each}
      </div>
    </div>
  </section>

  <!-- Daily Quote -->
  <section class="relative overflow-hidden">
    <div class="bg-gradient-to-r from-primary-500 via-secondary-500 to-primary-600 rounded-3xl p-8 text-white text-center shadow-2xl relative">
      <!-- Animated background elements -->
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-4 -left-4 w-24 h-24 bg-white/10 rounded-full blur-xl animate-pulse"></div>
        <div class="absolute -bottom-4 -right-4 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse" style="animation-delay: 1s"></div>
        <div class="absolute top-1/2 left-1/4 w-16 h-16 bg-white/5 rounded-full blur-lg animate-bounce" style="animation-delay: 2s"></div>
      </div>
      
      <div class="relative z-10">
        <div class="flex justify-center mb-6">
          <div class="bg-white/20 p-4 rounded-full">
            <Sparkles size={36} class="text-white floating" />
          </div>
        </div>
        <h3 class="font-bold mb-4 text-2xl">Daily Inspiration</h3>
        <p class="text-lg opacity-95 leading-relaxed mb-4 font-medium">
          "The mind is like water. When agitated, it becomes difficult to see. When calm, everything becomes clear."
        </p>
        <p class="text-sm opacity-80 font-medium">- Prasad Mahes</p>
      </div>
    </div>
  </section>

  <!-- Quick Activities - Horizontal Scroll -->
  <section class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-800 text-center">Quick Activities</h2>
    
    <div class="relative">
      <div class="flex space-x-4 overflow-x-auto pb-4 px-2 scrollbar-hide snap-x snap-mandatory">
        {#each activities as activity, index}
          <a 
            href={activity.href}
            class="activity-card flex-shrink-0 w-72 bg-white rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-primary-100 group relative overflow-hidden snap-center"
            style="animation-delay: {index * 150}ms"
          >
            <!-- Gradient background -->
            <div class="absolute inset-0 bg-gradient-to-br from-white to-primary-25 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div class="relative z-10">
              <div class="flex items-start space-x-4 mb-4">
                <div class="{activity.color} p-4 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:-rotate-3 flex-shrink-0">
                  <svelte:component this={activity.icon} class="text-white" size={28} />
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-bold text-gray-800 text-xl group-hover:text-primary-700 transition-colors duration-300">
                    {activity.title}
                  </h3>
                  <p class="text-sm text-gray-600 group-hover:text-gray-700 transition-colors mb-2">
                    {activity.subtitle}
                  </p>
                  <p class="text-sm text-gray-500 leading-relaxed">
                    {activity.description}
                  </p>
                </div>
              </div>
              
              <!-- Animated progress bar -->
              <div class="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <div class="h-full bg-gradient-to-r from-primary-400 to-secondary-400 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-700 origin-left"></div>
              </div>
            </div>
          </a>
        {/each}
      </div>
      
      <!-- Scroll hint -->
      <div class="flex justify-center mt-4">
        <div class="flex items-center space-x-2 text-gray-500 text-sm">
          <span>Swipe to explore</span>
          <div class="flex space-x-1">
            <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Wellness Features -->
  <section class="space-y-6">
    <h2 class="text-2xl font-bold text-gray-800 text-center">Wellness Tools</h2>
    
    <div class="space-y-4">
      {#each wellnessFeatures as feature, index}
        <a 
          href={feature.href}
          class="bg-white rounded-3xl p-4 md:p-6 shadow-lg flex items-center space-x-4 md:space-x-6 hover:shadow-2xl transition-all duration-500 border border-primary-100 group cursor-pointer relative overflow-hidden"
          style="animation-delay: {index * 100}ms"
        >
          <!-- Hover gradient -->
          <div class="absolute inset-0 bg-gradient-to-r from-primary-25 to-secondary-25 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          <div class="relative z-10 flex items-center space-x-4 md:space-x-6 w-full">
            <div class="{feature.color} p-4 md:p-5 rounded-2xl shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 flex-shrink-0">
              <svelte:component this={feature.icon} class="text-white" size={24} />
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="font-bold text-gray-800 text-lg md:text-xl group-hover:text-primary-700 transition-colors duration-300">
                {feature.title}
              </h3>
              <p class="text-sm text-gray-600 group-hover:text-gray-700 transition-colors">
                {feature.subtitle}
              </p>
            </div>
            <div class="text-primary-400 group-hover:text-primary-600 transition-all duration-300 group-hover:scale-125 flex-shrink-0">
              <Zap size={20} class="transform group-hover:rotate-12" />
            </div>
          </div>
        </a>
      {/each}
    </div>
  </section>
</div>

<style>
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .mood-card {
    animation: slideUp 0.8s ease-out forwards;
    opacity: 0;
    transform: translateY(30px);
  }

  .activity-card {
    animation: slideUp 0.8s ease-out forwards;
    opacity: 0;
    transform: translateY(30px);
  }

  @keyframes slideUp {
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .floating {
    animation: float 4s ease-in-out infinite;
  }

  @keyframes float {
    0%, 100% { 
      transform: translateY(0px) rotate(0deg); 
    }
    50% { 
      transform: translateY(-15px) rotate(5deg); 
    }
  }

  /* Smooth scroll for carousel */
  .snap-x {
    scroll-snap-type: x mandatory;
  }
  
  .snap-center {
    scroll-snap-align: center;
  }

  /* Mobile responsiveness improvements */
  @media (max-width: 640px) {
    .activity-card {
      @apply w-64;
    }
  }
</style>