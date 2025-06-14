# 🚀 Deployment Setup for Chitta with Modern Algorand Integration

This guide covers setting up the production environment for Chitta with Algorand TestNet integration using Lute Wallet.

## 📋 Environment Variables Setup

### 1. Supabase Environment Variables

In your Supabase project dashboard, go to Settings > Edge Functions and add these environment variables:

```bash
# Algorand TestNet Configuration (using Nodely API)
ALGORAND_ALGOD_TOKEN=98D9CE80660AD243893D56D9F125CD2D
ALGORAND_ALGOD_SERVER=https://testnet-api.4160.nodely.io
ALGORAND_ALGOD_PORT=443
ALGORAND_INDEXER_SERVER=https://testnet-idx.4160.nodely.io
ALGORAND_INDEXER_PORT=443

# Network Configuration
ALGORAND_NETWORK=testnet

# Deployer Account (see setup instructions below)
ALGORAND_DEPLOYER_MNEMONIC=your_25_word_mnemonic_phrase_here

# Tavus API Configuration (for AI Video Coach)
TAVUS_API_KEY=your_tavus_api_key_here
TAVUS_REPLICA_ID=your_replica_id_here
TAVUS_PERSONA_ID=your_persona_id_here

# JWT Configuration - Set access token expiry to 24 hours
SUPABASE_JWT_EXP=86400
```

### 2. Supabase Project Settings

**IMPORTANT**: You must also configure the JWT expiry in your Supabase project dashboard:

1. **Go to Supabase Dashboard**:
   - Navigate to your project
   - Go to Settings → API
   - Look for "JWT Settings" or "Authentication Settings"

2. **Set JWT Expiry**:
   - Find "JWT expiry limit" or "Access token lifetime"
   - Set the value to `86400` (24 hours in seconds)
   - Save the changes

3. **Alternative Method**:
   - Go to Settings → Authentication
   - Look for "Session timeout" or "Token expiry"
   - Set to 24 hours or 86400 seconds

### 3. Frontend Environment Variables

Create `.env` file in your project root:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: Algorand configuration for frontend
VITE_ALGORAND_NETWORK=testnet

# JWT Expiry (24 hours)
VITE_SUPABASE_JWT_EXP=86400
```

## 🎥 Tavus API Setup

The AI Video Coach feature requires Tavus API integration.

### Step 1: Create Tavus Account

1. **Sign up for Tavus**:
   - Visit [tavus.io](https://tavus.io/)
   - Create an account
   - Complete the onboarding process

2. **Get API Key**:
   - Go to your Tavus dashboard
   - Navigate to API settings
   - Generate and copy your API key

### Step 2: Create Replica and Persona

1. **Create a Replica**:
   - Upload a video of yourself or use a stock avatar
   - Wait for processing (usually 10-15 minutes)
   - Note the `replica_id`

2. **Create a Persona**:
   - Define the AI coach personality and behavior
   - Set wellness coaching context
   - Note the `persona_id`

### Step 3: Configure Environment Variables

Add these to your Supabase Edge Functions environment:

```bash
TAVUS_API_KEY=your_actual_api_key
TAVUS_REPLICA_ID=your_replica_id
TAVUS_PERSONA_ID=your_persona_id
```

## 🔑 Deployer Account Setup

The deployer account is used to mint NFTs and transfer them to users.

### Step 1: Create Deployer Account Using Lute Wallet

#### Using Lute Wallet
```bash
# 1. Visit https://lute.app/
# 2. Download and install Lute Wallet
# 3. Create new wallet
# 4. Switch to TestNet
# 5. Create new account
# 6. Export mnemonic phrase (Settings > Security > Export)
```

#### Alternative: Using Algorand SDK (Programmatic)
```javascript
const algosdk = require('algosdk');

// Generate new account
const account = algosdk.generateAccount();
console.log('Address:', account.addr);
console.log('Mnemonic:', algosdk.secretKeyToMnemonic(account.sk));

// Save the mnemonic securely!
```

### Step 2: Fund Deployer Account

1. **Get TestNet ALGO**:
   - Visit [TestNet Dispenser](https://testnet.algoexplorer.io/dispenser)
   - Enter your deployer account address
   - Request 10 ALGO (sufficient for hundreds of NFT mints)

2. **Verify Funding**:
   - Check balance on [TestNet Explorer](https://testnet.algoexplorer.io/)
   - Search for your deployer address
   - Confirm ALGO balance > 5 ALGO

### Step 3: Add Mnemonic to Supabase

1. **In Supabase Dashboard**:
   - Go to Settings > Edge Functions
   - Add environment variable: `ALGORAND_DEPLOYER_MNEMONIC`
   - Value: Your 25-word mnemonic phrase (space-separated)
   - Example: `abandon abandon abandon ... abandon abandon abandon art`

## 🗄️ Database Migration

Run the database migrations to set up achievement tables:

```bash
# Apply migrations
supabase db push

# Or manually run the migration files:
# - supabase/migrations/20250612165325_dark_torch.sql
```

## 🔧 Edge Function Deployment

Deploy the edge functions:

```bash
# Deploy the mint-achievement-nft function
supabase functions deploy mint-achievement-nft

# Deploy the create-tavus-conversation function
supabase functions deploy create-tavus-conversation

# Verify deployment
supabase functions list
```

## 🧪 Testing the Setup

### 1. Test Algorand Connection

```javascript
// Test script to verify Algorand connection
const algosdk = require('algosdk');

const algodToken = '98D9CE80660AD243893D56D9F125CD2D';
const algodServer = 'https://testnet-api.4160.nodely.io';
const algodPort = 443;

const algodClient = new algosdk.Algodv2(
  { 'X-Algo-api-token': algodToken },
  algodServer,
  algodPort
);

async function testConnection() {
  try {
    const status = await algodClient.status().do();
    console.log('✅ Algorand connection successful');
    console.log('Network:', status.network);
    console.log('Last round:', status['last-round']);
  } catch (error) {
    console.error('❌ Algorand connection failed:', error);
  }
}

testConnection();
```

### 2. Test Deployer Account

```javascript
// Test deployer account access
const mnemonic = 'your_deployer_mnemonic_here';
const account = algosdk.mnemonicToSecretKey(mnemonic);

async function testDeployer() {
  try {
    const accountInfo = await algodClient.accountInformation(account.addr).do();
    console.log('✅ Deployer account accessible');
    console.log('Address:', account.addr);
    console.log('Balance:', accountInfo.amount / 1000000, 'ALGO');
    
    if (accountInfo.amount < 1000000) {
      console.warn('⚠️ Low balance! Fund account at: https://testnet.algoexplorer.io/dispenser');
    }
  } catch (error) {
    console.error('❌ Deployer account error:', error);
  }
}

testDeployer();
```

### 3. Test Tavus API

```javascript
// Test Tavus API connection
async function testTavusAPI() {
  try {
    const response = await fetch('https://tavusapi.com/v2/replicas', {
      headers: {
        'x-api-key': 'your_tavus_api_key_here'
      }
    });
    
    if (response.ok) {
      console.log('✅ Tavus API connection successful');
      const data = await response.json();
      console.log('Available replicas:', data.length);
    } else {
      console.error('❌ Tavus API error:', response.status);
    }
  } catch (error) {
    console.error('❌ Tavus API connection failed:', error);
  }
}

testTavusAPI();
```

### 4. Test JWT Expiry Configuration

```javascript
// Test JWT expiry settings
async function testJWTExpiry() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session) {
      const expiresAt = new Date(session.expires_at * 1000);
      const now = new Date();
      const hoursUntilExpiry = (expiresAt - now) / (1000 * 60 * 60);
      
      console.log('✅ JWT Configuration:');
      console.log('Current time:', now.toISOString());
      console.log('Token expires at:', expiresAt.toISOString());
      console.log('Hours until expiry:', hoursUntilExpiry.toFixed(2));
      
      if (hoursUntilExpiry > 20) {
        console.log('✅ 24-hour JWT expiry configured correctly');
      } else {
        console.warn('⚠️ JWT expiry may not be set to 24 hours');
      }
    } else {
      console.log('No active session to test');
    }
  } catch (error) {
    console.error('❌ JWT test failed:', error);
  }
}

testJWTExpiry();
```

### 5. Test Lute Wallet Integration

Use the Chitta app to:
1. Connect using Lute Wallet
2. Complete an achievement (e.g., first meditation)
3. Verify NFT is minted and transferred
4. Check on [TestNet Explorer](https://testnet.algoexplorer.io/)
5. Test AI Video Coach feature

## 🔄 Wallet Compatibility Matrix

| Wallet | Platform | Connection Method | Status |
|--------|----------|-------------------|---------|
| Lute Wallet | Web Browser | Direct Connect | ✅ Active |
| Lute Wallet | Mobile App | Manual Entry | ✅ Active |
| Manual Entry | Any Platform | Manual Entry | ✅ Always Available |

## 📊 Monitoring and Maintenance

### 1. Monitor Deployer Balance

Set up alerts when deployer balance is low:

```sql
-- Create a function to check deployer balance
-- This would be called periodically to monitor funds
```

### 2. Track NFT Minting

Monitor successful/failed NFT mints:

```sql
-- Query to check recent achievements
SELECT 
  ua.achievement_name,
  ua.nft_asset_id,
  ua.transaction_id,
  ua.earned_at,
  u.email
FROM user_achievements ua
JOIN users u ON ua.user_id = u.id
WHERE ua.earned_at > NOW() - INTERVAL '24 hours'
ORDER BY ua.earned_at DESC;
```

### 3. Monitor Tavus Usage

Track video agent sessions:

```sql
-- Query to check Tavus conversation usage
SELECT 
  tc.mood,
  tc.category,
  tc.created_at,
  u.email
FROM tavus_conversations tc
JOIN users u ON tc.user_id = u.id
WHERE tc.created_at > NOW() - INTERVAL '24 hours'
ORDER BY tc.created_at DESC;
```

### 4. Monitor JWT Token Usage

Track authentication patterns:

```sql
-- Monitor user session patterns
SELECT 
  DATE_TRUNC('hour', created_at) as hour,
  COUNT(*) as sessions
FROM auth.sessions 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

### 5. Error Handling

Common issues and solutions:

| Error | Cause | Solution |
|-------|-------|----------|
| "Deployer account not configured" | Missing mnemonic | Add ALGORAND_DEPLOYER_MNEMONIC to Supabase |
| "Insufficient funds" | Low ALGO balance | Fund deployer account |
| "Network timeout" | API issues | Check Nodely API status |
| "Invalid address" | Wrong wallet format | Validate address format |
| "Wallet not detected" | Lute Wallet not installed | Install Lute Wallet or use manual entry |
| "Tavus API key not configured" | Missing API key | Add TAVUS_API_KEY to Supabase |
| "Failed to create video session" | Tavus API issues | Check API key and quota |
| "JWT expired" | Token expiry too short | Verify SUPABASE_JWT_EXP=86400 is set |
| "Session timeout" | Network issues | Check JWT expiry configuration |

## 🛡️ Security Checklist

- ✅ Deployer mnemonic stored securely in Supabase environment variables
- ✅ TestNet used for all operations (no real value at risk)
- ✅ User addresses validated before NFT transfer
- ✅ Achievement verification prevents duplicate minting
- ✅ Error handling prevents partial states
- ✅ Transaction IDs logged for audit trail
- ✅ Modern, actively maintained wallet (Lute Wallet)
- ✅ Fallback to manual entry for all wallet types
- ✅ Tavus API key secured in environment variables
- ✅ Video sessions are private and secure
- ✅ User consent required for video agent activation
- ✅ JWT tokens expire after 24 hours for security
- ✅ Session management with proper timeout handling

## 📈 Production Readiness

Before going live:

1. **Load Testing**: Test with multiple concurrent users
2. **Wallet Testing**: Test Lute Wallet integration thoroughly
3. **Video Agent Testing**: Test Tavus integration with various moods
4. **JWT Testing**: Verify 24-hour token expiry works correctly
5. **Error Monitoring**: Set up logging and alerts
6. **Backup Strategy**: Regular database backups
7. **Documentation**: Update user guides for Lute Wallet and video features
8. **Support Process**: Define support procedures for wallet and video issues
9. **Quota Management**: Monitor Tavus API usage and limits
10. **Session Management**: Monitor JWT token usage and renewal patterns

## 🔗 Updated Useful Links

### Lute Wallet
- [Lute Wallet](https://lute.app/) - Modern Algorand wallet

### Tavus AI Video
- [Tavus Platform](https://tavus.io/) - AI video generation platform
- [Tavus API Documentation](https://docs.tavus.io/) - API reference
- [Tavus Dashboard](https://app.tavus.io/) - Manage replicas and personas

### Development Resources
- [Nodely API Documentation](https://nodely.io/docs/free/start)
- [Algorand Developer Portal](https://developer.algorand.org/)
- [TestNet Explorer](https://testnet.algoexplorer.io/)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase JWT Configuration](https://supabase.com/docs/guides/auth/auth-helpers/auth-ui)

### Community Support
- [Algorand Discord](https://discord.gg/algorand)
- [Algorand Forum](https://forum.algorand.org/)
- [Lute Wallet Support](https://lute.app/support)
- [Tavus Support](https://tavus.io/support)

---

Your Chitta app is now ready to work with Lute Wallet, mint achievement NFTs on TestNet, and provide AI video coaching through Tavus with 24-hour JWT tokens! 🎉

## 🚀 Next Steps

1. **Configure JWT Expiry**: Set SUPABASE_JWT_EXP=86400 in your Supabase project settings
2. **Test Lute Wallet connection** with the updated system
3. **Test Tavus video agent** with different moods and scenarios
4. **Verify 24-hour token expiry** is working correctly
5. **Update user documentation** to reflect new features
6. **Monitor usage and performance** of new integrations
7. **Consider MainNet deployment** when ready for production

The app now includes cutting-edge AI video coaching alongside blockchain-verified achievements with extended session management! 🌟

## ⚠️ Important Notes

1. **JWT Configuration**: The `SUPABASE_JWT_EXP=86400` environment variable must be set in **both**:
   - Your Supabase project dashboard (Settings → API → JWT Settings)
   - Your Edge Functions environment variables

2. **Session Management**: The client-side code has been updated to handle 24-hour tokens with appropriate refresh timing

3. **Timeout Handling**: All timeout values have been increased to accommodate longer-lived sessions

4. **Testing**: Always test the JWT expiry configuration after deployment to ensure 24-hour sessions work correctly