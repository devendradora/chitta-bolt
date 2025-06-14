import { writable } from 'svelte/store'
import { subscriptionStatus } from './subscription.js'

export const isAIAssistantActive = writable(false)
export const aiAudioPlaying = writable(false)
export const aiAudioError = writable('')
export const currentAIPrompt = writable('')

// ElevenLabs API configuration
const ELEVENLABS_API_KEY = import.meta.env.VITE_ELEVENLABS_API_KEY
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'

// Check if ElevenLabs is available (requires premium subscription)
export const isElevenLabsAvailable = () => {
  let status
  subscriptionStatus.subscribe(s => status = s)()
  
  return (status.isPremium || status.isTrialActive) && !!ELEVENLABS_API_KEY
}

// Generate speech from text using ElevenLabs
export const generateSpeech = async (text, voiceSettings = null) => {
  if (!isElevenLabsAvailable()) {
    throw new Error('ElevenLabs AI Assistant requires premium subscription')
  }

  if (!text || text.trim().length === 0) {
    throw new Error('Text is required for speech generation')
  }

  try {
    aiAudioError.set('')
    
    // Default voice settings for meditation
    const defaultSettings = {
      voice_id: "21m00Tcm4TlvDq8ikWAM", // Rachel - calm, soothing voice
      model_id: "eleven_monolingual_v1",
      voice_settings: {
        stability: 0.85,
        similarity_boost: 0.75,
        style: 0.1,
        use_speaker_boost: true
      }
    }

    const settings = voiceSettings || defaultSettings

    const response = await fetch(`${ELEVENLABS_API_URL}/text-to-speech/${settings.voice_id}`, {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text: text.trim(),
        model_id: settings.model_id,
        voice_settings: settings.voice_settings
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail?.message || `ElevenLabs API error: ${response.status}`)
    }

    const audioBlob = await response.blob()
    const audioUrl = URL.createObjectURL(audioBlob)
    
    return audioUrl
  } catch (error) {
    console.error('Error generating speech:', error)
    aiAudioError.set(error.message)
    throw error
  }
}

// Play AI-generated audio
export const playAIAudio = async (audioUrl) => {
  return new Promise((resolve, reject) => {
    const audio = new Audio(audioUrl)
    
    audio.onloadstart = () => {
      aiAudioPlaying.set(true)
    }
    
    audio.onended = () => {
      aiAudioPlaying.set(false)
      URL.revokeObjectURL(audioUrl) // Clean up blob URL
      resolve()
    }
    
    audio.onerror = (error) => {
      aiAudioPlaying.set(false)
      URL.revokeObjectURL(audioUrl)
      aiAudioError.set('Failed to play AI audio')
      reject(error)
    }
    
    audio.onpause = () => {
      aiAudioPlaying.set(false)
    }
    
    audio.onplay = () => {
      aiAudioPlaying.set(true)
    }
    
    audio.play().catch(reject)
  })
}

// Generate and play meditation guidance
export const speakMeditationGuidance = async (text, voiceSettings = null) => {
  try {
    currentAIPrompt.set(text)
    const audioUrl = await generateSpeech(text, voiceSettings)
    await playAIAudio(audioUrl)
  } catch (error) {
    console.error('Error speaking meditation guidance:', error)
    aiAudioError.set(error.message)
    throw error
  } finally {
    currentAIPrompt.set('')
  }
}

// Stop AI audio playback
export const stopAIAudio = () => {
  // This would need to be implemented with a global audio reference
  // For now, we'll just update the state
  aiAudioPlaying.set(false)
  currentAIPrompt.set('')
}

// Get available voices from ElevenLabs
export const getAvailableVoices = async () => {
  if (!ELEVENLABS_API_KEY) {
    throw new Error('ElevenLabs API key not configured')
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/voices`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch voices: ${response.status}`)
    }

    const data = await response.json()
    return data.voices || []
  } catch (error) {
    console.error('Error fetching voices:', error)
    throw error
  }
}

// Check ElevenLabs API status
export const checkElevenLabsStatus = async () => {
  if (!ELEVENLABS_API_KEY) {
    return { available: false, error: 'API key not configured' }
  }

  try {
    const response = await fetch(`${ELEVENLABS_API_URL}/user`, {
      headers: {
        'xi-api-key': ELEVENLABS_API_KEY
      }
    })

    if (response.ok) {
      const userData = await response.json()
      return { 
        available: true, 
        user: userData,
        charactersUsed: userData.subscription?.character_count || 0,
        charactersLimit: userData.subscription?.character_limit || 0
      }
    } else {
      return { available: false, error: `API error: ${response.status}` }
    }
  } catch (error) {
    return { available: false, error: error.message }
  }
}