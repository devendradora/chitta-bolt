<script>
  import AuthForm from './AuthForm.svelte'
  import { Brain, Heart, Footprints, MessageCircle, Sparkles, Trophy, Check, Star } from '@lucide/svelte'
  
  let showAuthForm = false
  let isLogin = true
  
  function handleGetStarted() {
    showAuthForm = true
    isLogin = false // Default to signup for new users
  }
  
  function handleSignIn() {
    showAuthForm = true
    isLogin = true
  }
</script>

<div class="min-h-screen overflow-hidden">
  <!-- Hero Section -->
  <div class="relative min-h-screen">
    <!-- Background gradient - simplified to one consistent color scheme -->
    <div class="absolute inset-0 bg-gradient-to-br from-emerald-400 to-teal-600 overflow-hidden">
      <!-- Animated background elements -->
      <div class="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
      <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-white/15 rounded-full blur-3xl"></div>
      <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      
      <!-- Additional static elements -->
      <div class="absolute top-20 left-20 w-32 h-32 bg-white/8 rounded-full blur-2xl"></div>
      <div class="absolute bottom-20 right-20 w-24 h-24 bg-white/12 rounded-full blur-xl"></div>
      <div class="absolute top-1/3 right-1/4 w-16 h-16 bg-white/10 rounded-full blur-lg"></div>
    </div>

    {#if showAuthForm}
      <!-- Auth Form Section -->
      <div class="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div class="w-full max-w-md">
          <button 
            on:click={() => showAuthForm = false}
            class="mb-6 flex items-center text-white hover:text-white/80 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
            Back to Home
          </button>
          <AuthForm bind:isLogin={isLogin} />
        </div>
      </div>
    {:else}
      <!-- Landing Page Content -->
      <div class="relative z-10 container mx-auto px-4 py-12 md:py-24">
        <!-- Header with Sign In button -->
        <header class="flex justify-between items-center mb-16">
          <div class="flex items-center space-x-3">
            <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-sm border border-white/30 shadow-xl">
              <Brain class="text-white" size={32} />
            </div>
            <h1 class="text-4xl font-bold text-white drop-shadow-lg">Chitta</h1>
          </div>
          
          <!-- Added logo to the left of sign in button -->
          <div class="flex items-center space-x-4">
            <a 
              href="https://bolt.new" 
              target="_blank" 
              rel="noopener noreferrer"
              class="hover:opacity-80 transition-opacity duration-300 transform hover:scale-105"
            >
              <img 
                src="/src/lib/images/white_circle_360x360.png" 
                alt="Made with Bolt.new" 
                class="h-12 w-12"
              />
            </a>
            
            <button 
              on:click={handleSignIn}
              class="px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl font-medium hover:bg-white/30 transition-all duration-300 border border-white/30"
            >
              Sign In
            </button>
          </div>
        </header>

        <!-- Hero Content -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div class="space-y-8">
            <h2 class="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight drop-shadow-lg">
              Your Journey to <br />
              <span class="bg-gradient-to-r from-white to-teal-200 bg-clip-text text-transparent">Inner Peace</span> Begins Here
            </h2>
            <p class="text-xl text-white/90 leading-relaxed max-w-lg drop-shadow-md">
              Track your emotions, build mindful habits, and grow with personalized AI support—all while earning blockchain-secured achievements for your journey
            </p>
            <div class="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <button 
                on:click={handleGetStarted}
                class="px-8 py-4 bg-white text-emerald-600 rounded-xl font-bold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
              >
                Get Started Free
              </button>
              <a 
                href="#features"
                class="px-8 py-4 bg-emerald-700 text-white rounded-xl font-bold text-lg hover:bg-emerald-800 transition-all duration-300 border border-white/30 text-center shadow-lg"
              >
                Learn More
              </a>
            </div>
          </div>
          
          <!-- Animated Mood Emojis -->
          <div class="relative hidden lg:block">
            <div class="absolute inset-0 bg-white/5 backdrop-blur-sm rounded-3xl border border-white/20 transform rotate-6 scale-95"></div>
            <div class="absolute inset-0 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 transform -rotate-3 scale-95"></div>
            <div class="relative bg-white/15 backdrop-blur-md rounded-3xl border border-white/30 p-6 shadow-2xl">
              <div class="aspect-[9/16] rounded-2xl overflow-hidden border-8 border-white/20 relative">
                <img 
                  src="https://images.pexels.com/photos/3758048/pexels-photo-3758048.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" 
                  alt="Chitta App Preview" 
                  class="w-full h-full object-cover"
                />
                
                <!-- Animated Mood Emojis -->
                <div class="absolute inset-0 flex items-center justify-center">
                  <div class="relative w-48 h-48">
                    <!-- Brain in center -->
                    <div class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 bg-white/20 rounded-full flex items-center justify-center z-20 backdrop-blur-md border border-white/30">
                      <Brain size={40} class="text-white" />
                    </div>
                    
                    <!-- Orbiting emojis -->
                    <div class="absolute w-full h-full animate-spin" style="animation-duration: 15s;">
                      <div class="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center border border-white/30">
                        <span class="text-2xl">😊</span>
                      </div>
                    </div>
                    
                    <div class="absolute w-full h-full animate-spin" style="animation-duration: 20s; animation-delay: 1s;">
                      <div class="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center border border-white/30">
                        <span class="text-2xl">😢</span>
                      </div>
                    </div>
                    
                    <div class="absolute w-full h-full animate-spin" style="animation-duration: 18s; animation-delay: 2s;">
                      <div class="absolute left-0 top-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center border border-white/30">
                        <span class="text-2xl">😠</span>
                      </div>
                    </div>
                    
                    <div class="absolute w-full h-full animate-spin" style="animation-duration: 25s; animation-delay: 3s;">
                      <div class="absolute right-0 top-1/2 transform translate-x-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center border border-white/30">
                        <span class="text-2xl">😰</span>
                      </div>
                    </div>
                    
                    <!-- Additional emojis at angles -->
                    <div class="absolute w-full h-full animate-spin" style="animation-duration: 22s; animation-delay: 4s;">
                      <div class="absolute top-1/4 right-0 transform translate-x-1/2 -translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center border border-white/30">
                        <span class="text-2xl">😌</span>
                      </div>
                    </div>
                    
                    <div class="absolute w-full h-full animate-spin" style="animation-duration: 19s; animation-delay: 5s;">
                      <div class="absolute bottom-1/4 left-0 transform -translate-x-1/2 translate-y-1/2 bg-white/20 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center border border-white/30">
                        <span class="text-2xl">🤗</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>

  {#if !showAuthForm}
    <!-- Features Section -->
    <div id="features" class="bg-white py-24 px-4">
      <div class="container mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-gray-800 mb-4">Features Designed for Your Wellbeing</h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Chitta combines ancient wisdom with modern technology to support your mental wellness journey
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8 shadow-lg border border-primary-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6">
              <Brain size={32} class="text-white" />
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Guided Meditation</h3>
            <p class="text-gray-600">
              Discover peace with our guided meditation sessions, designed for all experience levels from beginners to advanced practitioners.
            </p>
          </div>
          
          <!-- Feature 2 -->
          <div class="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8 shadow-lg border border-primary-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6">
              <Heart size={32} class="text-white" />
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Mood Tracking</h3>
            <p class="text-gray-600">
              Monitor your emotional wellbeing with our intuitive mood tracking tools. Identify patterns and gain insights into your mental health.
            </p>
          </div>
          
          <!-- Feature 3 -->
          <div class="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8 shadow-lg border border-primary-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6">
              <MessageCircle size={32} class="text-white" />
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">AI Wellness Coach</h3>
            <p class="text-gray-600">
              Chat with our AI wellness coach for personalized guidance, support, and mental health resources anytime you need it.
            </p>
          </div>
          
          <!-- Feature 4 -->
          <div class="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8 shadow-lg border border-primary-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6">
              <Footprints size={32} class="text-white" />
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Activity Tracking</h3>
            <p class="text-gray-600">
              Monitor your walking, exercise, and other physical activities that contribute to your overall mental wellbeing.
            </p>
          </div>
          
          <!-- Feature 5 -->
          <div class="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8 shadow-lg border border-primary-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6">
              <Sparkles size={32} class="text-white" />
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Daily Motivation</h3>
            <p class="text-gray-600">
              Start each day with inspirational quotes and affirmations tailored to your personal wellness journey.
            </p>
          </div>
          
          <!-- Feature 6 -->
          <div class="bg-gradient-to-br from-primary-50 to-secondary-50 rounded-3xl p-8 shadow-lg border border-primary-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div class="w-16 h-16 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-2xl flex items-center justify-center mb-6">
              <Trophy size={32} class="text-white" />
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Achievement NFTs</h3>
            <p class="text-gray-600">
              Earn blockchain-verified achievements as you progress in your wellness journey, creating a permanent record of your growth.
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- How It Works Section -->
    <div class="bg-gradient-to-br from-primary-50 to-secondary-50 py-24 px-4">
      <div class="container mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-gray-800 mb-4">How Chitta Works</h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Your personal wellness companion in three simple steps
          </p>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <!-- Step 1 -->
          <div class="text-center">
            <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-primary-100">
              <span class="text-3xl font-bold text-primary-600">1</span>
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Create Your Account</h3>
            <p class="text-gray-600">
              Sign up in seconds and personalize your wellness profile to get started on your journey.
            </p>
          </div>
          
          <!-- Step 2 -->
          <div class="text-center">
            <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-primary-100">
              <span class="text-3xl font-bold text-primary-600">2</span>
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Track Your Wellbeing</h3>
            <p class="text-gray-600">
              Use our tools to meditate, track your mood, chat with our AI coach, and monitor your activities.
            </p>
          </div>
          
          <!-- Step 3 -->
          <div class="text-center">
            <div class="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg border-4 border-primary-100">
              <span class="text-3xl font-bold text-primary-600">3</span>
            </div>
            <h3 class="text-2xl font-bold text-gray-800 mb-4">Grow & Achieve</h3>
            <p class="text-gray-600">
              Watch your progress, earn achievements, and build lasting mental wellness habits.
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Testimonials Section -->
    <div class="bg-white py-24 px-4 overflow-hidden">
      <div class="container mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl font-bold text-gray-800 mb-4">What Our Users Say</h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Join thousands of users improving their mental wellness with Chitta
          </p>
        </div>
        
        <!-- Horizontally scrollable testimonials -->
        <div class="relative">
          <div class="flex overflow-x-auto pb-8 space-x-6 scrollbar-hide snap-x snap-mandatory">
            <!-- Testimonial 1 -->
            <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100 flex-shrink-0 w-full md:w-96 snap-center">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mr-4">
                  <span class="text-white font-bold">S</span>
                </div>
                <div>
                  <h4 class="font-bold text-gray-800">Shilpa</h4>
                </div>
              </div>
              <p class="text-gray-600 leading-relaxed">
                "Chitta has transformed my daily routine. The meditation sessions are perfect for my busy schedule, and I love tracking my progress with the achievement system."
              </p>
            </div>
            
            <!-- Testimonial 2 -->
            <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100 flex-shrink-0 w-full md:w-96 snap-center">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-4">
                  <span class="text-white font-bold">D</span>
                </div>
                <div>
                  <h4 class="font-bold text-gray-800">Dileep</h4>
                </div>
              </div>
              <p class="text-gray-600 leading-relaxed">
                "The AI coach has been incredibly helpful during stressful periods. It's like having a supportive friend available 24/7 who actually gives good advice!"
              </p>
            </div>
            
            <!-- Testimonial 3 -->
            <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100 flex-shrink-0 w-full md:w-96 snap-center">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mr-4">
                  <span class="text-white font-bold">V</span>
                </div>
                <div>
                  <h4 class="font-bold text-gray-800">Vinod</h4>
                </div>
              </div>
              <p class="text-gray-600 leading-relaxed">
                "I love how Chitta combines traditional mindfulness practices with modern technology. The mood tracking has helped me understand my emotional patterns."
              </p>
            </div>
            
            <!-- Testimonial 4 -->
            <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100 flex-shrink-0 w-full md:w-96 snap-center">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mr-4">
                  <span class="text-white font-bold">J</span>
                </div>
                <div>
                  <h4 class="font-bold text-gray-800">Jayram</h4>
                </div>
              </div>
              <p class="text-gray-600 leading-relaxed">
                "The blockchain achievements give me extra motivation to maintain my wellness routine. It's satisfying to see my progress permanently recorded."
              </p>
            </div>
            
            <!-- Testimonial 5 -->
            <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100 flex-shrink-0 w-full md:w-96 snap-center">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-500 rounded-full flex items-center justify-center mr-4">
                  <span class="text-white font-bold">R</span>
                </div>
                <div>
                  <h4 class="font-bold text-gray-800">Ramya</h4>
                </div>
              </div>
              <p class="text-gray-600 leading-relaxed">
                "Since using Chitta, my anxiety levels have decreased significantly. The guided meditations and mood tracking have been game-changers for my mental health."
              </p>
            </div>
            
            <!-- Testimonial 6 -->
            <div class="bg-white rounded-3xl p-8 shadow-lg border border-primary-100 flex-shrink-0 w-full md:w-96 snap-center">
              <div class="flex items-center mb-6">
                <div class="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full flex items-center justify-center mr-4">
                  <span class="text-white font-bold">A</span>
                </div>
                <div>
                  <h4 class="font-bold text-gray-800">Anita</h4>
                </div>
              </div>
              <p class="text-gray-600 leading-relaxed">
                "The sleep stories feature has completely transformed my bedtime routine. I fall asleep faster and wake up feeling more refreshed than ever before."
              </p>
            </div>
          </div>
          
          <!-- Scroll indicators -->
          <div class="flex justify-center space-x-2 mt-4">
            <div class="w-2 h-2 bg-primary-300 rounded-full"></div>
            <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
            <div class="w-2 h-2 bg-gray-300 rounded-full"></div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- CTA Section -->
    <div class="bg-gradient-to-br from-primary-500 to-secondary-500 py-24 px-4 text-white">
      <div class="container mx-auto text-center">
        <h2 class="text-4xl font-bold mb-6">Begin Your Wellness Journey Today</h2>
        <p class="text-xl text-white/90 max-w-2xl mx-auto mb-10">
          Join thousands of users who have transformed their mental wellbeing with Chitta's comprehensive suite of wellness tools.
        </p>
        <button 
          on:click={handleGetStarted}
          class="px-8 py-4 bg-white text-primary-600 rounded-xl font-bold text-lg hover:bg-white/90 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
        >
          Get Started Free
        </button>
      </div>
    </div>
    
    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12 px-4">
      <div class="container mx-auto">
        <div class="flex flex-col md:flex-row justify-between items-center">
          <div class="flex items-center space-x-3 mb-6 md:mb-0">
            <div class="bg-white/10 p-3 rounded-xl">
              <Brain class="text-white" size={24} />
            </div>
            <h2 class="text-2xl font-bold">Chitta</h2>
          </div>
          
          <div class="flex flex-wrap justify-center gap-6">
            <a href="#" class="text-white/80 hover:text-white transition-colors">About</a>
            <a href="#" class="text-white/80 hover:text-white transition-colors">Features</a>
            <a href="#" class="text-white/80 hover:text-white transition-colors">Pricing</a>
            <a href="#" class="text-white/80 hover:text-white transition-colors">Contact</a>
            <a href="#" class="text-white/80 hover:text-white transition-colors">Privacy</a>
            <a href="#" class="text-white/80 hover:text-white transition-colors">Terms</a>
          </div>
        </div>
        
        <div class="border-t border-white/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p class="text-white/60 mb-4 md:mb-0">© 2025 Chitta. All rights reserved.</p>
          
          <div class="flex items-center space-x-6">
            <div class="flex space-x-6">
              <a href="#" class="text-white/60 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path></svg>
              </a>
              <a href="#" class="text-white/60 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </a>
              <a href="#" class="text-white/60 hover:text-white transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
            </div>
            
            <!-- Added Bolt.new logo to footer -->
            <a 
              href="https://bolt.new" 
              target="_blank" 
              rel="noopener noreferrer"
              class="hover:opacity-80 transition-opacity duration-300 transform hover:scale-105"
            >
              <img 
                src="/src/lib/images/logotext_poweredby_360w.png" 
                alt="Powered by Bolt.new" 
                class="h-9 w-auto"
              />
            </a>
          </div>
        </div>
      </div>
    </footer>
  {/if}
</div>

<style>
  /* Smooth scrolling */
  html {
    scroll-behavior: smooth;
  }
  
  /* Animated background elements */
  .absolute {
    animation: float 10s ease-in-out infinite;
  }
  
  @keyframes float {
    0%, 100% { transform: translate(0, 0); }
    50% { transform: translate(-20px, 20px); }
  }
  
  /* Ensure the second and third elements have different animation timing */
  .absolute:nth-child(2) {
    animation-delay: -5s;
  }
  
  .absolute:nth-child(3) {
    animation-delay: -2.5s;
  }
  
  /* Hide scrollbar but allow scrolling */
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
  
  /* Snap scrolling */
  .snap-x {
    scroll-snap-type: x mandatory;
  }
  
  .snap-center {
    scroll-snap-align: center;
  }
</style>