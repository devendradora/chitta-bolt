<script>
  import { onMount, onDestroy } from 'svelte';
  
  export let text = '';
  export let speed = 100;
  export let delay = 0;
  export let cursor = true;
  export let loop = true;
  export let pauseBetweenLoops = 2000;
  
  let displayedText = '';
  let currentIndex = 0;
  let interval;
  let mounted = false;
  let isTyping = true;
  
  onMount(() => {
    mounted = true;
    
    if (delay > 0) {
      setTimeout(startTyping, delay);
    } else {
      startTyping();
    }
  });
  
  onDestroy(() => {
    if (interval) clearInterval(interval);
  });
  
  function startTyping() {
    if (!mounted) return;
    
    interval = setInterval(() => {
      if (isTyping) {
        if (currentIndex < text.length) {
          displayedText += text[currentIndex];
          currentIndex++;
        } else if (loop) {
          isTyping = false;
          clearInterval(interval);
          setTimeout(() => {
            startDeleting();
          }, pauseBetweenLoops);
        } else {
          clearInterval(interval);
        }
      }
    }, speed);
  }
  
  function startDeleting() {
    interval = setInterval(() => {
      if (!isTyping) {
        if (displayedText.length > 0) {
          displayedText = displayedText.slice(0, -1);
        } else {
          isTyping = true;
          currentIndex = 0;
          clearInterval(interval);
          startTyping();
        }
      }
    }, speed / 2);
  }
</script>

<span class="typewriter-container">
  <span class="typewriter-text">
    {@html displayedText.replace(
      /(Journey|Inner Peace)/g, 
      (match) => match === 'Journey' 
        ? '<span class="text-emerald-300 font-extrabold">Journey</span>' 
        : '<span class="text-teal-300 font-extrabold">Inner Peace</span>'
    )}
  </span>
  {#if cursor && (loop || currentIndex < text.length)}
    <span class="typewriter-cursor">|</span>
  {/if}
</span>

<style>
  .typewriter-container {
    display: inline;
    position: relative;
  }
  
  .typewriter-cursor {
    display: inline-block;
    animation: blink 0.7s infinite;
  }
  
  @keyframes blink {
    0%, 100% { opacity: 1; }
    50% { opacity: 0; }
  }
</style>