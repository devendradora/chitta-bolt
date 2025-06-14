const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    // Import required modules
    const { createClient } = await import('npm:@supabase/supabase-js@2');
    const algosdk = await import('npm:algosdk@2');
    
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user from the request
    const {
      data: { user },
    } = await supabaseClient.auth.getUser();

    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { achievement_name } = await req.json();

    if (!achievement_name) {
      return new Response(
        JSON.stringify({ error: 'Achievement name is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Check if user already has this achievement
    const { data: existingAchievement } = await supabaseClient
      .from('user_achievements')
      .select('id')
      .eq('user_id', user.id)
      .eq('achievement_name', achievement_name)
      .single();

    if (existingAchievement) {
      return new Response(
        JSON.stringify({ error: 'Achievement already earned' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get achievement metadata
    const { data: achievement, error: achievementError } = await supabaseClient
      .from('achievement_nfts')
      .select('*')
      .eq('achievement_name', achievement_name)
      .single();

    if (achievementError || !achievement) {
      return new Response(
        JSON.stringify({ error: 'Achievement not found' }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get user's Algorand address
    const { data: userData, error: userError } = await supabaseClient
      .from('users')
      .select('algorand_address')
      .eq('id', user.id)
      .single();

    if (userError || !userData?.algorand_address) {
      return new Response(
        JSON.stringify({ error: 'User must connect Algorand wallet first' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Algorand Testnet configuration using Nodely API
    const algodToken = Deno.env.get('ALGORAND_ALGOD_TOKEN') || '98D9CE80660AD243893D56D9F125CD2D';
    const algodServer = Deno.env.get('ALGORAND_ALGOD_SERVER') || 'https://testnet-api.4160.nodely.io';
    const algodPort = parseInt(Deno.env.get('ALGORAND_ALGOD_PORT') || '443');
    
    // Create Algod client with custom headers for Nodely
    const algodClient = new algosdk.Algodv2(
      { 'X-Algo-api-token': algodToken },
      algodServer,
      algodPort
    );

    // Get deployer account from environment
    const deployerMnemonic = Deno.env.get('ALGORAND_DEPLOYER_MNEMONIC');
    if (!deployerMnemonic) {
      return new Response(
        JSON.stringify({ error: 'Deployer account not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const deployerAccount = algosdk.mnemonicToSecretKey(deployerMnemonic);

    // Create NFT metadata
    const nftMetadata = {
      name: achievement.title,
      description: achievement.description,
      image: achievement.image_url,
      properties: {
        achievement_name: achievement.achievement_name,
        achievement_type: achievement.achievement_type,
        earned_by: user.email,
        earned_at: new Date().toISOString(),
        app: 'Chitta Wellness',
        network: 'testnet',
        ...achievement.nft_metadata
      }
    };

    // Get suggested transaction parameters
    const suggestedParams = await algodClient.getTransactionParams().do();

    // Create Asset Creation Transaction (NFT)
    const assetCreateTxn = algosdk.makeAssetCreateTxnWithSuggestedParamsFromObject({
      from: deployerAccount.addr,
      suggestedParams,
      total: 1, // NFT has total supply of 1
      decimals: 0, // NFTs have 0 decimals
      assetName: achievement.title.substring(0, 32), // Max 32 characters
      unitName: 'CHITTA', // Max 8 characters
      assetURL: achievement.image_url.substring(0, 96), // Max 96 characters
      assetMetadataHash: undefined, // Could add IPFS hash here
      defaultFrozen: false,
      freeze: undefined,
      manager: deployerAccount.addr,
      reserve: deployerAccount.addr,
      clawback: undefined,
    });

    // Sign the asset creation transaction
    const signedAssetCreateTxn = assetCreateTxn.signTxn(deployerAccount.sk);

    // Submit the transaction
    const assetCreateResponse = await algodClient.sendRawTransaction(signedAssetCreateTxn).do();
    
    // Wait for confirmation
    const assetCreateConfirmation = await algosdk.waitForConfirmation(
      algodClient,
      assetCreateResponse.txId,
      4
    );

    const assetId = assetCreateConfirmation['asset-index'];

    // Get fresh suggested params for transfer
    const transferParams = await algodClient.getTransactionParams().do();

    // Create Asset Transfer Transaction to send NFT to user
    const assetTransferTxn = algosdk.makeAssetTransferTxnWithSuggestedParamsFromObject({
      from: deployerAccount.addr,
      to: userData.algorand_address,
      assetIndex: assetId,
      amount: 1,
      suggestedParams: transferParams,
    });

    // Sign the asset transfer transaction
    const signedAssetTransferTxn = assetTransferTxn.signTxn(deployerAccount.sk);

    // Submit the transfer transaction
    const transferResponse = await algodClient.sendRawTransaction(signedAssetTransferTxn).do();
    
    // Wait for confirmation
    await algosdk.waitForConfirmation(
      algodClient,
      transferResponse.txId,
      4
    );

    // Save achievement to database
    const { data: savedAchievement, error: saveError } = await supabaseClient
      .from('user_achievements')
      .insert({
        user_id: user.id,
        achievement_name: achievement_name,
        nft_asset_id: assetId,
        transaction_id: transferResponse.txId
      })
      .select()
      .single();

    if (saveError) {
      console.error('Error saving achievement:', saveError);
      // NFT was minted but database save failed - log this for manual recovery
      return new Response(
        JSON.stringify({ 
          error: 'NFT minted but database save failed',
          asset_id: assetId,
          transaction_id: transferResponse.txId
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        achievement: savedAchievement,
        nft_asset_id: assetId,
        transaction_id: transferResponse.txId,
        metadata: nftMetadata,
        explorer_url: `https://testnet.algoexplorer.io/asset/${assetId}`
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error minting NFT:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to mint NFT',
        details: error.message 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});