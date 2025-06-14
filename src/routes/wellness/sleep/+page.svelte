<script>
  import { onMount } from 'svelte'
  import { ArrowLeft, Moon, Star, Clock, Heart } from '@lucide/svelte'
  import { goto } from '$app/navigation'
  import TextToSpeechPlayer from '$lib/components/TextToSpeechPlayer.svelte'

  let selectedStory = null
  let showStoryContent = false

  // Sleep stories data
  const sleepStories = [
    {
      id: 'ocean-waves',
      title: 'Ocean Waves',
      description: 'A peaceful journey along a serene coastline',
      duration: '15 min',
      image: 'https://images.pexels.com/photos/1295138/pexels-photo-1295138.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      content: `As you settle in, allow your body to find a comfortable position. Feel the weight of your body sinking into the surface beneath you. Take a deep breath in through your nose, and exhale slowly through your mouth. With each breath, feel yourself becoming more relaxed.

Imagine yourself walking along a beautiful, secluded beach. The sun is beginning to set, casting a golden glow across the landscape. The sand beneath your feet is warm and soft, molding perfectly around your steps. With each step, you feel more connected to the earth, more grounded, more at peace.

The gentle rhythm of the ocean waves creates a soothing soundtrack. Listen as each wave builds, crests, and then softly breaks upon the shore. The sound is hypnotic, washing away your thoughts, your worries, your tensions.

The air is warm with a refreshing breeze that carries the scent of salt and seaweed. Breathe it in deeply, filling your lungs with this purifying ocean air. As you exhale, release any remaining tension in your body.

You decide to sit on the soft sand, facing the vast expanse of the ocean. The horizon stretches endlessly before you, where the deep blue sea meets the colorful sky. The sun continues its descent, painting the clouds in brilliant hues of orange, pink, and purple.

As you gaze at the ocean, notice how the water sparkles with the last rays of sunlight. Each wave brings a sense of renewal as it washes upon the shore. Just like these waves, your breath continues its natural rhythm – in and out, rising and falling.

The temperature begins to cool as the sun dips lower. The breeze caresses your skin, bringing a pleasant coolness that deepens your relaxation. You feel completely at ease in this moment, in this beautiful place.

Stars begin to appear in the darkening sky, first one, then another, until the heavens are sprinkled with these distant lights. The moon rises, casting a silver path across the water that seems to lead to infinity.

The sound of the waves continues its constant, soothing rhythm. Each wave is different, yet part of the same eternal cycle. Like your breath, like the beating of your heart, this rhythm connects you to the natural world and to the deepest part of yourself.

As night fully embraces the beach, the world becomes simplified – the dark silhouette of the land, the silver-touched water, the star-filled sky. In this simplicity, your mind finds peace. Your thoughts become quieter, less insistent.

The moonlight bathes everything in a gentle glow. The waves continue their dance with the shore, now illuminated by this celestial light. The sound remains constant, hypnotic, drawing you deeper into relaxation.

Your eyelids become heavier with each passing moment. The rhythm of the waves synchronizes with your heartbeat, with your breath. You are safe here, completely at peace, drifting gently toward sleep.

As you continue to rest on this moonlit beach, allow yourself to drift deeper and deeper into relaxation. The boundaries between you and the world around you begin to soften. You are part of this beautiful scene – as natural as the sand, the sea, the stars above.

The waves continue their eternal song, lulling you toward sleep. Your breath becomes slower, deeper. Your body feels heavy, perfectly supported by the soft sand beneath you. Your mind grows quieter with each passing moment.

And as you drift toward sleep, know that this peaceful beach will remain in your heart. You can return here whenever you wish, finding the same peace, the same connection, the same gentle rhythm of the waves.

Sleep now, carried by the waves, under the watchful stars, completely at peace.`
    },
    {
      id: 'enchanted-forest',
      title: 'The Enchanted Forest',
      description: 'A magical journey through an ancient woodland',
      duration: '20 min',
      image: 'https://images.pexels.com/photos/1179229/pexels-photo-1179229.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      content: `Make yourself comfortable, allowing your body to be fully supported. Take a deep breath in, and as you exhale, feel the tension begin to leave your body. With each breath, you become more relaxed, more at ease.

Imagine yourself standing at the edge of an ancient forest. The trees here are impossibly tall, their canopies creating a cathedral-like ceiling high above. Dappled sunlight filters through the leaves, creating patterns of light and shadow on the forest floor.

As you step onto the soft path, notice how it cushions your feet. The air here is different – fresher, richer, filled with the scent of earth and growing things. Each breath you take fills you with vitality and deepens your relaxation.

The forest is alive with gentle sounds – the soft rustling of leaves in the breeze, the distant call of birds, the occasional scurry of a small woodland creature. These sounds create a natural symphony that calms your mind and soothes your spirit.

You follow the winding path deeper into the forest. Ancient trees stand like guardians on either side, their massive trunks wrapped in soft moss. Some of these trees have been here for hundreds of years, witnessing the passing of time with patient dignity.

The path leads you to a small clearing where wildflowers grow in abundance. Purple, yellow, and white blossoms nod gently in the breeze. Butterflies dance from flower to flower, their delicate wings catching the sunlight.

In the center of the clearing is an old stone bench, as if placed there just for you. You sit down, feeling the cool, smooth stone beneath you. From here, you can see the beauty of the forest from all angles – the majestic trees, the carpet of flowers, the glimpses of sky above.

A small stream meanders along the edge of the clearing, its water crystal clear and sparkling in the dappled light. The gentle sound of flowing water adds another layer to the forest's peaceful melody.

As you sit on the bench, you notice your breathing has slowed to match the rhythm of the forest. Your thoughts have quieted, replaced by a sense of wonder and tranquility. Time seems different here – unhurried, flowing like the stream.

A gentle breeze caresses your face, bringing with it the sweet scent of wildflowers and pine. The temperature is perfect – not too warm, not too cool – enveloping you in comfort.

Small birds with bright feathers flit among the branches above. Their cheerful songs seem to welcome you, acknowledging your presence in their world. You feel a sense of belonging, of being exactly where you should be.

The light begins to shift as the day moves toward evening. The forest takes on a golden hue, the sunlight now coming at a lower angle through the trees. This golden light seems to infuse everything with a magical quality.

You notice that some of the flowers in the clearing have begun to glow softly, emitting a gentle blue-white light. As twilight deepens, more of these luminescent blooms appear, creating a magical scene straight from a fairy tale.

Fireflies begin to emerge, their tiny lights blinking on and off as they float through the air. They hover around the glowing flowers, adding their own ephemeral beauty to the enchanted scene.

The forest has transformed in the twilight, becoming even more magical, more serene. The sounds have changed too – the daytime birds have quieted, replaced by the soft hooting of an owl and the gentle chirping of crickets.

As night fully embraces the forest, the canopy of trees above reveals glimpses of the star-filled sky. The moon rises, sending shafts of silver light down through the branches, creating a patchwork of light and shadow.

You remain on the bench, perfectly comfortable, perfectly at peace. The magical beauty of the forest at night surrounds you, cradling you in its tranquil embrace. Your eyelids begin to feel heavy as a profound sense of peace washes over you.

The gentle sounds of the forest – the stream, the night breeze in the leaves, the distant owl – create a lullaby that draws you toward sleep. Your breathing is deep and regular, your body completely relaxed.

As you drift toward sleep, know that this enchanted forest remains in your heart. You can return here whenever you wish, finding the same magic, the same peace, the same sense of wonder.

Sleep now, surrounded by the gentle magic of the forest, under the watchful stars, completely at peace.`
    },
    {
      id: 'starry-night',
      title: 'Beneath the Starry Night',
      description: 'A peaceful night under the cosmic canopy',
      duration: '18 min',
      image: 'https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      content: `Find a comfortable position and allow your body to settle. Take a slow, deep breath in through your nose, and exhale gently through your mouth. With each breath, feel yourself becoming more relaxed, more at ease.

Imagine yourself lying on a soft blanket in a wide, open meadow. The day has just ended, and the last traces of sunset are fading from the horizon. The air is perfectly still and comfortably cool against your skin.

As the daylight fades, the first stars begin to appear in the darkening sky. At first, you see only one or two – the brightest ones that pierce through the last light of day. But as the minutes pass, more and more stars reveal themselves.

The meadow around you is quiet now. The daytime sounds of birds and insects have given way to the peaceful silence of evening, occasionally punctuated by the gentle chirping of crickets or the soft call of a night bird.

The grass beneath your blanket is soft and fragrant, releasing the collected warmth of the day. You feel perfectly supported, perfectly comfortable, as you gaze upward at the expanding canvas of stars.

Now the sky has darkened completely, and the full majesty of the night sky is revealed. Thousands upon thousands of stars glitter above you – some bright and bold, others so faint they seem to flicker in and out of existence. The longer you look, the more stars you see, as your eyes adjust to the darkness.

The great river of the Milky Way stretches across the sky, a misty band containing countless stars too numerous and distant to distinguish individually. This is our home galaxy, seen from within – a cosmic neighborhood of unimaginable vastness.

As you gaze at this celestial display, you become aware of the immense scale of the universe. Each of those points of light is a sun, many of them far larger and brighter than our own. Around some of them, planets circle in their eternal dance, just as our Earth circles our sun.

Yet despite the vastness of space and the countless worlds it contains, you feel not insignificant but connected. The atoms in your body were forged in the hearts of stars long ago. You are made of stardust, a child of the cosmos observing its own grandeur.

A shooting star streaks across the sky – a brief, brilliant moment of beauty. Make a wish, if you like, on this cosmic traveler. Then another appears, and another. Tonight, it seems, the heavens are putting on a special display just for you.

The constellations take shape as you continue to gaze upward. Perhaps you can identify some of them – Orion with his distinctive belt, the Big Dipper pointing the way to the North Star, the graceful curve of the Corona Borealis. These patterns have guided travelers and inspired dreamers for thousands of years.

The moon rises now, a silver crescent that adds its gentle light to the scene. It climbs slowly higher, casting subtle shadows across the meadow. Its familiar face is a reminder of the constancy of the cosmos, the reliable rhythms of the heavens.

As you lie beneath this canopy of stars, your breathing has become slow and deep. Your body feels heavy and relaxed, melting into the earth beneath you. Your mind has quieted, filled only with the peaceful beauty of the night sky.

The vastness above you seems to expand your consciousness, dissolving the boundaries of everyday concerns. In this moment, there is only this perfect peace, this connection to something greater than yourself.

The night air has cooled further, but you remain perfectly comfortable on your blanket. The temperature is ideal for deep, restful sleep – cool enough to snuggle into your covers, but not so cold as to cause discomfort.

The stars continue their slow wheel across the sky, following paths they have traced for billions of years. There is something deeply reassuring about their constancy, their ancient light reaching you across the vast distances of space.

Your eyelids begin to feel heavy now, the starry panorama above you gently blurring as your eyes close for longer periods. Each time you blink, it becomes more difficult to open your eyes again, as sleep begins to claim you.

As you drift toward sleep, know that the stars continue their eternal dance above you. You remain connected to this cosmic display, this universal beauty, even as your consciousness fades into dreams.

Sleep now, beneath the canopy of stars, held in the gentle embrace of the universe, completely at peace.`
    },
    {
      id: 'mountain-cabin',
      title: 'Mountain Cabin Retreat',
      description: 'A cozy evening in a remote mountain hideaway',
      duration: '22 min',
      image: 'https://images.pexels.com/photos/803226/pexels-photo-803226.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      content: `Make yourself comfortable and allow your body to fully relax. Take a deep breath in, filling your lungs completely, and then exhale slowly, releasing any tension you might be holding. Continue to breathe naturally, each breath bringing you deeper into a state of calm.

Imagine yourself arriving at a small, secluded cabin nestled in the mountains. It's late afternoon, and the journey here has been long but rewarding. The cabin stands before you, crafted from rich, dark wood with a gently sloping roof. Smoke curls lazily from the stone chimney, promising warmth inside.

As you approach, you notice the details of this perfect retreat – window boxes filled with alpine flowers, a covered porch with a wooden rocking chair, and a path of flat stones leading to the sturdy front door. The air here is different – crisp, clean, and scented with pine and wood smoke.

You step onto the porch and open the door, entering the cabin. Inside, it's everything you hoped for – a single cozy room with a stone fireplace where flames dance and crackle. The interior is warm, both in temperature and in its amber glow. A comfortable-looking bed with thick quilts sits against one wall, a small wooden table and chairs near a window, and a plush armchair beside the fire.

The cabin is tidy and welcoming, with simple, rustic furnishings that feel authentic and homey. A kettle simmers gently on a small stove in the corner. The windows frame views of the surrounding forest and mountains, now bathed in the golden light of late afternoon.

You set down your things and move to the armchair by the fire. As you sink into its softness, you feel the warmth of the flames on your face and the day's journey beginning to melt from your muscles. The chair seems to embrace you, providing perfect support for your tired body.

Outside the window, you can see that the sun is setting behind the mountains. The sky is painted in spectacular colors – deep oranges, fiery reds, and soft purples. The silhouettes of pine trees stand dark against this brilliant canvas, their shapes perfectly still in the windless evening.

You rise briefly to prepare a cup of tea from the simmering kettle. The cabin is stocked with everything you need – a wooden canister of fragrant tea leaves, honey, and a handmade ceramic mug. The simple act of preparing this warm drink feels grounding and pleasurable.

With your tea in hand, you return to the armchair. The first sip is perfect – hot but not burning, sweet but not cloying, the flavor complex and comforting. You feel the warmth of the liquid traveling through your body, adding to the cozy contentment that has begun to envelop you.

The light outside continues to fade as you enjoy your tea. The mountains are now dark silhouettes against a deep blue sky where the first stars have begun to appear. Inside, the firelight creates a dance of light and shadow on the wooden walls and ceiling beams.

You can hear the gentle crackling of the fire, the occasional soft pop of a log shifting as it burns. Beyond that, there is only silence – the profound, peaceful silence of the mountains, so different from the constant background noise of everyday life.

As night fully claims the landscape, you prepare for sleep. The bed calls to you with its thick mattress and layers of quilts and blankets. You pull back the covers to find sheets that are somehow both crisp and soft, cool to the touch but promising warmth.

Before settling in, you step outside onto the porch one last time. The night air is cold and bracing, filled with the scent of pine and earth. The sky above is a spectacular field of stars, more than you can ever see in the city, their light brilliant and unwavering in the clear mountain air.

You take a few deep breaths of this perfect air, feeling it fill your lungs with vitality and peace. The silhouettes of the mountains are visible only as deeper areas of darkness against the star-filled sky, ancient and enduring presences in the landscape.

Back inside, you bank the fire for the night, leaving just enough flame to cast a gentle, flickering light and maintain the cabin's perfect warmth. Then you slip between the sheets of the waiting bed. The mattress seems to conform to your body, supporting you exactly where you need it.

You pull the quilts up around you, creating a cocoon of warmth. Their weight is substantial but not heavy, providing a sense of security and comfort. The pillow cradles your head perfectly, inviting you to sink into its softness.

From the bed, you can still see the last flames dancing in the fireplace, hear the occasional soft crackle of the embers. The cabin holds you in its warm embrace, a perfect shelter in the vast wilderness of the mountains.

Your body feels heavy now, pleasantly weary from the journey and completely relaxed in this haven of comfort. Your mind is quiet, filled only with the simple sensations of warmth, softness, and peace.

As your eyelids grow heavier, you surrender to the perfect tranquility of this mountain retreat. The last thing you're aware of is the gentle glow of the embers, the distant light of stars through the window, and the profound silence of the mountains keeping watch over your sleep.

Drift now into a deep and restful sleep, safe and warm in your mountain cabin, surrounded by the ageless presence of the mountains, beneath the eternal stars.`
    },
    {
      id: 'rainy-garden',
      title: 'Rainy Day in the Garden',
      description: 'The soothing sounds of rain in a lush garden',
      duration: '17 min',
      image: 'https://images.pexels.com/photos/2441454/pexels-photo-2441454.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1',
      content: `Settle into a comfortable position and allow your body to be fully supported. Take a deep breath in through your nose, and exhale slowly through your mouth. Feel the gentle rise and fall of your chest as your breathing finds its natural rhythm.

Imagine yourself in a beautiful garden on a mild, overcast day. The air is fresh and carries the earthy scent that comes before rain. You find a perfect spot beneath a charming gazebo with comfortable cushions and a view of the entire garden.

As you settle into the soft cushions, you hear the first gentle patter of raindrops on the gazebo roof. The sound is delicate at first – just a few drops creating a random, soothing rhythm above you. Gradually, the rain increases, creating a consistent, gentle drumming overhead.

From your sheltered vantage point, you watch as the garden receives this life-giving water. The plants seem to respond immediately – their colors becoming more vibrant, their leaves glistening with moisture. The greens are deeper, the flowers more brilliant against the soft gray background of the rainy day.

The rain creates a misty veil across the landscape, softening all the edges and creating a dreamlike quality to the scene. Distant parts of the garden are slightly obscured, giving the impression that this magical space might extend infinitely beyond what you can see.

The sound of the rain surrounds you – the patter on the gazebo roof, the gentle splashing as drops land in the small pond visible from your seat, the soft drumming on the leaves of nearby plants. This natural symphony is perfectly tuned to induce relaxation and peace.

You notice how the raindrops create tiny, momentary sculptures as they land in the pond – perfect circles that expand outward before disappearing, each drop a brief, beautiful event in the continuous flow of water. The surface of the pond is alive with this constant, gentle activity.

The air has cooled slightly with the rain, but it remains perfectly comfortable. The temperature is ideal – neither too warm nor too cool – and the air feels clean and fresh, purified by the rainfall. Each breath you take fills you with this revitalizing freshness.

A light mist rises from the warmer surfaces of the garden as they meet the cooler rain. This creates an ethereal quality to the scene, as if you're witnessing the garden through a soft filter that enhances its beauty and mystery.

The gazebo provides the perfect shelter – you can fully experience the beauty and sound of the rain while remaining completely dry and comfortable. The cushions support you perfectly, allowing your body to relax completely as you take in the tranquil scene.

Birds occasionally dart through the rain to visit the feeders hanging from nearby trees. Their feathers sleek with water, they shake themselves, creating tiny showers of droplets that catch what little light filters through the clouds. Their movements are quick but somehow still part of the overall sense of peace that pervades the garden.

The rain continues its gentle percussion, creating a background rhythm that seems to slow your thoughts and calm your mind. There is nothing to do here but observe and appreciate the beauty around you. No demands, no hurry, just this perfect moment of tranquility.

You notice a particularly beautiful flowering bush near the gazebo. The raindrops collect on its petals before sliding off in glistening paths. Each flower holds the water differently – some cupping it in their centers, others allowing it to roll away immediately. This simple observation brings a sense of mindful presence, anchoring you fully in this moment.

The garden has a different beauty in the rain than it would on a sunny day. Colors are more saturated, sounds are softened except for the gentle percussion of the raindrops, and the usual activities of the day are suspended in this peaceful interlude.

As the minutes pass, you feel yourself becoming more and more relaxed. The rhythm of the rain seems to synchronize with your heartbeat and your breathing, creating a profound sense of harmony between yourself and the natural world around you.

The consistent sound of rainfall has a deeply soothing effect on your nervous system. Your thoughts become less insistent, less demanding of attention. They drift like the mist in the garden – appearing briefly before dissolving back into a general sense of peaceful awareness.

Your eyelids begin to feel heavier as this perfect relaxation deepens. The sound of the rain continues its gentle lullaby, inviting you to surrender to rest. Your breathing is deep and regular now, your body completely at ease.

As you drift toward sleep, the rain continues its gentle pattern – consistent, soothing, natural. It creates a protective cocoon of sound around you, insulating you from the concerns of the world and creating a perfect environment for deep, restful sleep.

Let yourself be carried on this gentle current of sound, floating effortlessly toward sleep. The garden remains, the rain continues its peaceful rhythm, and you are perfectly safe, perfectly comfortable, perfectly at peace.

Sleep now, cradled in the gentle sound of rain, surrounded by the living beauty of the garden, completely at ease.`
    }
  ]

  function selectStory(story) {
    selectedStory = story
    showStoryContent = true
  }

  function backToList() {
    showStoryContent = false
    selectedStory = null
  }
</script>

<svelte:head>
  <title>Sleep Stories - Chitta</title>
</svelte:head>

<div class="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 px-4 py-6">
  <!-- Header -->
  {#if !showStoryContent}
    <div class="flex items-center justify-between mb-8">
      <button 
        on:click={() => goto('/wellness')} 
        class="p-3 rounded-2xl hover:bg-white/70 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
      >
        <ArrowLeft size={24} class="text-gray-600" />
      </button>
      <h1 class="text-2xl font-bold text-gray-800">Sleep Stories</h1>
      <div class="w-12"></div>
    </div>
  {/if}

  <div class="max-w-4xl mx-auto">
    {#if showStoryContent && selectedStory}
      <!-- Story Content View -->
      <div class="bg-white rounded-3xl p-6 shadow-lg border border-indigo-100">
        <div class="flex items-center space-x-3 mb-6">
          <button 
            on:click={backToList}
            class="p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} class="text-gray-600" />
          </button>
          <h2 class="text-xl font-bold text-gray-800">{selectedStory.title}</h2>
        </div>
        
        <div class="relative w-full h-48 mb-6 rounded-2xl overflow-hidden">
          <img 
            src={selectedStory.image} 
            alt={selectedStory.title}
            class="w-full h-full object-cover"
          />
          <div class="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div class="absolute bottom-4 left-4 flex items-center space-x-3 text-white">
            <Clock size={16} />
            <span>{selectedStory.duration}</span>
          </div>
        </div>
        
        <!-- Text-to-Speech Player -->
        <div class="mb-6">
          <TextToSpeechPlayer text={selectedStory.content} />
        </div>
        
        <!-- Story Text -->
        <div class="prose prose-lg max-w-none">
          <p class="whitespace-pre-line text-gray-700 leading-relaxed">
            {selectedStory.content}
          </p>
        </div>
      </div>
    {:else}
      <!-- Stories List View -->
      <div class="space-y-6">
        <p class="text-center text-gray-600 mb-8">
          Choose a sleep story to help you drift into a peaceful slumber
        </p>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          {#each sleepStories as story}
            <button
              on:click={() => selectStory(story)}
              class="bg-white rounded-3xl overflow-hidden shadow-lg border border-indigo-100 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 text-left"
            >
              <div class="relative w-full h-48">
                <img 
                  src={story.image} 
                  alt={story.title}
                  class="w-full h-full object-cover"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div class="absolute bottom-4 left-4 right-4">
                  <h3 class="text-xl font-bold text-white mb-1">{story.title}</h3>
                  <p class="text-white/90 text-sm">{story.description}</p>
                </div>
              </div>
              
              <div class="p-4 flex items-center justify-between">
                <div class="flex items-center space-x-2 text-indigo-600">
                  <Moon size={16} />
                  <span class="font-medium">Sleep Story</span>
                </div>
                <div class="flex items-center space-x-2 text-gray-600">
                  <Clock size={16} />
                  <span>{story.duration}</span>
                </div>
              </div>
            </button>
          {/each}
        </div>
      </div>
    {/if}
  </div>
</div>