import { writable } from 'svelte/store'
import { supabase } from '$lib/supabase.js'

export const currentQuote = writable(null)
export const quotes = writable([])
export const currentQuoteIndex = writable(0)
export const loading = writable(false)
export const error = writable('')

export const categories = [
  { value: 'all', label: 'All', emoji: '✨' },
  { value: 'health', label: 'Health', emoji: '💪' },
  { value: 'love', label: 'Love', emoji: '❤️' },
  { value: 'brother', label: 'Brother', emoji: '👨‍👦' },
  { value: 'mother', label: 'Mother', emoji: '👩‍👧' },
  { value: 'father', label: 'Father', emoji: '👨‍👧' },
  { value: 'general', label: 'General', emoji: '🌟' },
  { value: 'spiritual', label: 'Spiritual', emoji: '🙏' }
]

// Random background gradients for quotes
export const backgroundGradients = [
  'from-purple-900 via-blue-900 to-indigo-900',
  'from-pink-900 via-purple-900 to-indigo-900',
  'from-green-900 via-teal-900 to-blue-900',
  'from-orange-900 via-red-900 to-pink-900',
  'from-yellow-900 via-orange-900 to-red-900',
  'from-indigo-900 via-purple-900 to-pink-900',
  'from-teal-900 via-green-900 to-blue-900',
  'from-red-900 via-pink-900 to-purple-900',
  'from-blue-900 via-indigo-900 to-purple-900',
  'from-emerald-900 via-teal-900 to-cyan-900',
  'from-rose-900 via-pink-900 to-fuchsia-900',
  'from-amber-900 via-orange-900 to-red-900',
  'from-lime-900 via-green-900 to-emerald-900',
  'from-sky-900 via-blue-900 to-indigo-900',
  'from-violet-900 via-purple-900 to-fuchsia-900'
]

// Fetch quotes from Supabase
export const fetchQuotes = async (category = 'all', limit = 50) => {
  loading.set(true)
  error.set('')
  
  try {
    console.log('Fetching quotes for category:', category)
    
    let query = supabase
      .from('motivation_quotes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error: fetchError } = await query

    console.log('Quotes fetch result:', { data, fetchError })

    if (fetchError) {
      console.error('Error fetching quotes:', fetchError)
      error.set(fetchError.message)
      return { data: null, error: fetchError }
    }

    if (!data || data.length === 0) {
      console.log('No quotes found')
      quotes.set([])
      currentQuote.set(null)
      currentQuoteIndex.set(0)
      return { data: [], error: null }
    }

    // Shuffle the quotes array to get random order
    const shuffledData = [...data].sort(() => Math.random() - 0.5)

    // Add random background gradient to each quote
    const processedQuotes = shuffledData.map((quote, index) => ({
      ...quote,
      background: backgroundGradients[index % backgroundGradients.length],
      likes_count: 0,
      shares_count: 0,
      comments_count: 0,
      user_liked: false,
      user_shared: false
    }))

    console.log('Processed quotes:', processedQuotes.length)

    quotes.set(processedQuotes)
    if (processedQuotes.length > 0) {
      currentQuote.set(processedQuotes[0])
      currentQuoteIndex.set(0)
    }

    return { data: processedQuotes, error: null }
  } catch (err) {
    console.error('Unexpected error fetching quotes:', err)
    error.set('An unexpected error occurred while fetching quotes')
    return { data: null, error: err }
  } finally {
    loading.set(false)
  }
}

// Fetch interaction counts for quotes
export const fetchQuoteInteractions = async (quoteIds, userId) => {
  if (!quoteIds || quoteIds.length === 0) return {}

  try {
    // Get all interactions for these quotes
    const { data: interactions } = await supabase
      .from('quote_interactions')
      .select('quote_id, interaction_type, user_id')
      .in('quote_id', quoteIds)

    // Get all comments for these quotes
    const { data: comments } = await supabase
      .from('quote_comments')
      .select('quote_id')
      .in('quote_id', quoteIds)

    // Process the data
    const interactionCounts = {}
    
    quoteIds.forEach(quoteId => {
      const quoteInteractions = interactions?.filter(i => i.quote_id === quoteId) || []
      const quoteComments = comments?.filter(c => c.quote_id === quoteId) || []
      
      interactionCounts[quoteId] = {
        likes_count: quoteInteractions.filter(i => i.interaction_type === 'like').length,
        shares_count: quoteInteractions.filter(i => i.interaction_type === 'share').length,
        comments_count: quoteComments.length,
        user_liked: userId ? quoteInteractions.some(i => i.interaction_type === 'like' && i.user_id === userId) : false,
        user_shared: userId ? quoteInteractions.some(i => i.interaction_type === 'share' && i.user_id === userId) : false
      }
    })

    return interactionCounts
  } catch (err) {
    console.error('Error fetching interactions:', err)
    return {}
  }
}

// Like/unlike a quote
export const toggleLike = async (quoteId, userId) => {
  try {
    // Check if user already liked this quote
    const { data: existingLike } = await supabase
      .from('quote_interactions')
      .select('id')
      .eq('quote_id', quoteId)
      .eq('user_id', userId)
      .eq('interaction_type', 'like')
      .maybeSingle()

    if (existingLike) {
      // Unlike - remove the interaction
      const { error } = await supabase
        .from('quote_interactions')
        .delete()
        .eq('id', existingLike.id)

      if (error) throw error
      return { liked: false, error: null }
    } else {
      // Like - add the interaction
      const { error } = await supabase
        .from('quote_interactions')
        .insert({
          quote_id: quoteId,
          user_id: userId,
          interaction_type: 'like'
        })

      if (error) throw error
      return { liked: true, error: null }
    }
  } catch (err) {
    console.error('Error toggling like:', err)
    return { liked: false, error: err }
  }
}

// Share a quote
export const shareQuote = async (quoteId, userId) => {
  try {
    // Check if user already shared this quote
    const { data: existingShare } = await supabase
      .from('quote_interactions')
      .select('id')
      .eq('quote_id', quoteId)
      .eq('user_id', userId)
      .eq('interaction_type', 'share')
      .maybeSingle()

    if (!existingShare) {
      // Add share interaction
      const { error } = await supabase
        .from('quote_interactions')
        .insert({
          quote_id: quoteId,
          user_id: userId,
          interaction_type: 'share'
        })

      if (error) throw error
    }

    return { shared: true, error: null }
  } catch (err) {
    console.error('Error sharing quote:', err)
    return { shared: false, error: err }
  }
}

// Add a comment to a quote
export const addComment = async (quoteId, userId, comment) => {
  try {
    const { data, error } = await supabase
      .from('quote_comments')
      .insert({
        quote_id: quoteId,
        user_id: userId,
        comment: comment.trim()
      })
      .select('*')
      .single()

    if (error) throw error
    return { data, error: null }
  } catch (err) {
    console.error('Error adding comment:', err)
    return { data: null, error: err }
  }
}

// Get comments for a quote
export const getQuoteComments = async (quoteId) => {
  try {
    const { data, error } = await supabase
      .from('quote_comments')
      .select(`
        *,
        users!inner(email, full_name)
      `)
      .eq('quote_id', quoteId)
      .order('created_at', { ascending: true })

    if (error) throw error
    
    // Transform the data to include user info
    const transformedData = data?.map(comment => ({
      ...comment,
      user_email: comment.users?.email,
      user_name: comment.users?.full_name || comment.users?.email?.split('@')[0]
    })) || []
    
    return { data: transformedData, error: null }
  } catch (err) {
    console.error('Error fetching comments:', err)
    return { data: [], error: err }
  }
}

// Update quotes with interaction data
export const updateQuotesWithInteractions = async (quotesData, userId) => {
  if (!quotesData || quotesData.length === 0) return quotesData

  const quoteIds = quotesData.map(q => q.id)
  const interactions = await fetchQuoteInteractions(quoteIds, userId)

  return quotesData.map(quote => ({
    ...quote,
    ...interactions[quote.id]
  }))
}

// Generate unique shareable link for a quote
export const generateShareableLink = (quoteId) => {
  const baseUrl = window.location.origin
  return `${baseUrl}/motivation?quote=${quoteId}`
}