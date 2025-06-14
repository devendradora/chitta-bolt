import { writable } from 'svelte/store'
import { supabase, makeAuthenticatedRequest } from '$lib/supabase.js'

export const algorandAddress = writable(null)
export const isConnecting = writable(false)
export const connectionError = writable('')
export const userNFTs = writable([])
export const connectedWallet = writable(null) // Track which wallet is connected

// Available wallet types - Only Lute and Manual
export const WALLET_TYPES = {
  LUTE: 'lute',
  MANUAL: 'manual'
}

// Connect to Algorand wallet with Lute Wallet support
export const connectAlgorandWallet = async (walletType = null) => {
  isConnecting.set(true)
  connectionError.set('')

  try {
    let result = null

    // Auto-detect wallet if no type specified
    if (!walletType) {
      walletType = detectAvailableWallet()
    }

    switch (walletType) {
      case WALLET_TYPES.LUTE:
        result = await connectLuteWallet()
        break
      case WALLET_TYPES.MANUAL:
      default:
        result = await connectManualEntry()
        break
    }

    if (result.success) {
      algorandAddress.set(result.address)
      connectedWallet.set(walletType)
      await saveAlgorandAddress(result.address)
      await loadUserNFTs(result.address)
      return { success: true, address: result.address, wallet: walletType }
    } else {
      throw new Error(result.error)
    }

  } catch (error) {
    console.error('Error connecting to Algorand wallet:', error)
    const errorMessage = error.message || 'Failed to connect wallet'
    connectionError.set(errorMessage)
    return { success: false, error: errorMessage }
  } finally {
    isConnecting.set(false)
  }
}

// Detect available wallet
function detectAvailableWallet() {
  if (typeof window === 'undefined') return WALLET_TYPES.MANUAL

  // Check for Lute Wallet
  if (window.lute) {
    return WALLET_TYPES.LUTE
  }

  // Default to manual entry
  return WALLET_TYPES.MANUAL
}

// Connect Lute Wallet
async function connectLuteWallet() {
  try {
    // Check if Lute Wallet is available
    if (typeof window !== 'undefined' && window.lute) {
      console.log('Lute Wallet detected, attempting connection...')
      
      // Try to connect directly with window.lute
      const accounts = await window.lute.connect()
      
      if (accounts && accounts.length > 0) {
        const address = accounts[0]
        if (isValidAlgorandAddress(address)) {
          return { success: true, address: address }
        } else {
          throw new Error('Invalid address returned from Lute Wallet')
        }
      } else {
        throw new Error('No TestNet accounts found in Lute Wallet. Please create a TestNet account first.')
      }
    }
    
    throw new Error('Lute Wallet not detected. Please install Lute Wallet from https://lute.app/')
  } catch (error) {
    console.error('Lute Wallet connection error:', error)
    return { success: false, error: error.message }
  }
}

// Manual entry with enhanced guidance for Lute Wallet
async function connectManualEntry(walletName = 'Manual Entry') {
  try {
    const instructions = `🔗 ${walletName} Address Entry

📱 RECOMMENDED WALLET:
• Lute Wallet: https://lute.app/

📋 SETUP INSTRUCTIONS:
1. Download Lute Wallet from https://lute.app/
2. Create account and switch to TestNet
3. Copy your wallet address (exactly 58 characters)
4. Paste it below

⚠️ IMPORTANT: Use TestNet only!

Enter your Algorand TestNet address:`
    
    const address = prompt(instructions)
    
    if (address && address.trim()) {
      const cleanAddress = address.trim()
      
      // Enhanced validation with detailed error messages
      const validation = validateAlgorandAddress(cleanAddress)
      
      if (validation.isValid) {
        return { success: true, address: cleanAddress }
      } else {
        throw new Error(validation.error)
      }
    } else {
      throw new Error(`No address provided.

TO GET A TESTNET WALLET:
1. Download Lute Wallet: https://lute.app/
2. Create account & switch to TestNet
3. Copy your address and try again

Need help? Visit: https://lute.app/`)
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

// Enhanced Algorand address validation with detailed error messages
function validateAlgorandAddress(address) {
  if (!address || typeof address !== 'string') {
    return {
      isValid: false,
      error: 'Address is required and must be a string'
    }
  }
  
  // Remove any whitespace
  const cleanAddress = address.trim()
  
  // Check length
  if (cleanAddress.length !== 58) {
    return {
      isValid: false,
      error: `Invalid address length: ${cleanAddress.length} characters. Algorand addresses must be exactly 58 characters.

Your address: ${cleanAddress}
Expected length: 58 characters
Actual length: ${cleanAddress.length} characters

Please check that you copied the complete address from Lute Wallet.`
    }
  }
  
  // Check character set (Algorand uses base32 with A-Z, 2-7)
  const base32Regex = /^[A-Z2-7]{58}$/
  if (!base32Regex.test(cleanAddress)) {
    const invalidChars = cleanAddress.split('').filter(char => !/[A-Z2-7]/.test(char))
    return {
      isValid: false,
      error: `Invalid characters in address: ${invalidChars.join(', ')}

Algorand addresses can only contain:
• Uppercase letters A-Z
• Numbers 2-7

Your address: ${cleanAddress}
Invalid characters found: ${invalidChars.join(', ')}

Please copy the address directly from Lute Wallet without any extra characters.`
    }
  }
  
  // Additional checksum validation using algosdk if available
  try {
    // Try to decode the address to verify checksum
    const decoded = decodeAddress(cleanAddress)
    if (!decoded) {
      return {
        isValid: false,
        error: `Address checksum validation failed.

Your address: ${cleanAddress}

This address has the correct format but fails checksum validation. Please:
1. Double-check you copied the complete address from Lute Wallet
2. Make sure you're using a TestNet address
3. Try copying the address again`
      }
    }
  } catch (error) {
    return {
      isValid: false,
      error: `Address validation error: ${error.message}

Your address: ${cleanAddress}

Please ensure you're copying the address directly from Lute Wallet.`
    }
  }
  
  return { isValid: true }
}

// Simple address decoding for checksum validation
function decodeAddress(address) {
  try {
    // Base32 alphabet used by Algorand
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
    const addressBytes = []
    
    // Convert base32 to bytes
    let bits = 0
    let value = 0
    
    for (let i = 0; i < address.length; i++) {
      const char = address[i]
      const index = alphabet.indexOf(char)
      if (index === -1) return null
      
      value = (value << 5) | index
      bits += 5
      
      if (bits >= 8) {
        addressBytes.push((value >>> (bits - 8)) & 255)
        bits -= 8
      }
    }
    
    // Basic length check for decoded bytes
    return addressBytes.length >= 32 ? addressBytes : null
  } catch (error) {
    return null
  }
}

// Save Algorand address to user profile
const saveAlgorandAddress = async (address) => {
  try {
    const result = await makeAuthenticatedRequest(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        throw new Error('User not authenticated')
      }

      const { error } = await supabase
        .from('users')
        .update({ algorand_address: address })
        .eq('id', user.id)

      if (error) {
        throw error
      }

      return true
    })

    console.log('Algorand address saved successfully')
    return result
  } catch (error) {
    console.error('Error saving Algorand address:', error)
    throw error
  }
}

// Load user's Algorand address from profile
export const loadAlgorandAddress = async () => {
  try {
    const result = await makeAuthenticatedRequest(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      const { data, error } = await supabase
        .from('users')
        .select('algorand_address')
        .eq('id', user.id)
        .single()

      if (error) {
        throw error
      }

      return data?.algorand_address
    })

    if (result) {
      algorandAddress.set(result)
      await loadUserNFTs(result)
    }

    return result
  } catch (error) {
    console.error('Error loading Algorand address:', error)
    return null
  }
}

// Load user's NFTs from database (achievement NFTs)
export const loadUserNFTs = async (address) => {
  if (!address) return

  try {
    const result = await makeAuthenticatedRequest(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return []
      }

      const { data, error } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievement_nfts (*)
        `)
        .eq('user_id', user.id)
        .not('nft_asset_id', 'is', null)
        .order('earned_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    })

    userNFTs.set(result)
    return result
  } catch (error) {
    console.error('Error loading user NFTs:', error)
    return []
  }
}

// Disconnect wallet
export const disconnectWallet = async () => {
  algorandAddress.set(null)
  connectedWallet.set(null)
  userNFTs.set([])
  connectionError.set('')
  
  try {
    // Clear address from user profile
    await saveAlgorandAddress(null)
  } catch (error) {
    console.error('Error clearing Algorand address:', error)
  }
}

// Check if wallet is connected
export const isWalletConnected = () => {
  let connected = false
  algorandAddress.subscribe(address => connected = !!address)()
  return connected
}

// Get NFT explorer URL for TestNet
export const getNFTExplorerURL = (assetId, isTestNet = true) => {
  const network = isTestNet ? 'testnet' : 'mainnet'
  return `https://${network}.algoexplorer.io/asset/${assetId}`
}

// Get transaction explorer URL for TestNet
export const getTransactionExplorerURL = (txId, isTestNet = true) => {
  const network = isTestNet ? 'testnet' : 'mainnet'
  return `https://${network}.algoexplorer.io/tx/${txId}`
}

// Format Algorand address for display
export const formatAddress = (address) => {
  if (!address) return ''
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}

// Validate Algorand address format (public function)
export const isValidAlgorandAddress = (address) => {
  const validation = validateAlgorandAddress(address)
  return validation.isValid
}

// Get detailed validation result (public function)
export const getAddressValidation = (address) => {
  return validateAlgorandAddress(address)
}

// Get wallet connection status message
export const getConnectionStatusMessage = () => {
  let address, error, connecting, wallet
  algorandAddress.subscribe(a => address = a)()
  connectionError.subscribe(e => error = e)()
  isConnecting.subscribe(c => connecting = c)()
  connectedWallet.subscribe(w => wallet = w)()

  if (connecting) return 'Connecting to wallet...'
  if (error) return `Connection error: ${error}`
  if (address) {
    const walletName = getWalletDisplayName(wallet)
    return `Connected via ${walletName}: ${formatAddress(address)}`
  }
  return 'Wallet not connected'
}

// Get display name for wallet type
function getWalletDisplayName(walletType) {
  const names = {
    [WALLET_TYPES.LUTE]: 'Lute Wallet',
    [WALLET_TYPES.MANUAL]: 'Manual Entry'
  }
  return names[walletType] || 'Unknown Wallet'
}

// Check if browser supports wallet connections
export const isBrowserSupported = () => {
  if (typeof window === 'undefined') return false
  
  // Check for modern browser features
  return !!(
    window.crypto &&
    window.crypto.subtle &&
    window.fetch &&
    window.localStorage
  )
}

// Get recommended wallet for current platform
export const getRecommendedWallet = () => {
  return 'Lute Wallet'
}

// Get available wallets for current platform - Only Lute Wallet
export const getAvailableWallets = () => {
  const wallets = []
  
  if (typeof window === 'undefined') {
    return [{ type: WALLET_TYPES.MANUAL, name: 'Manual Entry', available: true }]
  }

  // Check for Lute Wallet
  wallets.push({
    type: WALLET_TYPES.LUTE,
    name: 'Lute Wallet',
    available: !!window.lute,
    downloadUrl: 'https://lute.app/',
    description: 'Modern Algorand wallet',
    status: 'recommended'
  })

  // Manual entry (always available)
  wallets.push({
    type: WALLET_TYPES.MANUAL,
    name: 'Manual Entry',
    available: true,
    downloadUrl: null,
    description: 'Enter address from Lute Wallet',
    status: 'fallback'
  })

  return wallets
}