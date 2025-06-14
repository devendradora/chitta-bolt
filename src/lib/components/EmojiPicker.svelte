<script>
  import { moods } from '$lib/stores/mood.js'
  import { ChevronDown, Check } from '@lucide/svelte'

  export let selectedEmoji = ''
  export let onEmojiChange = () => {}

  let isOpen = false

  function selectEmoji(emoji) {
    selectedEmoji = emoji
    onEmojiChange(emoji)
    isOpen = false
  }

  function toggleDropdown() {
    isOpen = !isOpen
  }

  function getSelectedMood() {
    return moods.find(mood => mood.emoji === selectedEmoji)
  }
</script>

<div class="emoji-picker-container">
  <button
    on:click={toggleDropdown}
    class="emoji-picker-button"
    class:open={isOpen}
  >
    <div class="flex items-center space-x-3">
      <span class="text-3xl">{selectedEmoji}</span>
      <div class="text-left">
        <div class="font-semibold text-gray-800">
          {getSelectedMood()?.name || 'Select Mood'}
        </div>
        <div class="text-sm text-gray-500">
          {getSelectedMood()?.description || 'Choose how you feel'}
        </div>
      </div>
    </div>
    <ChevronDown 
      size={20} 
      class="text-gray-400 transition-transform duration-200 {isOpen ? 'rotate-180' : ''}" 
    />
  </button>

  {#if isOpen}
    <div class="emoji-dropdown">
      <div class="dropdown-header">
        <h3 class="font-semibold text-gray-800">How are you feeling?</h3>
        <p class="text-sm text-gray-600">Select your current mood</p>
      </div>
      
      <div class="emoji-grid">
        {#each moods as mood}
          <button
            on:click={() => selectEmoji(mood.emoji)}
            class="emoji-option"
            class:selected={selectedEmoji === mood.emoji}
          >
            <div class="emoji-display">
              <span class="text-2xl">{mood.emoji}</span>
              {#if selectedEmoji === mood.emoji}
                <div class="selected-indicator">
                  <Check size={14} class="text-white" />
                </div>
              {/if}
            </div>
            <div class="emoji-info">
              <div class="font-medium text-gray-800">{mood.name}</div>
              <div class="text-xs text-gray-500 leading-tight">{mood.description}</div>
            </div>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<!-- Backdrop -->
{#if isOpen}
  <div 
    class="emoji-backdrop" 
    on:click={() => isOpen = false}
    on:keydown={(e) => e.key === 'Escape' && (isOpen = false)}
  ></div>
{/if}

<style>
  .emoji-picker-container {
    @apply relative;
  }

  .emoji-picker-button {
    @apply w-full flex items-center justify-between p-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-primary-300 transition-all duration-200;
  }

  .emoji-picker-button.open {
    @apply border-primary-500 shadow-lg;
  }

  .emoji-dropdown {
    @apply absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden;
    max-height: 400px;
    overflow-y: auto;
  }

  .dropdown-header {
    @apply p-4 border-b border-gray-100 bg-gray-50;
  }

  .emoji-grid {
    @apply p-2;
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .emoji-option {
    @apply p-3 rounded-xl hover:bg-primary-50 transition-all duration-200 text-left relative;
    border: 2px solid transparent;
  }

  .emoji-option.selected {
    @apply bg-primary-50 border-primary-200;
  }

  .emoji-display {
    @apply relative inline-block mb-2;
  }

  .selected-indicator {
    @apply absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center;
  }

  .emoji-info {
    @apply space-y-1;
  }

  .emoji-backdrop {
    @apply fixed inset-0 z-40;
  }

  /* Mobile responsiveness */
  @media (max-width: 640px) {
    .emoji-grid {
      grid-template-columns: 1fr;
    }
    
    .emoji-dropdown {
      max-height: 300px;
    }
  }
</style>