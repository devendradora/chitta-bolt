<script>
  import { onMount, onDestroy } from 'svelte';
  
  export let text = '';
  export let speed = 100;
  export let delay = 0;
  export let cursor = true;
  
  let displayedText = '';
  let currentIndex = 0;
  let interval;
  let mounted = false;
  
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
      if (currentIndex < text.length) {
        displayedText += text[currentIndex];
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, speed);
  }
</script>

<span class="typewriter-container">
  <span class="typewriter-text">{displayedText}</span>
  {#if cursor && currentIndex < text.length}
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