> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# BlockForge Game - Move

This tutorial will guide you through building a high-frequency on-chain game on
your Move appchain. BlockForge is a crafting engine that demonstrates Invisible
UX: allowing players to interact with the blockchain seamlessly without constant
wallet popups.

By the end of this tutorial, you will have instructed your AI agent to:

* Generate and verify a Move smart contract for the game logic.
* Deploy the contract to your live appchain.
* Scaffold and connect a React frontend for players to interact with the game.
* Verify the on-chain functionality.

## Your Project Structure

The following steps will instruct your AI agent to create these directories
inside your `my-initia-project` folder:

```text wrap Project Structure theme={null}
my-initia-project/
├── blockforge/           # Move smart contract project
└── blockforge-frontend/  # React frontend application
```

<Note>
  **Prerequisite:** Ensure you have a Move-compatible appchain running
  locally. If you haven't launched one yet, complete the
  [Set Up Your Appchain](../get-started) first.
</Note>

### Readiness Check

Before you start, verify that your local infrastructure is healthy.

```terminal title="Prompt: Check local infrastructure health" wrap theme={null}
Using the `initia-appchain-dev` skill, please verify that my appchain, executor bot, and relayer are running and that my Gas Station account has a balance.
```

## Step 1: Create and Unit Test the Smart Contract

Instead of writing the code yourself, instruct your AI agent to do it for you
using the `initia-appchain-dev` skill. Your AI agent will generate the contract
and automatically run unit tests to ensure the logic is sound.

```terminal title="Prompt: Create and test the BlockForge module" wrap theme={null}
Using the `initia-appchain-dev` skill, please create a Move module project for our BlockForge game in a new directory named `blockforge`. Name the module `items` in the `blockforge` package. The game has the following rules:
- Players can mint basic items called shards.
- Players can craft relics by burning 2 shards.
- Players should have an inventory to store their items.
- I need a way to view a player's inventory.
Please also create and run unit tests to verify these rules.
```

Your AI agent will generate the `blockforge` project, including the
`items.move` module and a test script, and confirm that everything passes.

<Accordion title="Manual Approach: The Move Module">
  If you prefer to create the Move module and project manually, follow these steps in your `blockforge` directory. This is what your AI agent would generate for you.

  First, create a new Move package named `blockforge`:

  ```bash wrap Create Move Package theme={null}
  mkdir -p blockforge
  cd blockforge
  minitiad move new blockforge
  ```

  <Tip>
    `minitiad move new blockforge` creates a package named `blockforge` in the
    current working directory. Creating and entering the `blockforge/` directory
    first keeps the generated package in the expected place.
  </Tip>

  Now, update the `Move.toml` file to use the Initia stdlib dependency directly.
  Replace the content of `blockforge/Move.toml` with the following:

  ```toml wrap Move.toml theme={null}
  [package]
  name = "blockforge"
  version = "0.0.1"

  [dependencies]
  InitiaStdlib = { git = "https://github.com/initia-labs/movevm.git", subdir = "precompile/modules/initia_stdlib", rev = "main" }

  [addresses]
  blockforge = "_" # Supply via --named-addresses during build/test. Replace with the deployer hex before publishing if needed.
  std = "0x1"
  ```

  Next, create `blockforge/sources/items.move` with the following content.

  ```move wrap sources/items.move theme={null}
  module blockforge::items {
      use std::error;
      use std::signer;

      const E_INSUFFICIENT_SHARDS: u64 = 1;
      const E_INVALID_INVENTORY_STATE: u64 = 2;

      struct Inventory has key {
          shards: u64,
          relics: u64,
      }

      struct InventoryView has copy, drop, store {
          shards: u64,
          relics: u64,
      }

      fun ensure_inventory(account: &signer) {
          let addr = signer::address_of(account);
          if (!exists<Inventory>(addr)) {
              move_to(account, Inventory { shards: 0, relics: 0 });
          };
      }

      public entry fun mint_shard(account: &signer) acquires Inventory {
          ensure_inventory(account);

          let inventory = borrow_global_mut<Inventory>(signer::address_of(account));
          inventory.shards = inventory.shards + 1;
      }

      public entry fun craft_relic(account: &signer) acquires Inventory {
          ensure_inventory(account);

          let inventory = borrow_global_mut<Inventory>(signer::address_of(account));
          assert!(inventory.shards >= 2, error::invalid_argument(E_INSUFFICIENT_SHARDS));

          inventory.shards = inventory.shards - 2;
          inventory.relics = inventory.relics + 1;
      }

      #[view]
      public fun inventory_of(addr: address): InventoryView acquires Inventory {
          if (!exists<Inventory>(addr)) {
              return InventoryView { shards: 0, relics: 0 }
          };

          let inventory = borrow_global<Inventory>(addr);
          InventoryView {
              shards: inventory.shards,
              relics: inventory.relics,
          }
      }

      #[view]
      public fun shard_count(addr: address): u64 acquires Inventory {
          inventory_of(addr).shards
      }

      #[view]
      public fun relic_count(addr: address): u64 acquires Inventory {
          inventory_of(addr).relics
      }
  }
  ```

  Add the following unit tests inside the same `module blockforge::items { ... }`
  block, immediately before the final closing `}` of `items.move`, so you can
  verify minting, crafting, and the insufficient-shards failure path:

  ```move wrap Unit Tests theme={null}
      #[test(account = @blockforge)]
      fun test_mint_shard_creates_inventory(account: &signer) acquires Inventory {
          mint_shard(account);

          let inventory = inventory_of(signer::address_of(account));
          assert!(inventory.shards == 1, E_INVALID_INVENTORY_STATE);
          assert!(inventory.relics == 0, E_INVALID_INVENTORY_STATE);
      }

      #[test(account = @blockforge)]
      fun test_craft_relic_burns_two_shards(account: &signer) acquires Inventory {
          mint_shard(account);
          mint_shard(account);
          craft_relic(account);

          let inventory = inventory_of(signer::address_of(account));
          assert!(inventory.shards == 0, E_INVALID_INVENTORY_STATE);
          assert!(inventory.relics == 1, E_INVALID_INVENTORY_STATE);
      }

      #[test(account = @blockforge)]
      #[expected_failure(abort_code = 0x10001, location = blockforge::items)]
      fun test_craft_relic_requires_two_shards(account: &signer) acquires Inventory {
          mint_shard(account);
          craft_relic(account);
      }
  ```

  Once the files are created, verify everything is correct by building and testing
  the project. Replace `<YOUR_HEX_ADDRESS_WITH_0X_PREFIX>` with your deployment
  address hex (`0x...`).

  ```bash wrap Build Move Package theme={null}
  minitiad move build --language-version=2.1 --named-addresses blockforge=<YOUR_HEX_ADDRESS_WITH_0X_PREFIX>
  minitiad move test --language-version=2.1 --named-addresses blockforge=<YOUR_HEX_ADDRESS_WITH_0X_PREFIX>
  ```

  If the build succeeds and the tests pass, BlockForge is ready to deploy.
</Accordion>

## Step 2: Deploy to Your Appchain

Now that the logic is verified, build and publish the contract to your live
appchain using the Gas Station account.

```terminal title="Prompt: Deploy the BlockForge module" wrap theme={null}
Using the `initia-appchain-dev` skill, please build and publish the blockforge Move module located in the `blockforge` directory to my appchain using my Gas Station account, then return the deployed module address.
```

<Accordion title="Manual Approach: Deploy via CLI">
  First, get your Gas Station address and convert it to hex:

  ```bash wrap Get Gas Station Hex Address theme={null}
  GAS_STATION_BECH32=$(minitiad keys show gas-station -a --keyring-backend test)
  minitiad keys parse "$GAS_STATION_BECH32"
  ```

  Then, build and publish the compiled module to your appchain. Substitute
  `<YOUR_HEX_ADDRESS_WITH_0X_PREFIX>` with `0x` + the `bytes` value from
  the previous command.

  ```bash wrap Publish Move Module theme={null}
  cd blockforge

  # 1. Update Move.toml so [addresses].blockforge matches your deployer hex address.
  # 2. Build the module with the correct hex named address and version.
  minitiad move build --language-version=2.1 --named-addresses blockforge=<YOUR_HEX_ADDRESS_WITH_0X_PREFIX>

  # 3. Deploy the package.
  minitiad move deploy --build \
    --language-version=2.1 \
    --named-addresses blockforge=<YOUR_HEX_ADDRESS_WITH_0X_PREFIX> \
    --from gas-station \
    --keyring-backend test \
    --chain-id <YOUR_APPCHAIN_ID> \
    --gas auto --gas-adjustment 1.4 --yes
  ```

  <Note>
    Move modules do not have a separate instantiate transaction. For this
    tutorial, the first gameplay call (for example `mint_shard`) initializes
    per-player inventory state on demand.
  </Note>

  <Warning>
    **Redeploy Compatibility Rules:** If you are redeploying from the same account, Initia enforces backward
    compatibility for the existing module. Preserve public function signatures and
    public struct abilities, or rename the module before republishing. If you see
    `BACKWARD_INCOMPATIBLE_MODULE_UPDATE`, this account already has a non-compatible
    prior version of the module. Use a fresh funded deployer account on the same
    chain, update `blockforge` named-address values to its hex, and deploy with
    `--from <FRESH_ACCOUNT>`.
  </Warning>
</Accordion>

## Step 3: Smoke Test the Deployed Contract On-Chain

Before frontend work, smoke test the deployed module directly on chain. This
keeps contract/module debugging separate from UI integration.

```terminal title="Prompt: Smoke test the BlockForge module" wrap theme={null}
Using the `initia-appchain-dev` skill, I want to smoke test our live BlockForge game. Using my Gas Station account on my appchain, please:
1. Mint 3 shards.
2. Check my inventory.
3. Craft a relic.
4. Check my inventory again.
```

<Accordion title="Manual Approach: On-Chain Interaction">
  Here are the equivalent `minitiad` commands to interact with the module.

  ```bash wrap Mint 3 Shards theme={null}
  for i in {1..3}; do
    minitiad tx move execute <YOUR_MODULE_ADDRESS> items mint_shard \
      --from gas-station \
      --keyring-backend test \
      --chain-id <YOUR_APPCHAIN_ID> \
      --gas auto --gas-adjustment 1.4 --yes \
      --args '[]' --type-args '[]'
    sleep 2
  done
  ```

  ```bash wrap Query Inventory theme={null}
  minitiad query move resource <YOUR_WALLET_ADDRESS> <YOUR_MODULE_HEX_ADDRESS>::items::Inventory
  ```

  ```bash wrap Craft Relic theme={null}
  minitiad tx move execute <YOUR_MODULE_ADDRESS> items craft_relic \
    --from gas-station \
    --keyring-backend test \
    --chain-id <YOUR_APPCHAIN_ID> \
    --gas auto --gas-adjustment 1.4 --yes \
    --args '[]' --type-args '[]'
  ```

  ```bash wrap Query Inventory Again theme={null}
  minitiad query move resource <YOUR_WALLET_ADDRESS> <YOUR_MODULE_HEX_ADDRESS>::items::Inventory
  ```
</Accordion>

## Step 4: Create a Frontend

A game needs a user interface. Let's create one using the `initia-appchain-dev`
skill.

**1. Scaffold the Frontend:**

```terminal title="Prompt: Scaffold the BlockForge frontend" wrap theme={null}
Using the `initia-appchain-dev` skill, please scaffold a new Vite + React application named `blockforge-frontend` in my current directory using the `scaffold-frontend` script. Then, create a component named Game.jsx with Mint Shard and Craft Relic buttons and add it to the main App.jsx file.
```

**2. Connect to Appchain:**

```terminal title="Prompt: Connect the frontend to the BlockForge module" wrap theme={null}
Using the `initia-appchain-dev` skill, modify the Game.jsx component in the `blockforge-frontend` directory to connect to our BlockForge module on my appchain. Use the `@initia/interwovenkit-react` package for wallet connection and transaction signing.

The Mint Shard button should call the mint_shard function, and the Craft Relic button should call the craft_relic function. Also, please display the player's current inventory of shards and relics.
```

<Accordion title="Manual Approach: Scaffold and Connect">
  If you prefer to set up the frontend manually, follow these steps:

  **1. Create the Project and Install Dependencies:**

  Create a new Vite + React app and install the dependencies used by the working
  BlockForge frontend:

  ```bash wrap Create Frontend Project theme={null}
  npm create vite@latest blockforge-frontend -- --template react
  cd blockforge-frontend
  npm install
  npm install @initia/initia.js @initia/interwovenkit-react @tanstack/react-query wagmi buffer util
  npm install -D vite-plugin-node-polyfills
  ```

  Then update `vite.config.js` so browser builds have the required Node polyfills:

  ```js wrap vite.config.js theme={null}
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  import { nodePolyfills } from 'vite-plugin-node-polyfills'

  export default defineConfig({
    plugins: [
      react(),
      nodePolyfills({
        globals: {
          Buffer: true,
          process: true,
        },
      }),
    ],
  })
  ```

  **2. Gather Runtime Values for Frontend Config:**

  Collect the values you will use for frontend configuration:

  ```bash wrap Gather Frontend Values theme={null}
  APPCHAIN_ID=$(curl -s http://localhost:26657/status | jq -r '.result.node_info.network')
  NATIVE_DENOM=$(minitiad q bank denoms-metadata --output json | jq -r '.metadatas[0].base // empty')
  [ -z "$NATIVE_DENOM" ] && NATIVE_DENOM=$(minitiad q bank total --output json | jq -r '.supply[0].denom')
  NATIVE_SYMBOL=$(minitiad q bank denoms-metadata --output json | jq -r '.metadatas[0].symbol // empty')
  [ -z "$NATIVE_SYMBOL" ] && NATIVE_SYMBOL="$NATIVE_DENOM"

  # By default this tutorial deploys from gas-station, so module owner = gas-station.
  # If you used the fresh account fallback in Step 2, query that deployer instead.
  BLOCKFORGE_MODULE_ADDRESS=$(minitiad keys show gas-station -a --keyring-backend test)

  echo "APPCHAIN_ID=$APPCHAIN_ID"
  echo "NATIVE_DENOM=$NATIVE_DENOM"
  echo "NATIVE_SYMBOL=$NATIVE_SYMBOL"
  echo "BLOCKFORGE_MODULE_ADDRESS=$BLOCKFORGE_MODULE_ADDRESS"
  ```

  **3. Create `.env` from Runtime Values:**

  ```bash wrap Create Frontend Env theme={null}
  cat > .env <<EOF
  VITE_APPCHAIN_ID=$APPCHAIN_ID
  VITE_INITIA_RPC_URL=http://localhost:26657
  VITE_INITIA_REST_URL=http://localhost:1317
  VITE_INITIA_INDEXER_URL=http://localhost:8080
  VITE_NATIVE_DENOM=$NATIVE_DENOM
  VITE_NATIVE_SYMBOL=$NATIVE_SYMBOL
  VITE_NATIVE_DECIMALS=6
  VITE_BLOCKFORGE_MODULE_ADDRESS=$BLOCKFORGE_MODULE_ADDRESS
  EOF
  ```

  **4. Set up Providers in `main.jsx`:**

  Wrap your application with `InterwovenKitProvider` to enable wallet
  connectivity. Ensure the `customChain` includes `fee_tokens`, `staking`, and
  `bech32_prefix`.

  ```tsx wrap main.jsx theme={null}
  import { Buffer } from 'buffer'
  window.Buffer = Buffer
  window.process = { env: { NODE_ENV: 'development' } }

  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
  import { WagmiProvider, createConfig, http } from 'wagmi'
  import { mainnet } from 'wagmi/chains'
  import {
    InterwovenKitProvider,
    TESTNET,
    injectStyles,
  } from '@initia/interwovenkit-react'
  import '@initia/interwovenkit-react/styles.css'
  import InterwovenKitStyles from '@initia/interwovenkit-react/styles.js'
  import App from './App.jsx'

  injectStyles(InterwovenKitStyles)

  const queryClient = new QueryClient()
  const wagmiConfig = createConfig({
    chains: [mainnet],
    transports: {
      [mainnet.id]: http(),
    },
  })

  const customChain = {
    chain_id: import.meta.env.VITE_APPCHAIN_ID,
    chain_name: 'BlockForge Appchain',
    pretty_name: 'BlockForge',
    bech32_prefix: 'init',
    network_type: 'testnet',
    apis: {
      rpc: [{ address: import.meta.env.VITE_INITIA_RPC_URL }],
      rest: [{ address: import.meta.env.VITE_INITIA_REST_URL }],
      indexer: [{ address: import.meta.env.VITE_INITIA_INDEXER_URL }],
    },
    fees: {
      fee_tokens: [
        {
          denom: import.meta.env.VITE_NATIVE_DENOM,
          fixed_min_gas_price: 0,
          low_gas_price: 0,
          average_gas_price: 0,
          high_gas_price: 0
        },
      ],
    },
    staking: {
      staking_tokens: [{ denom: import.meta.env.VITE_NATIVE_DENOM }],
    },
    metadata: {
      is_l1: false,
      minitia: {
        type: 'minimove',
      },
    },
    native_assets: [
      {
        denom: import.meta.env.VITE_NATIVE_DENOM,
        name: 'Native Token',
        symbol: import.meta.env.VITE_NATIVE_SYMBOL,
        decimals: Number(import.meta.env.VITE_NATIVE_DECIMALS ?? 6),
      }
    ]
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <InterwovenKitProvider
            {...TESTNET}
            defaultChainId={customChain.chain_id}
            customChain={customChain}
            customChains={[customChain]}
          >
            <App />
          </InterwovenKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>,
  )
  ```

  **5. Add the Game Component:**

  Then create `src/Game.jsx`:

  ```jsx wrap Game.jsx theme={null}
  import React, { useEffect, useState } from 'react'
  import { AccAddress, RESTClient } from '@initia/initia.js'
  import { MsgExecute } from '@initia/initia.proto/initia/move/v1/tx'
  import { useInterwovenKit } from '@initia/interwovenkit-react'

  const CHAIN_ID = import.meta.env.VITE_APPCHAIN_ID
  const REST_URL = import.meta.env.VITE_INITIA_REST_URL
  const MODULE_ADDRESS = import.meta.env.VITE_BLOCKFORGE_MODULE_ADDRESS
  const MODULE_ADDRESS_HEX = AccAddress.toHex(MODULE_ADDRESS)
  const INVENTORY_STRUCT_TAG = `${MODULE_ADDRESS_HEX}::items::Inventory`
  const rest = new RESTClient(REST_URL, { chainId: CHAIN_ID })
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  const EMPTY_INVENTORY = { shards: 0, relics: 0 }

  export default function Game() {
    const { initiaAddress, openConnect, requestTxSync } = useInterwovenKit()
    const [inventory, setInventory] = useState(EMPTY_INVENTORY)
    const [loading, setLoading] = useState(false)

    const loadInventory = async (walletAddress) => {
      if (!walletAddress) {
        setInventory(EMPTY_INVENTORY)
        return
      }

      setLoading(true)
      try {
        const resource = await rest.move.resource(walletAddress, INVENTORY_STRUCT_TAG)
        setInventory({
          shards: Number(resource.data?.shards ?? 0),
          relics: Number(resource.data?.relics ?? 0),
        })
      } catch (error) {
        const message = String(error?.response?.data?.message || error?.message || '')
        if (message.includes('not found')) {
          setInventory(EMPTY_INVENTORY)
        } else {
          throw error
        }
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      loadInventory(initiaAddress)
    }, [initiaAddress])

    const execute = async (functionName) => {
      if (!initiaAddress) {
        openConnect()
        return
      }

      await requestTxSync({
        chainId: CHAIN_ID,
        messages: [
          {
            typeUrl: '/initia.move.v1.MsgExecute',
            value: MsgExecute.fromPartial({
              sender: initiaAddress,
              moduleAddress: MODULE_ADDRESS,
              moduleName: 'items',
              functionName,
              typeArgs: [],
              args: [],
            }),
          },
        ],
      })

      await sleep(2000)
      await loadInventory(initiaAddress)
    }

    return (
      <div>
        <button onClick={() => execute('mint_shard')}>Mint Shard</button>
        <button onClick={() => execute('craft_relic')}>Craft Relic</button>
        <p>Shards: {loading ? '...' : inventory.shards}</p>
        <p>Relics: {loading ? '...' : inventory.relics}</p>
      </div>
    )
  }
  ```

  Render `<Game />` from `src/App.jsx`.

  <Tip>
    **Refresh Delay After Transactions:** local Move state queries can
    lag briefly after a successful `requestTxSync`. Wait about 2 seconds before
    reloading inventory so the new state is visible.
  </Tip>
</Accordion>

## Step 5: Wallet Funding and UI Verification

Ask your AI agent to fund your browser wallet, then verify frontend behavior
manually in the browser:

1. Start the frontend:

```bash wrap Start Vite Dev Server theme={null}
cd blockforge-frontend
npm run dev
```

Check the **browser console** if you encounter issues.

2. Open your browser wallet and copy your address (`init1...`).
3. Give this prompt to your AI agent, replacing `<YOUR_WALLET_ADDRESS>` with the address you just copied:

```terminal wrap theme={null}
Using the `initia-appchain-dev` skill, please fund my wallet address <YOUR_WALLET_ADDRESS> with 1 INIT on L1 and 100 of my appchain's native tokens on L2.
```

4. Connect your wallet in `blockforge-frontend`.
5. Test the gameplay flow by minting shards, crafting a relic, and confirming the displayed inventory state updates correctly after each action.

If you get stuck, see the [Debugging Workflow guide](../builder-guide#debugging-workflow).

# 🪢 Native Feature: Auto-signing

To make your BlockForge game natively integrated with the Initia stack, you can
enable Auto-signing to create a frictionless experience where players don't
see wallet popups for every game action.

Auto-signing works by deriving a unique, application-specific `Ghost Wallet`
from a one-time signature. Your primary wallet then grants this `Ghost Wallet`
permission (`Authz`) to execute specific functions and use its balance for
fees (`Feegrant`), allowing for seamless, session-based gameplay.

## Step 6: Update the Frontend

You can enable session-based signing by modifying your provider configuration
and adding a toggle in your UI.

```terminal title="Prompt: Add auto-signing support" wrap theme={null}
Using the `initia-appchain-dev` skill, please modify my InterwovenKit configuration in `main.jsx` to enable `enableAutoSign`. Then, update `Game.jsx` to include a button that toggles auto-signing on and off for the player using the `autoSign` methods from `useInterwovenKit`.
```

<Accordion title="Manual Approach: Auto-signing Logic">
  First, enable the feature in your provider:

  ```tsx wrap main.jsx theme={null}
  <InterwovenKitProvider
    {...TESTNET}
    // Enables auto-signing for MoveVM transactions
    enableAutoSign={true}
  >
    <App />
  </InterwovenKitProvider>
  ```

  Then, use the `useInterwovenKit` hook in your component to manage the session:

  ```tsx wrap Game.jsx theme={null}
  const { initiaAddress, autoSign, requestTxSync } = useInterwovenKit()
  const CHAIN_ID = '<YOUR_APPCHAIN_ID>'

  // Check if auto-sign is active for this chain
  const isAutoSignEnabled = autoSign?.isEnabledByChain?.[CHAIN_ID]

  const toggleAutoSign = async () => {
    if (isAutoSignEnabled) {
      try {
        await autoSign?.disable(CHAIN_ID)
      } catch (error) {
        const message = String(error?.response?.data?.message || error?.message || '')
        if (message.includes('authorization not found')) {
          await autoSign?.enable(CHAIN_ID, {
            permissions: ["/initia.move.v1.MsgExecute"]
          })
          await autoSign?.disable(CHAIN_ID)
        } else {
          throw error
        }
      }
    } else {
      // Permissions are required for the session key to sign specific message types
      await autoSign?.enable(CHAIN_ID, { 
        permissions: ["/initia.move.v1.MsgExecute"] 
      })
    }
  }

  const handleAction = async () => {
    await requestTxSync({
      chainId: CHAIN_ID,
      autoSign: isAutoSignEnabled, // Enables headless signing flow
      feeDenom: isAutoSignEnabled ? '<YOUR_NATIVE_DENOM>' : undefined, // MANDATORY for invisible UX
      messages: [
        {
          typeUrl: "/initia.move.v1.MsgExecute",
          value: {
            sender: initiaAddress,
            moduleAddress: "<YOUR_MODULE_ADDRESS>",
            moduleName: "items",
            functionName: "mint_shard",
            typeArgs: [], // MANDATORY: Even if empty
            args: [],     // MANDATORY: Even if empty
          },
        }
      ]
    })
  }

  return (
    <div>
      <button onClick={toggleAutoSign}>
        {isAutoSignEnabled ? 'Disable Auto-Sign' : 'Enable Auto-Sign'}
      </button>
      <button onClick={handleAction}>
        Mint With Current Auto-Sign Mode
      </button>
    </div>
  )
  ```

  <Tip>
    **Session Expiration:** You can check the exact expiration of the current session using `autoSign.expiredAtByChain[chainId]`.
  </Tip>
</Accordion>

If you want the complete finished frontend after applying the manual steps
above, use the consolidated reference below.

<Accordion title="Manual Approach: Final Frontend Reference">
  If you want a single copyable end-state after completing the manual steps
  above, use this consolidated reference. It combines:

  * runtime config from `.env`,
  * InterwovenKit provider wiring in `main.jsx`,
  * wallet connect/display in `App.jsx`, and
  * live Move inventory, actions, and auto-sign toggle flow in `Game.jsx`.

  **.env**

  ```bash wrap .env theme={null}
  VITE_BLOCKFORGE_MODULE_ADDRESS=<YOUR_MODULE_OWNER_BECH32>
  ```

  **src/main.jsx**

  ```jsx wrap src/main.jsx theme={null}
  import { Buffer } from 'buffer'
  window.Buffer = Buffer
  window.process = { env: { NODE_ENV: 'development' } }

  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import "@initia/interwovenkit-react/styles.css";
  import { injectStyles, InterwovenKitProvider, TESTNET } from "@initia/interwovenkit-react";
  import InterwovenKitStyles from "@initia/interwovenkit-react/styles.js";
  import { WagmiProvider, createConfig, http } from "wagmi";
  import { mainnet } from "wagmi/chains";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import App from './App.jsx'
  import './index.css'

  injectStyles(InterwovenKitStyles);

  const queryClient = new QueryClient();
  const wagmiConfig = createConfig({
    chains: [mainnet],
    transports: { [mainnet.id]: http() },
  });

  const customChain = {
    chain_id: '<YOUR_APPCHAIN_ID>',
    chain_name: 'blockforge',
    pretty_name: 'BlockForge',
    network_type: 'testnet',
    bech32_prefix: 'init',
    logo_URIs: {
      png: 'https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.png',
      svg: 'https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.svg',
    },
    apis: {
      rpc: [{ address: 'http://localhost:26657' }],
      rest: [{ address: 'http://localhost:1317' }],
      indexer: [{ address: 'http://localhost:8080' }],
      'json-rpc': [{ address: 'http://localhost:8545' }],
    },
    fees: {
      fee_tokens: [{
        denom: '<YOUR_NATIVE_DENOM>',
        fixed_min_gas_price: 0,
        low_gas_price: 0,
        average_gas_price: 0,
        high_gas_price: 0
      }],
    },
    staking: {
      staking_tokens: [{ denom: '<YOUR_NATIVE_DENOM>' }]
    },
    metadata: {
      is_l1: false,
      minitia: {
        type: 'minimove',
      },
    },
    native_assets: [
      {
        denom: '<YOUR_NATIVE_DENOM>',
        name: 'Native Token',
        symbol: '<YOUR_TOKEN_SYMBOL>',
        decimals: Number(import.meta.env.VITE_NATIVE_DECIMALS ?? 6)
      }
    ]
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <InterwovenKitProvider
            {...TESTNET}
            defaultChainId={customChain.chain_id}
            enableAutoSign={true}
            customChain={customChain}
            customChains={[customChain]}
          >
            <App />
          </InterwovenKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>,
  )
  ```

  **src/App.jsx**

  ```jsx wrap src/App.jsx theme={null}
  import React from 'react'
  import { useInterwovenKit } from "@initia/interwovenkit-react";
  import Game from './Game.jsx';

  function App() {
    const { initiaAddress, openConnect, openWallet } = useInterwovenKit();

    const shortenAddress = (addr) => {
      if (!addr) return "";
      return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
    };

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <header style={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2rem'
        }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>BlockForge</h1>

          {!initiaAddress ? (
            <button onClick={openConnect} className="btn btn-primary">Connect Wallet</button>
          ) : (
            <button onClick={openWallet} className="btn btn-secondary">
              {shortenAddress(initiaAddress)}
            </button>
          )}
        </header>

        <main style={{ flex: 1, width: '100%', maxWidth: '760px', padding: '2rem' }}>
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <section className="card" style={{ display: 'grid', gap: '0.9rem' }}>
              <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Local Rollup
              </p>
              <div>
                <h2 style={{ fontSize: '2.2rem', margin: 0 }}>Items Workshop</h2>
                <p style={{ color: 'var(--fg-muted)', margin: '0.75rem 0 0', lineHeight: 1.6 }}>
                  Connect a wallet to mint shards and craft relics against the deployed <code>items</code> module.
                </p>
              </div>
            </section>

            <Game />
          </div>
        </main>
      </div>
    )
  }

  export default App
  ```

  **src/Game.jsx**

  ```jsx wrap src/Game.jsx theme={null}
  import React, { useEffect, useState } from 'react'
  import { AccAddress, RESTClient } from '@initia/initia.js'
  import { MsgExecute } from '@initia/initia.proto/initia/move/v1/tx'
  import { useInterwovenKit } from '@initia/interwovenkit-react'

  const CHAIN_ID = '<YOUR_APPCHAIN_ID>'
  const REST_URL = 'http://localhost:1317'
  const MODULE_ADDRESS = import.meta.env.VITE_BLOCKFORGE_MODULE_ADDRESS
  const MODULE_ADDRESS_HEX = AccAddress.toHex(MODULE_ADDRESS)
  const INVENTORY_STRUCT_TAG = `${MODULE_ADDRESS_HEX}::items::Inventory`
  const rest = new RESTClient(REST_URL, { chainId: CHAIN_ID })
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

  const EMPTY_INVENTORY = { shards: 0, relics: 0 }

  function Game() {
    const { initiaAddress, openConnect, requestTxSync, autoSign } = useInterwovenKit()
    const [inventory, setInventory] = useState(EMPTY_INVENTORY)
    const [isLoadingInventory, setIsLoadingInventory] = useState(false)
    const [pendingAction, setPendingAction] = useState('')
    const [isTogglingAutoSign, setIsTogglingAutoSign] = useState(false)
    const [error, setError] = useState('')
    const [txHash, setTxHash] = useState('')

    const isConnected = Boolean(initiaAddress)
    const isAutoSignEnabled = Boolean(autoSign?.isEnabledByChain?.[CHAIN_ID])

    const loadInventory = async (address) => {
      if (!address) {
        setInventory(EMPTY_INVENTORY)
        return
      }

      setIsLoadingInventory(true)
      try {
        const resource = await rest.move.resource(address, INVENTORY_STRUCT_TAG)
        setInventory({
          shards: Number(resource.data?.shards ?? 0),
          relics: Number(resource.data?.relics ?? 0),
        })
        setError('')
      } catch (fetchError) {
        const message = String(fetchError?.response?.data?.message || fetchError?.message || '')
        const notFound = fetchError?.response?.status === 500 && message.includes('not found')

        if (notFound) {
          setInventory(EMPTY_INVENTORY)
          setError('')
        } else {
          setError(message || 'Failed to load inventory.')
        }
      } finally {
        setIsLoadingInventory(false)
      }
    }

    useEffect(() => {
      if (!initiaAddress) {
        setInventory(EMPTY_INVENTORY)
        setError('')
        setTxHash('')
        return
      }

      loadInventory(initiaAddress)
    }, [initiaAddress])

    const submitAction = async (functionName) => {
      if (!initiaAddress) {
        openConnect()
        return
      }

      setPendingAction(functionName)
      setError('')
      setTxHash('')

      try {
        const result = await requestTxSync({
          chainId: CHAIN_ID,
          autoSign: isAutoSignEnabled,
          feeDenom: isAutoSignEnabled ? '<YOUR_NATIVE_DENOM>' : undefined,
          messages: [
            {
              typeUrl: '/initia.move.v1.MsgExecute',
              value: MsgExecute.fromPartial({
                sender: initiaAddress,
                moduleAddress: MODULE_ADDRESS,
                moduleName: 'items',
                functionName,
                typeArgs: [],
                args: [],
              }),
            },
          ],
        })

        await sleep(2000)
        await loadInventory(initiaAddress)

        const responseHash =
          result?.txhash ||
          result?.tx_response?.txhash ||
          result?.transactionHash ||
          ''
        setTxHash(responseHash)
      } catch (submitError) {
        setError(
          String(
            submitError?.response?.data?.message ||
            submitError?.message ||
            'Transaction failed.',
          ),
        )
      } finally {
        setPendingAction('')
      }
    }

    const toggleAutoSign = async () => {
      if (!initiaAddress) {
        openConnect()
        return
      }

      setIsTogglingAutoSign(true)
      setError('')

      try {
        if (isAutoSignEnabled) {
          try {
            await autoSign?.disable(CHAIN_ID)
          } catch (disableError) {
            const disableMessage = String(
              disableError?.response?.data?.message ||
              disableError?.message ||
              '',
            )

            if (disableMessage.includes('authorization not found')) {
              await autoSign?.enable(CHAIN_ID, {
                permissions: ['/initia.move.v1.MsgExecute'],
              })
              await autoSign?.disable(CHAIN_ID)
            } else {
              throw disableError
            }
          }
        } else {
          await autoSign?.enable(CHAIN_ID, {
            permissions: ['/initia.move.v1.MsgExecute'],
          })
        }
      } catch (toggleError) {
        setError(
          String(
            toggleError?.response?.data?.message ||
            toggleError?.message ||
            'Failed to update auto-sign.',
          ),
        )
      } finally {
        setIsTogglingAutoSign(false)
      }
    }

    return (
      <section className="card" style={{ display: 'grid', gap: '1.25rem' }}>
        <div>
          <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            BlockForge
          </p>
          <h2 style={{ margin: '0.35rem 0 0', fontSize: '1.9rem' }}>Forge items on your appchain</h2>
        </div>

        <div style={{ display: 'grid', gap: '0.9rem', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
          <button
            className="btn btn-primary"
            type="button"
            disabled={pendingAction === 'mint_shard'}
            onClick={() => submitAction('mint_shard')}
          >
            {pendingAction === 'mint_shard' ? 'Minting...' : 'Mint Shard'}
          </button>
          <button
            className="btn btn-secondary"
            type="button"
            disabled={pendingAction === 'craft_relic'}
            onClick={() => submitAction('craft_relic')}
          >
            {pendingAction === 'craft_relic' ? 'Crafting...' : 'Craft Relic'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, color: 'var(--fg-muted)', fontSize: '0.8rem', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Auto-Sign
            </p>
            <p style={{ margin: '0.35rem 0 0', color: 'var(--fg-muted)' }}>
              {isAutoSignEnabled ? 'Enabled for Move execute messages on this chain.' : 'Disabled. Wallet approval is required for each transaction.'}
            </p>
          </div>

          <button className="btn btn-secondary" type="button" onClick={toggleAutoSign} disabled={isTogglingAutoSign}>
            {isTogglingAutoSign ? 'Updating...' : isAutoSignEnabled ? 'Disable Auto-Sign' : 'Enable Auto-Sign'}
          </button>
        </div>

        <section style={{ display: 'grid', gap: '0.9rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <p style={{ margin: 0, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--fg-muted)' }}>
                Inventory
              </p>
              <p style={{ margin: '0.35rem 0 0', color: 'var(--fg-muted)' }}>
                {isConnected ? initiaAddress : 'Connect a wallet to view your items.'}
              </p>
            </div>

            {!isConnected ? (
              <button className="btn btn-primary" type="button" onClick={openConnect}>
                Connect Wallet
              </button>
            ) : (
              <button className="btn btn-secondary" type="button" onClick={() => loadInventory(initiaAddress)}>
                {isLoadingInventory ? 'Refreshing...' : 'Refresh Inventory'}
              </button>
            )}
          </div>

          <p>Shards: {isLoadingInventory ? '...' : inventory.shards}</p>
          <p>Relics: {isLoadingInventory ? '...' : inventory.relics}</p>

          {txHash ? <p>Latest tx: <code>{txHash}</code></p> : null}
          {error ? <p>{error}</p> : null}
        </section>
      </section>
    )
  }

  export default Game
  ```

  This reference assumes:

  * your module owner is stored in `.env` as bech32,
  * `moduleAddress` in `MsgExecute` uses that bech32 value,
  * inventory reads use `rest.move.resource` with a hex struct tag.
</Accordion>

### Native Feature Verification

1. Connect your wallet in `blockforge-frontend`.
2. Enable Auto-sign and approve the one-time Auto-sign setup.
3. Click `Mint Shard` and confirm the transaction completes without a new wallet signature prompt.
4. Disable Auto-sign.
5. Click `Mint Shard` again and confirm a wallet signature prompt is required.

## Next Steps

Now that you've mastered a Move application, you're ready to build your own
idea! Ensure your project meets all the
[Submission Requirements](../submission-requirements) before submitting.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# MiniBank - EVM

This tutorial will guide you through building a liquidity-ready digital piggy
bank on your EVM appchain. Users can deposit tokens, withdraw them, and access
the broader Initia ecosystem via native bridging.

By the end of this tutorial, you will have:

* Generated and verified a Solidity smart contract for the bank logic.
* Deployed the contract to your live appchain.
* Scaffolded and connected a React frontend.
* Verified the on-chain functionality.

## Your Project Structure

The following steps will instruct your AI agent to create these directories
inside your `my-initia-project` folder:

```text wrap Project Structure theme={null}
my-initia-project/
├── minibank/           # Solidity smart contract project
└── minibank-frontend/  # React frontend application
```

<Note>
  **Prerequisite:** Ensure you have an EVM-compatible appchain running
  locally. If you haven't launched one yet, complete the
  [Set Up Your Appchain](../get-started) first.
</Note>

### Readiness Check

Before you start, verify that your local infrastructure is healthy.

```terminal title="Prompt: Check local infrastructure health" wrap theme={null}
Using the `initia-appchain-dev` skill, please verify that my appchain, executor bot, and relayer are running and that my Gas Station account has a balance.
```

## Step 1: Create and Unit Test the Smart Contract

Instruct your AI agent to create the Solidity contract using the
`initia-appchain-dev` skill. Your AI agent will generate the contract and
automatically run unit tests to ensure the logic is sound.

```terminal title="Prompt: Create and test the MiniBank contract" wrap theme={null}
Using the `initia-appchain-dev` skill, please create a Solidity smart contract project for our MiniBank in a new directory named `minibank`. The contract should:
- Allow users to deposit native tokens.
- Allow users to withdraw their own deposited tokens.
- Keep track of each user's total savings.
- Include a function to view the caller's current balance.
Please also create and run unit tests to verify these features.
```

Your AI agent will generate the `minibank` project and confirm that the tests
(likely using Foundry or Hardhat) pass successfully.

<Accordion title="Manual Approach: The Solidity Contract">
  Initialize a Foundry project first:

  ```bash wrap Initialize Foundry Project theme={null}
  # Use --no-git to avoid nested repos if you're already in a git project.
  forge init minibank --no-git
  cd minibank
  ```

  If you prefer to create the contract manually, here is the Solidity code your AI agent would generate. Save this as MiniBank.sol in your `minibank/src` directory.

  ```solidity wrap src/MiniBank.sol theme={null}
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.24;

  contract MiniBank {
      mapping(address => uint256) private balances;

      event Deposited(address indexed user, uint256 amount);
      event Withdrawn(address indexed user, uint256 amount);

      function deposit() public payable {
          require(msg.value > 0, "Cannot deposit 0");
          balances[msg.sender] += msg.value;
          emit Deposited(msg.sender, msg.value);
      }

      function withdraw(uint256 amount) public {
          require(amount > 0, "Withdrawal amount must be greater than zero");
          require(balances[msg.sender] >= amount, "Insufficient balance");

          balances[msg.sender] -= amount;
          (bool success, ) = payable(msg.sender).call{value: amount}("");
          require(success, "Transfer failed");

          emit Withdrawn(msg.sender, amount);
      }

      function myBalance() public view returns (uint256) {
        // NOTE: This returns the balance for the CALLER (msg.sender).
        // In tests or frontend calls, ensure the correct account is the caller.
        return balances[msg.sender];
      }

      function totalSavingsOf(address user) public view returns (uint256) {
        // Helper to check the balance of any user without needing a 'from' address.
        return balances[user];
      }

      receive() external payable {
          deposit();
      }
  }
  ```

  ### Unit Testing with Foundry

  To verify your contract's logic, create a test file named `MiniBank.t.sol` in
  the `test` directory.

  ```solidity wrap test/MiniBank.t.sol theme={null}
  // SPDX-License-Identifier: MIT
  pragma solidity ^0.8.24;

  import "forge-std/Test.sol";
  import "../src/MiniBank.sol";

  contract MiniBankTest is Test {
      MiniBank public bank;
      address public user = address(0x123);

      function setUp() public {
          bank = new MiniBank();
          vm.deal(user, 10 ether);
      }

      function testDeposit() public {
          vm.prank(user);
          bank.deposit{value: 1 ether}();
          assertEq(bank.totalSavingsOf(user), 1 ether);
      }

      function testWithdraw() public {
          vm.startPrank(user);
          bank.deposit{value: 2 ether}();
          bank.withdraw(1 ether);
          assertEq(bank.totalSavingsOf(user), 1 ether);
          vm.stopPrank();
      }

      function testWithdrawInsufficientBalance() public {
          vm.prank(user);
          bank.deposit{value: 1 ether}();

          vm.prank(user);
          vm.expectRevert("Insufficient balance");
          bank.withdraw(2 ether);
      }
  }
  ```

  Run your tests:

  ```bash wrap Run Foundry Tests theme={null}
  forge test
  ```
</Accordion>

## Step 2: Deploy to Your Appchain

Now that the logic is verified, build and publish the contract to your live
appchain using the Gas Station account.

```terminal title="Prompt: Deploy the MiniBank contract" wrap theme={null}
Using the `initia-appchain-dev` skill, please build, publish, and instantiate the MiniBank Solidity contract located in the `minibank` directory to my appchain using my Gas Station account, then return the deployed contract address.
```

<Accordion title="Manual Approach: Deploy via CLI">
  First, compile your contract and extract the hex bytecode:

  ```bash wrap Compile And Extract Bytecode theme={null}
  # Navigate to the contract directory
  cd minibank

  # Compile with Foundry
  forge build

  # Extract bytecode (requires jq)
  # Ensure NO '0x' prefix and NO trailing newlines
  jq -r '.bytecode.object' out/MiniBank.sol/MiniBank.json | tr -d '\n' | sed 's/^0x//' > minibank.bin
  ```

  Then deploy the binary. **Find your Chain ID first** if you don't know it:

  ```bash wrap Get Chain ID theme={null}
  # Query the appchain ID directly
  curl -s http://localhost:26657/status | jq -r '.result.node_info.network'
  ```

  Now deploy:

  ```bash wrap Deploy Contract theme={null}
  # Replace `<YOUR_APPCHAIN_ID>` with the ID from the command above
  minitiad tx evm create minibank.bin \
    --from gas-station \
    --keyring-backend test \
    --chain-id <YOUR_APPCHAIN_ID> \
    --node http://localhost:26657 \
    --gas auto --gas-adjustment 1.4 --yes --output json > deploy.json
  ```

  **Retrieve your contract address:** The output will provide a `txhash`. Wait a
  few seconds for indexing, then find your contract address:

  ```bash wrap Get Contract Address theme={null}
  # Replace <YOUR_TX_HASH> with the hash from deploy.json
  minitiad q tx <YOUR_TX_HASH> --node http://localhost:26657 --output json | jq -r '.events[] | select(.type=="contract_created") | .attributes[] | select(.key=="contract") | .value'
  ```
</Accordion>

## Step 3: Smoke Test the Deployed Contract On-Chain

Before moving to frontend integration, smoke test the deployed contract
directly on chain from the CLI. This isolates contract-level issues before UI
work.

```terminal title="Prompt: Smoke test the MiniBank contract" wrap theme={null}
Using the `initia-appchain-dev` skill, I want to smoke test our live MiniBank contract. Using my Gas Station account on my appchain, please:
1. Deposit 1 token.
2. Check my balance.
3. Withdraw 0.5 tokens.
4. Check my balance again.
```

<Accordion title="Manual Approach: On-Chain Interaction">
  Call `deposit()` and send exactly `1` token in base units (`1e18` wei).

  ```bash wrap Deposit 1 Token theme={null}
  DATA=$(cast calldata "deposit()")
  minitiad tx evm call <YOUR_CONTRACT_ADDRESS> $DATA \
    --from gas-station \
    --keyring-backend test \
    --chain-id <YOUR_APPCHAIN_ID> \
    --node http://localhost:26657 \
    --value 1000000000000000000 \
    --gas auto --gas-adjustment 1.4 --yes
  ```

  Query `myBalance()` as your sender account so `msg.sender` resolves correctly.

  ```bash wrap Query Balance theme={null}
  SENDER=$(minitiad keys show gas-station -a --keyring-backend test)
  DATA=$(cast calldata "myBalance()")
  RAW=$(minitiad q evm call $SENDER <YOUR_CONTRACT_ADDRESS> $DATA --node http://localhost:26657 --output json | jq -r '.response')
  echo "base_units: $(cast to-dec $RAW)"
  echo "tokens: $(cast --from-wei $(cast to-dec $RAW) ether)"
  ```

  Call `withdraw(uint256)` with `0.5` token in base units (`5e17` wei).

  ```bash wrap Withdraw 0.5 Tokens theme={null}
  DATA=$(cast calldata "withdraw(uint256)" 500000000000000000)
  minitiad tx evm call <YOUR_CONTRACT_ADDRESS> $DATA \
    --from gas-station \
    --keyring-backend test \
    --chain-id <YOUR_APPCHAIN_ID> \
    --node http://localhost:26657 \
    --gas auto --gas-adjustment 1.4 --yes
  ```

  Query `myBalance()` again to confirm the post-withdraw balance.

  ```bash wrap Query Balance Again theme={null}
  SENDER=$(minitiad keys show gas-station -a --keyring-backend test)
  DATA=$(cast calldata "myBalance()")
  RAW=$(minitiad q evm call $SENDER <YOUR_CONTRACT_ADDRESS> $DATA --node http://localhost:26657 --output json | jq -r '.response')
  echo "base_units: $(cast to-dec $RAW)"
  echo "tokens: $(cast --from-wei $(cast to-dec $RAW) ether)"
  ```
</Accordion>

## Step 4: Create a Frontend

Let's create a simple UI to interact with our bank.

**1. Scaffold the Frontend:**

```terminal title="Prompt: Scaffold the MiniBank frontend" wrap theme={null}
Using the `initia-appchain-dev` skill, please scaffold a new Vite + React application named `minibank-frontend` in my current directory using the `scaffold-frontend` script. Create a component named Bank.jsx with Deposit and Withdraw buttons and an input field for the amount.
```

**2. Connect to Appchain:**

```terminal title="Prompt: Connect the frontend to the MiniBank contract" wrap theme={null}
Using the `initia-appchain-dev` skill, modify the Bank.jsx component in the `minibank-frontend` directory to connect to our MiniBank contract on my appchain. Use the `@initia/interwovenkit-react` package for wallet connection and transaction signing.
```

<Accordion title="Manual Approach: Scaffold and Connect">
  If you prefer to set up the frontend manually, follow these steps:

  **1. Create the Project and Install Dependencies:**

  ```bash wrap Create React App theme={null}
  npm create vite@latest minibank-frontend -- --template react
  cd minibank-frontend
  npm install
  npm install @initia/interwovenkit-react wagmi viem @tanstack/react-query @initia/initia.js
  npm install --save-dev vite-plugin-node-polyfills
  npm install buffer util
  ```

  **2. Verify `index.html`:** Vite scaffolding already creates `index.html`.
  Confirm it has this minimal structure in the root of your
  `minibank-frontend` directory:

  ```html wrap index.html theme={null}
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>MiniBank Frontend</title>
    </head>
    <body>
      <div id="root"></div>
      <script type="module" src="/src/main.jsx"></script>
    </body>
  </html>
  ```

  **3. Configure Vite Polyfills:** Update `vite.config.js` to include the Node
  polyfills:

  ```javascript wrap vite.config.js theme={null}
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  import { nodePolyfills } from 'vite-plugin-node-polyfills'

  export default defineConfig({
    resolve: {
      dedupe: ['react', 'react-dom', 'wagmi', '@tanstack/react-query', 'viem'],
    },
    optimizeDeps: {
      include: ['wagmi', '@tanstack/react-query', 'viem'],
    },
    plugins: [
      react(),
      nodePolyfills({
        globals: {
          Buffer: true,
          process: true,
        },
      }),
    ],
  })
  ```

  **4. Gather Runtime Values for Frontend Config:** Before creating `.env`,
  collect the values you will use:

  ```bash wrap Gather Frontend Values theme={null}
  APPCHAIN_ID=$(curl -s http://localhost:26657/status | jq -r '.result.node_info.network')
  NATIVE_DENOM=$(minitiad q evm params --output json | jq -r '.params.fee_denom')
  NATIVE_SYMBOL=$(minitiad q bank denoms-metadata --output json \
    | jq -r --arg denom "$NATIVE_DENOM" '
        .metadatas[]
        | select(.base==$denom or .display==$denom)
        | .symbol
      ' \
    | head -n1)
  [ -z "$NATIVE_SYMBOL" ] && NATIVE_SYMBOL="$NATIVE_DENOM"

  # Use the contract address you retrieved in Step 2.
  MINIBANK_CONTRACT=<YOUR_CONTRACT_ADDRESS>

  echo "APPCHAIN_ID=$APPCHAIN_ID"
  echo "NATIVE_DENOM=$NATIVE_DENOM"
  echo "NATIVE_SYMBOL=$NATIVE_SYMBOL"
  echo "MINIBANK_CONTRACT=$MINIBANK_CONTRACT"
  ```

  **5. Create `.env` from Runtime Values:**

  ```bash wrap Create Frontend Env theme={null}
  cat > .env <<EOF
  VITE_APPCHAIN_ID=$APPCHAIN_ID
  VITE_NATIVE_DENOM=$NATIVE_DENOM
  VITE_NATIVE_SYMBOL=$NATIVE_SYMBOL
  VITE_NATIVE_DECIMALS=18
  VITE_JSON_RPC_URL=http://localhost:8545
  VITE_MINIBANK_CONTRACT=$MINIBANK_CONTRACT
  VITE_BRIDGE_SRC_CHAIN_ID=initiation-2
  VITE_BRIDGE_SRC_DENOM=uinit
  EOF
  ```

  **6. Set up Providers in `main.jsx`:**

  ```javascript wrap src/main.jsx theme={null}
  import { Buffer } from 'buffer'
  window.Buffer = Buffer
  window.process = { env: { NODE_ENV: 'development' } }

  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import '@initia/interwovenkit-react/styles.css'
  import {
    injectStyles,
    InterwovenKitProvider,
    TESTNET,
  } from '@initia/interwovenkit-react'
  import InterwovenKitStyles from '@initia/interwovenkit-react/styles.js'
  import { WagmiProvider, createConfig, http } from 'wagmi'
  import { mainnet } from 'wagmi/chains'
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
  import App from './App.jsx'

  injectStyles(InterwovenKitStyles)

  const queryClient = new QueryClient()
  const wagmiConfig = createConfig({
    chains: [mainnet],
    transports: { [mainnet.id]: http() },
  })

  const customChain = {
    chain_id: import.meta.env.VITE_APPCHAIN_ID,
    chain_name: 'minibank',
    pretty_name: 'MiniBank Appchain',
    network_type: 'testnet',
    bech32_prefix: 'init',
    logo_URIs: {
      png: 'https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.png',
      svg: 'https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.svg',
    },
    apis: {
      rpc: [{ address: 'http://localhost:26657' }],
      rest: [{ address: 'http://localhost:1317' }],
      indexer: [{ address: 'http://localhost:8080' }],
      'json-rpc': [{ address: 'http://localhost:8545' }],
    },
    fees: {
      fee_tokens: [
        {
          denom: import.meta.env.VITE_NATIVE_DENOM,
          fixed_min_gas_price: 0,
          low_gas_price: 0,
          average_gas_price: 0,
          high_gas_price: 0,
        },
      ],
    },
    staking: {
      staking_tokens: [{ denom: import.meta.env.VITE_NATIVE_DENOM }],
    },
    metadata: {
      minitia: { type: 'minievm' },
      is_l1: false,
    },
    native_assets: [
      {
        denom: import.meta.env.VITE_NATIVE_DENOM,
        name: 'Native Token',
        symbol: import.meta.env.VITE_NATIVE_SYMBOL,
        decimals: Number(import.meta.env.VITE_NATIVE_DECIMALS ?? 18),
      },
    ],
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <InterwovenKitProvider
            {...TESTNET}
            defaultChainId={customChain.chain_id}
            customChain={customChain}
            customChains={[customChain]}
          >
            <App />
          </InterwovenKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>,
  )
  ```

  **7. Create the `App.jsx` Layout:**

  ```javascript wrap src/App.jsx theme={null}
  import React from 'react'
  import { useInterwovenKit } from '@initia/interwovenkit-react'
  import Bank from './Bank'

  function App() {
    const { initiaAddress, openConnect, openWallet } = useInterwovenKit()

    const containerStyle = {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f1f5f9',
      padding: '20px',
    }

    const cardStyle = {
      backgroundColor: '#ffffff',
      borderRadius: '16px',
      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)',
      padding: '40px',
      width: '100%',
      maxWidth: '500px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      textAlign: 'center',
    }

    const buttonStyle = {
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '16px',
      fontWeight: '600',
      cursor: 'pointer',
      width: '100%',
    }

    const secondaryButtonStyle = {
      backgroundColor: '#f1f5f9',
      border: '1px solid #e2e8f0',
      color: '#64748b',
      padding: '12px 24px',
      borderRadius: '10px',
      fontSize: '14px',
      fontWeight: '600',
      cursor: 'pointer',
      marginTop: '20px',
      width: '100%',
    }

    return (
      <div style={containerStyle}>
        <div style={cardStyle}>
          <h1
            style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px' }}
          >
            MiniBank
          </h1>

          {!initiaAddress ? (
            <>
              <p style={{ color: '#64748b', marginBottom: '32px' }}>
                Connect your wallet to manage your savings.
              </p>
              <button onClick={openConnect} style={buttonStyle}>
                Connect Wallet
              </button>
            </>
          ) : (
            <>
              <Bank />
              <button onClick={openWallet} style={secondaryButtonStyle}>
                Open Wallet
              </button>
            </>
          )}
        </div>
      </div>
    )
  }

  export default App
  ```

  **8. Create the `Bank.jsx` Component:** Create `src/Bank.jsx` and add the
  contract interaction logic.

  <Note>
    **`msg.sender` in `view` Calls:** For `view` functions that depend on `msg.sender` (like
    `myBalance`), provide a `from` address in your `eth_call` params so the
    appchain resolves the correct user balance. This tutorial assumes 18
    decimals, so `parseEther`/`formatEther` are used.
  </Note>

  ```javascript wrap src/Bank.jsx theme={null}
  import React, { useState, useEffect } from 'react'
  import { useInterwovenKit } from '@initia/interwovenkit-react'
  import { encodeFunctionData, parseEther, formatEther } from 'viem'
  import { AccAddress } from '@initia/initia.js'

  const MINI_BANK_ADDRESS = import.meta.env.VITE_MINIBANK_CONTRACT
  const CHAIN_ID = import.meta.env.VITE_APPCHAIN_ID
  const NATIVE_DENOM = import.meta.env.VITE_NATIVE_DENOM
  const NATIVE_SYMBOL = import.meta.env.VITE_NATIVE_SYMBOL
  const JSON_RPC_URL = import.meta.env.VITE_JSON_RPC_URL ?? 'http://localhost:8545'
  const MINI_BANK_ABI = [
    { name: 'deposit', type: 'function', stateMutability: 'payable', inputs: [] },
    {
      name: 'withdraw',
      type: 'function',
      inputs: [{ name: 'amount', type: 'uint256' }],
    },
    {
      name: 'myBalance',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ type: 'uint256' }],
    },
    {
      name: 'totalSavingsOf',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'user', type: 'address' }],
      outputs: [{ type: 'uint256' }],
    },
  ]

  const Bank = () => {
    const [amount, setAmount] = useState('')
    const [balance, setBalance] = useState('0')
    const [isPending, setIsPending] = useState(false)
    const { initiaAddress, requestTxBlock } = useInterwovenKit()

    const fetchBalance = async () => {
      if (!initiaAddress) return
      try {
        const hex = AccAddress.toHex(initiaAddress)
        const userHex = hex.startsWith('0x') ? hex : `0x${hex}`
        const data = encodeFunctionData({
          abi: MINI_BANK_ABI,
          functionName: 'myBalance',
        })
        const response = await fetch(JSON_RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{ from: userHex, to: MINI_BANK_ADDRESS, data }, 'latest'],
            id: 1,
          }),
        })
        const result = await response.json()
        if (result.result && result.result !== '0x') {
          setBalance(formatEther(BigInt(result.result)))
        }
      } catch (error) {
        console.error('Error fetching balance:', error)
      }
    }

    useEffect(() => {
      fetchBalance()
      const interval = setInterval(fetchBalance, 10000)
      return () => clearInterval(interval)
    }, [initiaAddress])

    const handleDeposit = async () => {
      if (!amount || !initiaAddress) return
      const data = encodeFunctionData({
        abi: MINI_BANK_ABI,
        functionName: 'deposit',
      })
      setIsPending(true)
      try {
        await requestTxBlock({
          chainId: CHAIN_ID,
          messages: [
            {
              typeUrl: '/minievm.evm.v1.MsgCall',
              value: {
                sender: initiaAddress.toLowerCase(),
                contractAddr: MINI_BANK_ADDRESS,
                input: data,
                value: parseEther(amount).toString(),
                accessList: [],
                authList: [],
              },
            },
          ],
        })
        alert('Deposit successful!')
        setAmount('')
        fetchBalance()
      } catch (error) {
        console.error('Deposit error:', error)
        alert('Transaction failed or was cancelled.')
      } finally {
        setIsPending(false)
      }
    }

    const handleWithdraw = async () => {
      if (!amount || !initiaAddress) return
      const data = encodeFunctionData({
        abi: MINI_BANK_ABI,
        functionName: 'withdraw',
        args: [parseEther(amount)],
      })
      setIsPending(true)
      try {
        await requestTxBlock({
          chainId: CHAIN_ID,
          messages: [
            {
              typeUrl: '/minievm.evm.v1.MsgCall',
              value: {
                sender: initiaAddress.toLowerCase(),
                contractAddr: MINI_BANK_ADDRESS,
                input: data,
                value: '0',
                accessList: [],
                authList: [],
              },
            },
          ],
        })
        alert('Withdrawal successful!')
        setAmount('')
        fetchBalance()
      } catch (error) {
        console.error('Withdraw error:', error)
        alert('Transaction failed or was cancelled.')
      } finally {
        setIsPending(false)
      }
    }

    const balanceContainerStyle = {
      backgroundColor: '#f1f5f9',
      padding: '30px',
      borderRadius: '16px',
      marginBottom: '30px',
      border: '1px solid #e2e8f0',
    }
    const balanceValueStyle = {
      fontSize: '42px',
      fontWeight: '800',
      color: '#2563eb',
      margin: '10px 0',
      fontFamily: 'monospace',
    }
    const inputStyle = {
      width: '100%',
      padding: '14px',
      marginBottom: '20px',
      borderRadius: '10px',
      border: '2px solid #e2e8f0',
      fontSize: '16px',
      boxSizing: 'border-box',
    }
    const buttonContainerStyle = { display: 'flex', gap: '15px' }
    const actionButtonStyle = {
      flex: 1,
      padding: '14px',
      borderRadius: '10px',
      border: 'none',
      fontWeight: '700',
      fontSize: '16px',
      cursor: 'pointer',
      color: 'white',
    }

    return (
      <div style={{ width: '100%', marginTop: '20px' }}>
        <div style={balanceContainerStyle}>
          <div
            style={{
              fontSize: '14px',
              color: '#64748b',
              textTransform: 'uppercase',
            }}
          >
            Your Savings Balance
          </div>
          <div style={balanceValueStyle}>{balance} {NATIVE_SYMBOL}</div>
        </div>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          style={inputStyle}
        />
        <div style={buttonContainerStyle}>
          <button
            onClick={handleDeposit}
            style={{
              ...actionButtonStyle,
              backgroundColor: '#10b981',
              opacity: isPending ? 0.5 : 1,
            }}
            disabled={!initiaAddress || isPending}
          >
            {isPending ? 'Pending...' : 'Deposit'}
          </button>
          <button
            onClick={handleWithdraw}
            style={{
              ...actionButtonStyle,
              backgroundColor: '#ef4444',
              opacity: isPending ? 0.5 : 1,
            }}
            disabled={!initiaAddress || isPending}
          >
            {isPending ? 'Pending...' : 'Withdraw'}
          </button>
        </div>
      </div>
    )
  }

  export default Bank
  ```
</Accordion>

## Step 5: Wallet Funding and UI Verification

Ask your AI agent to fund your browser wallet, then verify frontend behavior
manually in the browser:

1. Start the frontend:

```bash wrap Start Vite Dev Server theme={null}
cd minibank-frontend
npm run dev
```

Check the **browser console** if you encounter issues.

2. Open your browser wallet and copy your address (`init1...`).
3. Give this prompt to your AI agent, replacing `<YOUR_WALLET_ADDRESS>` with the address you just copied:

```terminal wrap theme={null}
Using the `initia-appchain-dev` skill, please fund my wallet address <YOUR_WALLET_ADDRESS> with 100 of my appchain's native tokens on L2.
```

4. Connect your wallet in `minibank-frontend`.
5. Test the full flow by depositing and withdrawing from the UI, then confirm
   the displayed savings state updates correctly after each action.

If you get stuck, see the [Debugging Workflow guide](../builder-guide#debugging-workflow).

# 🪢 Native Feature: Interwoven Bridge

Adding bridge support allows users to bring liquidity from the broader Initia
ecosystem into your rollup. This transforms your appchain from an isolated
sandbox into a connected part of the Interwoven Stack, providing users with a
seamless UI to bridge tokens into your application for use.

<Tip>
  **Local Dev Limitation:** The Interwoven UI only resolves registered chain IDs,
  so your local appchain and token may not appear during local testing. You can
  still add bridge functionality now. In your hackathon submission, explain the
  user flow (for example: bridge INIT or other assets from L1 to your appchain,
  then deposit them in MiniBank) and why this matters (faster onboarding,
  easier liquidity access, and immediate utility in your app).
</Tip>

## Step 6: Update the Frontend

The `useInterwovenKit()` hook provides `openBridge`, which opens the bridge
modal for moving assets between chains.

```terminal title="Prompt: Add Interwoven Bridge support" wrap theme={null}
Using the `initia-appchain-dev` skill, please enable Interwoven Bridge support in my MiniBank so I can move funds between chains on Initia.
```

<Accordion title="Manual Approach: Bridge Integration">
  To implement this, update your `src/Bank.jsx` to include the bridge logic and
  UI:

  ```tsx wrap Bridge Logic theme={null}
  // 1. Extract bridge functions from the hook
  const { initiaAddress, openConnect, openBridge } = useInterwovenKit()

  // 2. Add bridge handler
  const handleBridge = () => {
    if (!initiaAddress) {
      openConnect()
      return
    }
    openBridge({
      srcChainId: 'initiation-2', // Public testnet ID
      srcDenom: 'uinit', // Native INIT
    })
  }

  // 3. Add the Bridge UI section to your render (conditionally)
  const bridgeContainerStyle = {
    marginTop: '2rem',
    padding: '1.5rem',
    backgroundColor: '#fffbeb',
    borderRadius: '24px',
    border: '1px solid #fef3c7',
    textAlign: 'left',
  }

  const bridgeButtonStyle = {
    width: '100%',
    padding: '0.85rem',
    backgroundColor: '#d97706',
    color: 'white',
    border: 'none',
    borderRadius: '14px',
    fontSize: '13px',
    fontWeight: '800',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
  }

  // Inside return (showing it only when connected)...
  {
    initiaAddress && (
      <div style={bridgeContainerStyle}>
        <div
          style={{
            fontWeight: '700',
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: '#92400e',
            marginBottom: '4px',
          }}
        >
          Interwoven Ecosystem
        </div>
        <p style={{ fontSize: '13px', color: '#b45309', margin: '0 0 12px 0' }}>
          Access the broader Initia network to move assets between chains.
        </p>
        <button onClick={handleBridge} style={bridgeButtonStyle}>
          Bridge Assets
        </button>
      </div>
    )
  }
  ```
</Accordion>

If you want a complete end-state after the manual steps above, use the
consolidated reference below.

<Accordion title="Manual Approach: Final Frontend Reference">
  This reference combines:

  * runtime config from `.env`,
  * InterwovenKit provider wiring in `main.jsx`,
  * wallet connect/display in `App.jsx`, and
  * live MiniBank interactions plus bridge entry point in `Bank.jsx`.

  **.env**

  ```bash wrap .env theme={null}
  VITE_APPCHAIN_ID=<YOUR_APPCHAIN_ID>
  VITE_NATIVE_DENOM=<YOUR_NATIVE_DENOM>
  VITE_NATIVE_SYMBOL=<YOUR_NATIVE_SYMBOL>
  VITE_NATIVE_DECIMALS=18
  VITE_JSON_RPC_URL=http://localhost:8545
  VITE_MINIBANK_CONTRACT=<YOUR_CONTRACT_ADDRESS>
  VITE_BRIDGE_SRC_CHAIN_ID=initiation-2
  VITE_BRIDGE_SRC_DENOM=uinit
  ```

  **src/main.jsx**

  ```jsx wrap src/main.jsx theme={null}
  import { Buffer } from 'buffer'
  window.Buffer = Buffer
  window.process = { env: { NODE_ENV: 'development' } }

  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import "@initia/interwovenkit-react/styles.css";
  import { injectStyles, InterwovenKitProvider, TESTNET } from "@initia/interwovenkit-react";
  import InterwovenKitStyles from "@initia/interwovenkit-react/styles.js";
  import { WagmiProvider, createConfig, http } from "wagmi";
  import { mainnet } from "wagmi/chains";
  import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
  import App from './App.jsx'

  injectStyles(InterwovenKitStyles);

  const queryClient = new QueryClient();
  const wagmiConfig = createConfig({
    chains: [mainnet],
    transports: { [mainnet.id]: http() },
  });

  const customChain = {
    chain_id: import.meta.env.VITE_APPCHAIN_ID,
    chain_name: 'minibank',
    pretty_name: 'MiniBank Appchain',
    network_type: 'testnet',
    bech32_prefix: 'init',
    logo_URIs: {
      png: 'https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.png',
      svg: 'https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.svg',
    },
    apis: {
      rpc: [{ address: 'http://localhost:26657' }],
      rest: [{ address: 'http://localhost:1317' }],
      indexer: [{ address: 'http://localhost:8080' }],
      'json-rpc': [{ address: import.meta.env.VITE_JSON_RPC_URL ?? 'http://localhost:8545' }],
    },
    fees: {
      fee_tokens: [{
        denom: import.meta.env.VITE_NATIVE_DENOM,
        fixed_min_gas_price: 0,
        low_gas_price: 0,
        average_gas_price: 0,
        high_gas_price: 0,
      }],
    },
    staking: {
      staking_tokens: [{ denom: import.meta.env.VITE_NATIVE_DENOM }]
    },
    metadata: {
      is_l1: false,
      minitia: {
        type: 'minievm',
      },
    },
    native_assets: [
      {
        denom: import.meta.env.VITE_NATIVE_DENOM,
        name: 'Native Token',
        symbol: import.meta.env.VITE_NATIVE_SYMBOL,
        decimals: Number(import.meta.env.VITE_NATIVE_DECIMALS ?? 18)
      }
    ]
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <InterwovenKitProvider
            {...TESTNET}
            defaultChainId={customChain.chain_id}
            customChain={customChain}
            customChains={[customChain]}
          >
            <App />
          </InterwovenKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>,
  )
  ```

  **src/App.jsx**

  ```jsx wrap src/App.jsx theme={null}
  import React from 'react'
  import { useInterwovenKit } from "@initia/interwovenkit-react";
  import Bank from './Bank.jsx';

  function App() {
    const { initiaAddress, openConnect, openWallet } = useInterwovenKit();

    const shortenAddress = (addr) => {
      if (!addr) return "";
      return `${addr.slice(0, 8)}...${addr.slice(-4)}`;
    };

    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <header style={{
          width: '100%',
          maxWidth: '1200px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '2rem'
        }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>MiniBank</h1>

          {!initiaAddress ? (
            <button onClick={openConnect}>Connect Wallet</button>
          ) : (
            <button onClick={openWallet}>{shortenAddress(initiaAddress)}</button>
          )}
        </header>

        <main style={{ flex: 1, width: '100%', maxWidth: '760px', padding: '2rem' }}>
          <Bank />
        </main>
      </div>
    )
  }

  export default App
  ```

  **src/Bank.jsx**

  ```jsx wrap src/Bank.jsx theme={null}
  import React, { useEffect, useState } from 'react'
  import { useInterwovenKit } from '@initia/interwovenkit-react'
  import { AccAddress } from '@initia/initia.js'
  import { encodeFunctionData, formatUnits, parseUnits } from 'viem'

  const CHAIN_ID = import.meta.env.VITE_APPCHAIN_ID
  const NATIVE_DENOM = import.meta.env.VITE_NATIVE_DENOM
  const NATIVE_SYMBOL = import.meta.env.VITE_NATIVE_SYMBOL
  const NATIVE_DECIMALS = Number(import.meta.env.VITE_NATIVE_DECIMALS ?? 18)
  const JSON_RPC_URL = import.meta.env.VITE_JSON_RPC_URL ?? 'http://localhost:8545'
  const MINI_BANK_ADDRESS = import.meta.env.VITE_MINIBANK_CONTRACT
  const BRIDGE_SRC_CHAIN_ID = import.meta.env.VITE_BRIDGE_SRC_CHAIN_ID ?? 'initiation-2'
  const BRIDGE_SRC_DENOM = import.meta.env.VITE_BRIDGE_SRC_DENOM ?? 'uinit'

  const MINI_BANK_ABI = [
    { name: 'deposit', type: 'function', stateMutability: 'payable', inputs: [] },
    {
      name: 'withdraw',
      type: 'function',
      stateMutability: 'nonpayable',
      inputs: [{ name: 'amount', type: 'uint256' }],
    },
    {
      name: 'myBalance',
      type: 'function',
      stateMutability: 'view',
      inputs: [],
      outputs: [{ type: 'uint256' }],
    },
  ]

  export default function Bank() {
    const { initiaAddress, openConnect, openBridge, requestTxBlock } = useInterwovenKit()
    const [amount, setAmount] = useState('')
    const [balance, setBalance] = useState('0')
    const [isPending, setIsPending] = useState(false)
    const [status, setStatus] = useState('')

    const fetchBalance = async () => {
      if (!initiaAddress) {
        setBalance('0')
        return
      }

      const data = encodeFunctionData({ abi: MINI_BANK_ABI, functionName: 'myBalance' })
      const from = AccAddress.toHex(initiaAddress).toLowerCase()

      const response = await fetch(JSON_RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{ from, to: MINI_BANK_ADDRESS, data }, 'latest'],
          id: 1,
        }),
      })

      const result = await response.json()
      if (result.error) throw new Error(result.error.message || 'eth_call failed')
      const baseUnits = BigInt(result.result || '0x0')
      setBalance(formatUnits(baseUnits, NATIVE_DECIMALS))
    }

    useEffect(() => {
      fetchBalance().catch((err) => setStatus(String(err.message || err)))
    }, [initiaAddress])

    const handleDeposit = async () => {
      if (!initiaAddress || !amount || Number(amount) <= 0) return
      setIsPending(true)
      setStatus('Submitting deposit...')
      try {
        const input = encodeFunctionData({ abi: MINI_BANK_ABI, functionName: 'deposit' })
        const value = parseUnits(amount, NATIVE_DECIMALS).toString()
        const tx = await requestTxBlock({
          chainId: CHAIN_ID,
          messages: [{
            typeUrl: '/minievm.evm.v1.MsgCall',
            value: {
              sender: initiaAddress.toLowerCase(),
              contractAddr: MINI_BANK_ADDRESS,
              input,
              value,
              accessList: [],
              authList: [],
            },
          }],
        })
        setStatus(`Deposit confirmed: ${tx?.txhash ?? 'submitted'}`)
        setAmount('')
        await fetchBalance()
      } catch (err) {
        setStatus(`Deposit failed: ${String(err.message || err)}`)
      } finally {
        setIsPending(false)
      }
    }

    const handleWithdraw = async () => {
      if (!initiaAddress || !amount || Number(amount) <= 0) return
      setIsPending(true)
      setStatus('Submitting withdrawal...')
      try {
        const input = encodeFunctionData({
          abi: MINI_BANK_ABI,
          functionName: 'withdraw',
          args: [parseUnits(amount, NATIVE_DECIMALS)],
        })
        const tx = await requestTxBlock({
          chainId: CHAIN_ID,
          messages: [{
            typeUrl: '/minievm.evm.v1.MsgCall',
            value: {
              sender: initiaAddress.toLowerCase(),
              contractAddr: MINI_BANK_ADDRESS,
              input,
              value: '0',
              accessList: [],
              authList: [],
            },
          }],
        })
        setStatus(`Withdraw confirmed: ${tx?.txhash ?? 'submitted'}`)
        setAmount('')
        await fetchBalance()
      } catch (err) {
        setStatus(`Withdraw failed: ${String(err.message || err)}`)
      } finally {
        setIsPending(false)
      }
    }

    const handleBridge = async () => {
      if (!initiaAddress) {
        openConnect()
        return
      }
      await openBridge({
        srcChainId: BRIDGE_SRC_CHAIN_ID,
        srcDenom: BRIDGE_SRC_DENOM,
      })
    }

    return (
      <section>
        <p>My Savings: {balance} {NATIVE_SYMBOL}</p>
        <input
          type="number"
          min="0"
          step="any"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Enter amount"
        />
        <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
          <button onClick={handleDeposit} disabled={!initiaAddress || isPending}>Deposit</button>
          <button onClick={handleWithdraw} disabled={!initiaAddress || isPending}>Withdraw</button>
          <button onClick={handleBridge} disabled={isPending}>Bridge Funds</button>
        </div>
        {status ? <p>{status}</p> : null}
      </section>
    )
  }
  ```

  This reference assumes:

  * the deployed contract address is stored in `.env` as `VITE_MINIBANK_CONTRACT`,
  * `sender` in `MsgCall` uses bech32 (`initiaAddress`) lowercased,
  * EVM balance reads use JSON-RPC `eth_call` with a `from` hex address, and
  * the Vite dev server is restarted after any `.env` change.
</Accordion>

### Native Feature Verification

1. Connect your wallet in `minibank-frontend`.
2. Click `Bridge Funds`.
3. Confirm the Interwoven Bridge modal opens.

## Next Steps

Now that you've mastered an EVM application, you're ready to build your own
idea! Ensure your project meets all the
[Submission Requirements](../submission-requirements) before submitting.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# MemoBoard - Wasm

This tutorial will guide you through building an on-chain
guestbook called MemoBoard. Users can post public messages, and the
application prioritizes human-readable identity by resolving `.init` usernames.

By the end of this tutorial, you will have:

* Generated and verified a Rust smart contract for the guestbook.
* Deployed the contract to your live appchain.
* Scaffolded and connected a React frontend.
* Verified the on-chain functionality.

## Your Project Structure

The following steps will instruct your AI agent to create these directories
inside your `my-initia-project` folder:

```text wrap Project Structure theme={null}
my-initia-project/
├── memoboard/           # Rust smart contract project
└── memoboard-frontend/  # React frontend application
```

<Note>
  **Prerequisite:** Ensure you have a Wasm-compatible appchain running
  locally. If you haven't launched one yet, complete the
  [Set Up Your Appchain](../get-started) first.
</Note>

### Readiness Check

Before you start, verify that your local infrastructure is healthy.

```terminal title="Prompt: Check local infrastructure health" wrap theme={null}
Using the `initia-appchain-dev` skill, please verify that my appchain, executor bot, and relayer are running and that my Gas Station account has a balance.
```

## Step 1: Create and Unit Test the Smart Contract

Instruct your AI agent to create the Rust (Wasm) contract using the
`initia-appchain-dev` skill. Your AI agent will generate the contract and
automatically run unit tests to ensure the logic is sound.

```terminal title="Prompt: Create and test the MemoBoard contract" wrap theme={null}
Using the `initia-appchain-dev` skill, please create a Rust smart contract project for our MemoBoard in a new directory named `memoboard`. The contract should:
- Allow users to post a message (string).
- Store a list of all messages with the sender's address.
- Include a function to query all messages on the board.
Please also create and run unit tests to verify these features.
```

Your AI agent will generate the `memoboard` project and confirm that the Rust
tests pass.

<Accordion title="Manual Approach: The Rust Contract">
  If you prefer to see the Rust logic, here is a simplified but schema-accurate version of what your AI agent would generate. If doing this manually, save the following code in `src/contract.rs` inside your `memoboard` directory (ensure `src/lib.rs` exports the `contract` module).

  First create and enter the project directory:

  ```bash wrap theme={null}
  cargo new --lib --edition 2021 memoboard
  cd memoboard
  ```

  **Important:** Ensure your `Cargo.toml` includes the following `[lib]` section
  to correctly generate the Wasm binary:

  ```toml wrap Cargo.toml theme={null}
  [lib]
  crate-type = ["cdylib", "rlib"]
  ```

  Also ensure `Cargo.toml` includes these dependencies and features required by
  the example contract:

  ```toml wrap Cargo.toml theme={null}
  [features]
  library = []

  [dependencies]
  cosmwasm-schema = "2.0.4"
  cosmwasm-std = "2.0.4"
  cw-storage-plus = "2.0.0"
  thiserror = "1.0.31"
  ```

  ```rust wrap src/contract.rs theme={null}
  use cosmwasm_schema::{cw_serde, QueryResponses};
  use cosmwasm_std::{entry_point, to_json_binary, Binary, Deps, DepsMut, Env, MessageInfo, Response, StdResult, StdError};
  use cw_storage_plus::Item;
  use thiserror::Error;

  #[derive(Error, Debug)]
  pub enum ContractError {
      #[error("{0}")]
      Std(#[from] StdError),
  }

  #[cw_serde]
  pub struct Memo {
      pub sender: String,
      pub message: String,
  }

  pub const MESSAGES: Item<Vec<Memo>> = Item::new("messages");

  #[cw_serde]
  pub struct InstantiateMsg {}

  #[cw_serde]
  pub enum ExecuteMsg {
      PostMessage { message: String },
  }

  #[cw_serde]
  pub struct MessagesResponse {
      pub messages: Vec<Memo>,
  }

  #[cw_serde]
  #[derive(QueryResponses)]
  pub enum QueryMsg {
      #[returns(MessagesResponse)]
      GetMessages {},
  }

  #[cfg_attr(not(feature = "library"), entry_point)]
  pub fn instantiate(deps: DepsMut, _env: Env, _info: MessageInfo, _msg: InstantiateMsg) -> Result<Response, ContractError> {
      MESSAGES.save(deps.storage, &vec![])?;
      Ok(Response::new().add_attribute("action", "instantiate"))
  }

  #[cfg_attr(not(feature = "library"), entry_point)]
  pub fn execute(deps: DepsMut, _env: Env, info: MessageInfo, msg: ExecuteMsg) -> Result<Response, ContractError> {
      match msg {
          ExecuteMsg::PostMessage { message } => {
              let mut messages = MESSAGES.load(deps.storage)?;
              messages.push(Memo {
                  sender: info.sender.to_string(),
                  message: message.clone(),
              });
              MESSAGES.save(deps.storage, &messages)?;
              Ok(Response::new()
                  .add_attribute("action", "post_message")
                  .add_attribute("sender", info.sender)
                  .add_attribute("message", message))
          }
      }
  }

  #[cfg_attr(not(feature = "library"), entry_point)]
  pub fn query(deps: Deps, _env: Env, msg: QueryMsg) -> StdResult<Binary> {
      match msg {
          QueryMsg::GetMessages {} => {
              let messages = MESSAGES.load(deps.storage)?;
              to_json_binary(&MessagesResponse { messages })
          }
      }
  }

  #[cfg(test)]
  mod tests {
      use super::*;
      use cosmwasm_std::testing::{message_info, mock_dependencies, mock_env};
      use cosmwasm_std::Addr;
      use cosmwasm_std::from_json;

      #[test]
      fn test_post_and_query() {
          let mut deps = mock_dependencies();
          let env = mock_env();

          // Instantiate
          let info = message_info(&Addr::unchecked("creator"), &[]);
          instantiate(deps.as_mut(), env.clone(), info, InstantiateMsg {}).unwrap();

          // Post Message
          let info = message_info(&Addr::unchecked("user1"), &[]);
          let msg = ExecuteMsg::PostMessage { message: "Hello!".to_string() };
          execute(deps.as_mut(), env.clone(), info, msg).unwrap();

          // Query
          let res = query(deps.as_ref(), env, QueryMsg::GetMessages {}).unwrap();
          let val: MessagesResponse = from_json(&res).unwrap();
          assert_eq!(val.messages.len(), 1);
          assert_eq!(val.messages[0].message, "Hello!");
          assert_eq!(val.messages[0].sender, "user1");
      }
  }
  ```
</Accordion>

## Step 2: Deploy to Your Appchain

Now that the logic is verified, build and publish the contract to your appchain
using the Gas Station account.

```terminal title="Prompt: Deploy the MemoBoard contract" wrap theme={null}
Using the `initia-appchain-dev` skill, please build, publish, and instantiate the MemoBoard Rust contract located in the `memoboard` directory to my appchain using my Gas Station account, then return the deployed contract address.
```

<Accordion title="Manual Approach: Deploy via CLI">
  **1. Build and Store the Code:**

  Standard `cargo build` binaries often fail validation on-chain. For WasmVM
  deployment, it is strongly recommended to use the CosmWasm Optimizer.

  **Note for Apple Silicon (M1/M2/M3):** Use
  `cosmwasm/optimizer-arm64:0.17.0`.

  ```bash wrap Optimizer Build Command theme={null}
  # Run from the root of your project
  # Use 'optimizer' for x86_64 or 'optimizer-arm64' for Apple Silicon
  OPTIMIZER_IMAGE="cosmwasm/optimizer-arm64:0.17.0"

  docker run --rm -v "$(pwd)/memoboard":/code \
    --mount type=volume,source="$(basename "$(pwd)")_cache",target=/code/target \
    --mount type=volume,source=registry_cache,target=/usr/local/cargo/registry \
    $OPTIMIZER_IMAGE
  ```

  The optimized binary will be located in `./memoboard/artifacts/memoboard.wasm`.
  Now, store the code:

  ```bash wrap Store Wasm Code theme={null}
  # If the chain requires fees, add the --fees flag (e.g., --fees 1000000umin)
  minitiad tx wasm store ./memoboard/artifacts/memoboard.wasm \
    --from gas-station \
    --keyring-backend test \
    --chain-id <YOUR_APPCHAIN_ID> \
    --gas auto --gas-adjustment 1.4 --yes
  ```

  **2. Retrieve the Code ID and Instantiate:**

  If the `code_id` is not returned directly, wait for 5 seconds for indexing and
  then query the transaction hash:

  ```bash wrap Get Code ID theme={null}
  # Retrieve Code ID
  minitiad q tx <YOUR_TX_HASH> --output json | jq -r '.events[] | select(.type=="store_code") | .attributes[] | select(.key=="code_id") | .value'
  ```

  Then, instantiate the contract:

  ```bash wrap Instantiate Contract theme={null}
  minitiad tx wasm instantiate <YOUR_CODE_ID> '{}' \
    --label "memoboard" \
    --from gas-station \
    --keyring-backend test \
    --chain-id <YOUR_APPCHAIN_ID> \
    --gas auto --gas-adjustment 1.4 \
    --no-admin --yes
  ```

  **3. Retrieve the Contract Address:**

  Wait for 5 seconds for indexing and then query the transaction hash:

  ```bash wrap Get Contract Address theme={null}
  # Retrieve Contract Address
  minitiad q tx <YOUR_TX_HASH> --output json | jq -r '.events[] | select(.type=="instantiate") | .attributes[] | select(.key=="_contract_address") | .value'
  ```
</Accordion>

## Step 3: Smoke Test the Deployed Contract On-Chain

Before frontend integration, smoke test your deployed contract directly on
chain.

```terminal title="Prompt: Smoke test the MemoBoard contract" wrap theme={null}
Using the `initia-appchain-dev` skill, I want to smoke test our live MemoBoard contract. Using my Gas Station account on my appchain, please:
1. Post a message: "Hello from Initia!"
2. Query the board to see all messages.
```

<Accordion title="Manual Approach: On-Chain Interaction">
  Submit one message transaction, then query contract state to confirm it was
  persisted on chain.

  ```bash wrap Post Message theme={null}
  # If the chain requires fees, add the --fees flag (e.g., --fees 1000000umin)
  minitiad tx wasm execute <YOUR_CONTRACT_ADDRESS> '{"post_message":{"message":"Hello!"}}' \
    --from gas-station \
    --keyring-backend test \
    --chain-id <YOUR_APPCHAIN_ID> \
    --gas auto --gas-adjustment 1.4 --yes
  ```

  ```bash wrap Query Messages theme={null}
  sleep 5
  minitiad query wasm contract-state smart <YOUR_CONTRACT_ADDRESS> '{"get_messages":{}}'
  ```
</Accordion>

## Step 4: Create a Frontend

Let's create a UI to display and post messages.

**1. Scaffold the Frontend:**

```terminal title="Prompt: Scaffold the MemoBoard frontend" wrap theme={null}
Using the `initia-appchain-dev` skill, please scaffold a new Vite + React application named `memoboard-frontend` in my current directory using the `scaffold-frontend` script. Create a component named Board.jsx that displays a list of messages and a text input to post a new one.
```

**2. Connect to Appchain:**

```terminal title="Prompt: Connect the frontend to the MemoBoard contract" wrap theme={null}
Using the `initia-appchain-dev` skill, modify the Board.jsx component in the `memoboard-frontend` directory to connect to our MemoBoard contract on my appchain. Use the `@initia/interwovenkit-react` package for wallet connection and transaction signing.
```

<Accordion title="Manual Approach: Scaffold and Connect">
  If you prefer to set up the frontend manually, follow these steps:

  **1. Create the Project and Install Dependencies:**

  ```bash wrap theme={null}
  npm create vite@latest memoboard-frontend -- --template react
  cd memoboard-frontend
  npm install
  npm install @initia/interwovenkit-react wagmi viem @tanstack/react-query @initia/initia.js
  npm install --save-dev vite-plugin-node-polyfills
  npm install buffer util
  ```

  **2. Configure Vite Polyfills:** Update `vite.config.js` to include the Node
  polyfills:

  ```javascript wrap vite.config.js theme={null}
  import { defineConfig } from 'vite'
  import react from '@vitejs/plugin-react'
  import { nodePolyfills } from 'vite-plugin-node-polyfills'

  export default defineConfig({
    plugins: [
      react(),
      nodePolyfills({
        globals: {
          Buffer: true,
          process: true,
        },
      }),
    ],
  })
  ```

  Create the frontend files in this order so the imports line up cleanly:

  1. `vite.config.js`
  2. `.env`
  3. `src/main.jsx`
  4. `src/Board.css`
  5. `src/Board.jsx`
  6. `src/App.jsx`

  **3. Gather Runtime Values for Frontend Config:** Right before creating `.env`,
  collect the values you will use:

  ```bash wrap Gather Frontend Values theme={null}
  APPCHAIN_ID=$(curl -s http://localhost:26657/status | jq -r '.result.node_info.network')
  NATIVE_DENOM=$(minitiad q bank denoms-metadata --output json | jq -r '.metadatas[0].base // empty')
  [ -z "$NATIVE_DENOM" ] && NATIVE_DENOM=$(minitiad q bank total --output json | jq -r '.supply[0].denom')
  NATIVE_SYMBOL=$(minitiad q bank denoms-metadata --output json | jq -r '.metadatas[0].symbol // empty')
  [ -z "$NATIVE_SYMBOL" ] && NATIVE_SYMBOL="$NATIVE_DENOM"

  # Use the contract address you retrieved in Step 2.
  MEMOBOARD_CONTRACT_ADDRESS=<YOUR_CONTRACT_ADDRESS>

  echo "APPCHAIN_ID=$APPCHAIN_ID"
  echo "NATIVE_DENOM=$NATIVE_DENOM"
  echo "NATIVE_SYMBOL=$NATIVE_SYMBOL"
  echo "MEMOBOARD_CONTRACT_ADDRESS=$MEMOBOARD_CONTRACT_ADDRESS"
  ```

  **4. Add Runtime Configuration:** Create a `.env` file in `memoboard-frontend`
  so the chain metadata, endpoints, and live contract address are explicit:

  ```bash wrap .env theme={null}
  VITE_APPCHAIN_ID=$APPCHAIN_ID
  VITE_CHAIN_NAME=social
  VITE_CHAIN_PRETTY_NAME=Social 1
  VITE_INITIA_RPC_URL=http://localhost:26657
  VITE_INITIA_REST_URL=http://localhost:1317
  VITE_INITIA_INDEXER_URL=http://localhost:8080
  VITE_INITIA_JSON_RPC_URL=http://localhost:8545
  VITE_NATIVE_DENOM=$NATIVE_DENOM
  VITE_NATIVE_SYMBOL=$NATIVE_SYMBOL
  VITE_NATIVE_DECIMALS=6
  VITE_MEMOBOARD_CONTRACT_ADDRESS=$MEMOBOARD_CONTRACT_ADDRESS
  ```

  **5. Set up Providers in `main.jsx`:**

  ```javascript wrap src/main.jsx theme={null}
  import { Buffer } from 'buffer'
  window.Buffer = Buffer
  window.process = { env: { NODE_ENV: 'development' } }

  import React from 'react'
  import ReactDOM from 'react-dom/client'
  import '@initia/interwovenkit-react/styles.css'
  import {
    injectStyles,
    InterwovenKitProvider,
    TESTNET,
  } from '@initia/interwovenkit-react'
  import InterwovenKitStyles from '@initia/interwovenkit-react/styles.js'
  import { WagmiProvider, createConfig, http } from 'wagmi'
  import { mainnet } from 'wagmi/chains'
  import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
  import App from './App.jsx'

  // Inject styles for the InterwovenKit drawer
  injectStyles(InterwovenKitStyles)

  const queryClient = new QueryClient()
  const wagmiConfig = createConfig({
    chains: [mainnet],
    transports: { [mainnet.id]: http() },
  })

  const customChain = {
    chain_id: import.meta.env.VITE_APPCHAIN_ID,
    chain_name: import.meta.env.VITE_CHAIN_NAME,
    pretty_name: import.meta.env.VITE_CHAIN_PRETTY_NAME,
    network_type: 'testnet',
    bech32_prefix: 'init',
    logo_URIs: {
      png: 'https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.png',
      svg: 'https://raw.githubusercontent.com/initia-labs/initia-registry/main/testnets/initia/images/initia.svg',
    },
    apis: {
      rpc: [{ address: import.meta.env.VITE_INITIA_RPC_URL }],
      rest: [{ address: import.meta.env.VITE_INITIA_REST_URL }],
      indexer: [{ address: import.meta.env.VITE_INITIA_INDEXER_URL }], // Placeholder REQUIRED for stability
      'json-rpc': [{ address: import.meta.env.VITE_INITIA_JSON_RPC_URL }],
    },
    fees: {
      fee_tokens: [
        {
          denom: import.meta.env.VITE_NATIVE_DENOM,
          fixed_min_gas_price: 0,
          low_gas_price: 0,
          average_gas_price: 0,
          high_gas_price: 0,
        },
      ],
    },
    staking: {
      staking_tokens: [{ denom: import.meta.env.VITE_NATIVE_DENOM }],
    },
    metadata: {
      minitia: { type: 'miniwasm' },
      is_l1: false, // REQUIRED for local appchains
    },
    native_assets: [
      {
        denom: import.meta.env.VITE_NATIVE_DENOM,
        name: 'Minitia',
        symbol: import.meta.env.VITE_NATIVE_SYMBOL,
        decimals: Number(import.meta.env.VITE_NATIVE_DECIMALS ?? 6),
      },
    ],
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <InterwovenKitProvider
            {...TESTNET}
            defaultChainId={customChain.chain_id}
            customChain={customChain}
            customChains={[customChain]}
          >
            <App />
          </InterwovenKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </React.StrictMode>,
  )
  ```

  **6. Create the `Board.jsx` Component:** Create `src/Board.jsx` and
  `src/Board.css` with the following content:

  **src/Board.css:**

  ```css wrap src/Board.css theme={null}
  .board-container {
    max-width: 600px;
    margin: 40px auto;
    padding: 32px;
    font-family: sans-serif;
  }
  .board-title {
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 24px;
    text-align: center;
  }
  .section-header {
    font-size: 0.85rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: #888;
    margin-bottom: 16px;
    display: block;
  }
  .auth-section {
    display: flex;
    justify-content: center;
    margin-bottom: 24px;
  }
  .wallet-info {
    background: #f0f0f0;
    padding: 12px 16px;
    border-radius: 12px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  .message-card {
    background: white;
    padding: 16px;
    border-radius: 12px;
    border: 1px solid #eee;
    margin-bottom: 16px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
  }
  .message-sender {
    font-family: monospace;
    font-size: 0.75rem;
    color: #999;
  }
  .message-content {
    margin-top: 8px;
    font-size: 1.1rem;
  }
  .input-group {
    display: flex;
    gap: 12px;
    margin-top: 16px;
  }
  .memo-input {
    flex: 1;
    padding: 12px 16px;
    border-radius: 8px;
    border: 1px solid #ddd;
    outline: none;
  }
  .btn-primary {
    background: #000;
    color: #fff;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }
  ```

  **src/Board.jsx:**

  ```javascript wrap src/Board.jsx theme={null}
  import React, { useState, useEffect } from 'react'
  import { useInterwovenKit } from '@initia/interwovenkit-react'
  import { RESTClient } from '@initia/initia.js'
  import './Board.css'

  const CHAIN_ID = import.meta.env.VITE_APPCHAIN_ID
  const MEMO_BOARD_ADDRESS = import.meta.env.VITE_MEMOBOARD_CONTRACT_ADDRESS
  const rest = new RESTClient(import.meta.env.VITE_INITIA_REST_URL)

  const Board = () => {
    const [messages, setMessages] = useState([])
    const [content, setContent] = useState('')
    const { initiaAddress, requestTxSync } = useInterwovenKit()

    const truncate = (addr) => `${addr.slice(0, 10)}...${addr.slice(-6)}`

    const fetchMessages = async () => {
      try {
        // Wasm queries via REST MUST be base64 encoded
        const queryData = Buffer.from(
          JSON.stringify({ get_messages: {} }),
        ).toString('base64')
        const res = await rest.wasm.smartContractState(
          MEMO_BOARD_ADDRESS,
          queryData,
        )
        setMessages([...(res?.messages ?? [])].reverse())
      } catch (e) {
        console.error('Failed to fetch messages', e)
      }
    }

    useEffect(() => {
      fetchMessages()
      // Poll for new messages every 5 seconds
      const interval = setInterval(fetchMessages, 5000)
      return () => clearInterval(interval)
    }, [])

    const handlePostMessage = async () => {
      if (!content || !initiaAddress || !MEMO_BOARD_ADDRESS) return

      // Encode execute msg to Uint8Array (bytes)
      const msg = new TextEncoder().encode(
        JSON.stringify({ post_message: { message: content } }),
      )

      try {
        // Use requestTxSync for local development transactions
        // ALWAYS include CHAIN_ID to avoid RPC routing errors
        await requestTxSync({
          chainId: CHAIN_ID,
          messages: [
            {
              typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
              value: {
                sender: initiaAddress,
                contract: MEMO_BOARD_ADDRESS,
                msg,
                funds: [],
              },
            },
          ],
        })
        setContent('')
        // Small delay to allow block inclusion
        setTimeout(fetchMessages, 2000)
      } catch (e) {
        console.error('Transaction failed', e)
      }
    }

    return (
      <div className="board-container">
        <h1 className="board-title">MemoBoard</h1>
        {!initiaAddress && (
          <div
            className="message-card"
            style={{ marginBottom: 24, textAlign: 'center', color: '#666' }}
          >
            Connect your wallet from the app header to post a memo.
          </div>
        )}
        {initiaAddress && (
          <div style={{ marginBottom: '32px' }}>
            <h3 className="section-header">Post a Memo</h3>
            <div className="input-group">
              <input
                className="memo-input"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write a memo..."
              />
              <button onClick={handlePostMessage} className="btn-primary">
                Post Message
              </button>
            </div>
          </div>
        )}
        <div className="messages-list">
          <h3 className="section-header">Board Feed</h3>
          {messages.map((m, i) => (
            <div key={i} className="message-card">
              <div className="message-sender">{truncate(m.sender)}</div>
              <div className="message-content">{m.message}</div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  export default Board
  ```

  **7. Create `App.jsx`:** Create the app shell that renders the board and owns the wallet button:

  ```javascript wrap src/App.jsx theme={null}
  import React from 'react'
  import { useInterwovenKit } from '@initia/interwovenkit-react'
  import Board from './Board.jsx'

  function shortenAddress(addr) {
    if (!addr) return ''
    return `${addr.slice(0, 8)}...${addr.slice(-4)}`
  }

  function App() {
    const { initiaAddress, openConnect, openWallet } = useInterwovenKit()

    return (
      <div>
        <header
          style={{
            maxWidth: 600,
            margin: '40px auto 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <p style={{ margin: 0, color: '#666', fontSize: 12, fontWeight: 700 }}>
              Initia Wasm Appchain
            </p>
            <h1 style={{ margin: '8px 0 0' }}>MemoBoard</h1>
          </div>

          {!initiaAddress ? (
            <button onClick={openConnect} className="btn-primary">
              Connect Wallet
            </button>
          ) : (
            <button onClick={openWallet} className="btn-primary">
              {shortenAddress(initiaAddress)}
            </button>
          )}
        </header>

        <Board />
      </div>
    )
  }

  export default App
  ```
</Accordion>

## Step 5: Wallet Funding and UI Verification

Ask your AI agent to fund your browser wallet, then verify frontend behavior
manually in the browser:

1. Start the frontend:

```bash wrap Start Vite Dev Server theme={null}
cd memoboard-frontend
npm run dev
```

Check the **browser console** if you encounter issues.

2. Open your browser wallet and copy your address (`init1...`).
3. Give this prompt to your AI agent, replacing `<YOUR_WALLET_ADDRESS>` with the address you just copied:

```terminal wrap theme={null}
Using the `initia-appchain-dev` skill, please fund my wallet address <YOUR_WALLET_ADDRESS> with 1 INIT on L1 and 100 of my appchain's native tokens on L2.
```

4. Connect your wallet in `memoboard-frontend`.
5. Post a message from the UI.
6. Confirm it appears in the message list after refresh.
7. If your UI supports it, verify sender identity rendering matches expectations.

If you get stuck, see the [Debugging Workflow guide](../builder-guide#debugging-workflow).

# 🪢 Native Feature: Initia Usernames

To make your MemoBoard natively integrated with the Initia stack, you can
replace long, complex addresses with human-readable Initia Usernames (e.g.,
`vitalik.init`).

## Step 6: Register Your .init Name

Before updating your code, you should register a `primary username` for your
wallet on the Initia testnet.

1. Navigate to
   [app.testnet.initia.xyz/usernames](https://app.testnet.initia.xyz/usernames)
   and connect your browser wallet.
2. In the `Find a username` search box, enter your desired name. If it is
   available, you will see a green `Available` checkmark.
3. Crucial: Ensure the `Set as primary name` checkbox is selected.
4. Click `Register` and approve the transaction. Once resolved, your new
   `.init` name will appear in the top-right corner of the Initia App.

## Step 7: Update the Frontend

Your AI agent knows how to integrate Initia Usernames. Simply ask it to
update your board.

```terminal title="Prompt: Add Initia username support" wrap theme={null}
Using the `initia-appchain-dev` skill, please add Initia username support to my MemoBoard.
```

<Accordion title="Manual Approach: Username Resolution">
  The `useInterwovenKit()` hook provides the `username` for the currently connected wallet, and `useUsernameQuery(address)` resolves usernames for other sender addresses. This requires `@initia/interwovenkit-react` `2.4.6` or newer. To implement this, update your wallet button component (for example `src/App.jsx`) and your board message list like this:

  ```tsx wrap theme={null}
  import { useInterwovenKit, useUsernameQuery } from '@initia/interwovenkit-react'

  function MessageRow({ message }) {
    const { initiaAddress, username } = useInterwovenKit()
    const { data: senderUsername } = useUsernameQuery(message.sender)
    const senderLabel =
      message.sender === initiaAddress
        ? username
          ? username
          : truncate(message.sender)
        : senderUsername
          ? senderUsername
          : truncate(message.sender)

    return (
      <div className="message-sender">
        {senderLabel}
      </div>
    )
  }

  // 1. Extract username from the hook
  const { initiaAddress, username, openConnect, openWallet } = useInterwovenKit()

  // 2. Update the connected wallet button to show the username
  <div className="wallet-info">
    <button
      onClick={openWallet}
      style={{ background: 'none', border: 'none', cursor: 'pointer' }}
    >
      {username ? username : truncate(initiaAddress)}
    </button>
  </div>

  // 3. Update the feed rows to resolve usernames for sender addresses
  messages.map((message, index) => (
    <MessageRow key={`${message.sender}-${index}`} message={message} />
  ))
  ```

  <Warning>
    **Hook Placement:** Keep `useUsernameQuery(address)` inside a child row component like `MessageRow`. Do not call it directly inside a parent component's `.map()` callback.
  </Warning>
</Accordion>

If you want the complete finished frontend after applying the manual steps
above, use the consolidated reference below.

<Accordion title="Manual Approach: Final Frontend Reference">
  If you want a single copyable end-state after completing the manual steps above, use this consolidated reference. It combines:

  * live Wasm contract query and execute flow,
  * wallet connect/display via `App.jsx`,
  * runtime config from `.env`, and
  * Initia username support for the connected wallet and sender rows.

  **src/Board.jsx**

  ```jsx wrap src/Board.jsx theme={null}
  import React, { useEffect, useMemo, useState } from 'react'
  import { RESTClient } from '@initia/initia.js'
  import { useInterwovenKit, useUsernameQuery } from '@initia/interwovenkit-react'
  import './Board.css'

  const CHAIN_ID = import.meta.env.VITE_APPCHAIN_ID
  const REST_URL = import.meta.env.VITE_INITIA_REST_URL
  const CONTRACT_ADDRESS = import.meta.env.VITE_MEMOBOARD_CONTRACT_ADDRESS

  function truncate(value) {
    if (!value) return ''
    if (value.length < 18) return value
    return `${value.slice(0, 10)}...${value.slice(-6)}`
  }

  function MessageRow({ message, index, initiaAddress, username }) {
    const { data: senderUsername } = useUsernameQuery(message.sender)

    const senderLabel =
      message.sender === initiaAddress
        ? username
          ? username
          : truncate(message.sender)
        : senderUsername
          ? senderUsername
          : truncate(message.sender)

    return (
      <div className="message-card">
        <div className="message-sender">{senderLabel}</div>
        <div className="message-content">{message.message}</div>
        <div
          style={{
            marginTop: 8,
            fontSize: 12,
            color: '#999',
          }}
        >
          Message #{index + 1}
        </div>
      </div>
    )
  }

  export default function Board() {
    const { initiaAddress, username, requestTxSync } = useInterwovenKit()
    const [messages, setMessages] = useState([])
    const [draft, setDraft] = useState('')
    const [loading, setLoading] = useState(true)
    const [posting, setPosting] = useState(false)
    const [error, setError] = useState('')

    const rest = useMemo(() => new RESTClient(REST_URL), [])

    const fetchMessages = async () => {
      if (!CONTRACT_ADDRESS) {
        setError('Missing VITE_MEMOBOARD_CONTRACT_ADDRESS in .env')
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const queryData = Buffer.from(
          JSON.stringify({ get_messages: {} }),
        ).toString('base64')
        const res = await rest.wasm.smartContractState(CONTRACT_ADDRESS, queryData)
        setMessages(Array.isArray(res.messages) ? res.messages : [])
        setError('')
      } catch (e) {
        console.error('Failed to fetch messages', e)
        setError('Failed to load board messages')
      } finally {
        setLoading(false)
      }
    }

    useEffect(() => {
      fetchMessages()
    }, [])

    const handlePostMessage = async (event) => {
      event.preventDefault()

      const trimmed = draft.trim()
      if (!trimmed || !initiaAddress || !CONTRACT_ADDRESS) return

      setPosting(true)
      setError('')

      try {
        const msg = new TextEncoder().encode(
          JSON.stringify({ post_message: { message: trimmed } }),
        )

        await requestTxSync({
          chainId: CHAIN_ID,
          messages: [
            {
              typeUrl: '/cosmwasm.wasm.v1.MsgExecuteContract',
              value: {
                sender: initiaAddress,
                contract: CONTRACT_ADDRESS,
                msg,
                funds: [],
              },
            },
          ],
        })

        setDraft('')
        await new Promise((resolve) => setTimeout(resolve, 1200))
        await fetchMessages()
      } catch (e) {
        console.error('Transaction failed', e)
        setError('Posting the message failed')
      } finally {
        setPosting(false)
      }
    }

    return (
      <div className="board-container">
        <h1 className="board-title">MemoBoard</h1>

        {!initiaAddress && (
          <div
            className="message-card"
            style={{ marginBottom: 24, textAlign: 'center', color: '#666' }}
          >
            Connect your wallet from the app header to post a memo.
          </div>
        )}

        {initiaAddress && (
          <div style={{ marginBottom: 32 }}>
            <h3 className="section-header">Post a Memo</h3>
            <p style={{ color: '#777', marginBottom: 12 }}>
              Posting as {username ? username : truncate(initiaAddress)}
            </p>
            <form className="input-group" onSubmit={handlePostMessage}>
              <input
                className="memo-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Write a memo..."
              />
              <button
                type="submit"
                className="btn-primary"
                disabled={posting || !draft.trim()}
              >
                {posting ? 'Posting...' : 'Post Message'}
              </button>
            </form>
          </div>
        )}

        <div className="messages-list">
          <h3 className="section-header">Board Feed</h3>

          {error && (
            <div className="message-card" style={{ color: '#b42318' }}>
              {error}
            </div>
          )}

          {loading ? (
            <div className="message-card">Loading board state...</div>
          ) : messages.length === 0 ? (
            <div className="message-card">No messages yet.</div>
          ) : (
            messages.map((message, index) => (
              <MessageRow
                key={`${message.sender}-${index}`}
                message={message}
                index={index}
                initiaAddress={initiaAddress}
                username={username}
              />
            ))
          )}
        </div>
      </div>
    )
  }
  ```

  **src/App.jsx**

  ```jsx wrap src/App.jsx theme={null}
  import React from 'react'
  import { useInterwovenKit } from '@initia/interwovenkit-react'
  import Board from './Board.jsx'

  function shortenAddress(addr) {
    if (!addr) return ''
    return `${addr.slice(0, 8)}...${addr.slice(-4)}`
  }

  export default function App() {
    const { initiaAddress, username, openConnect, openWallet } = useInterwovenKit()

    return (
      <div>
        <header
          style={{
            maxWidth: 600,
            margin: '40px auto 0',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <div>
            <p style={{ margin: 0, color: '#666', fontSize: 12, fontWeight: 700 }}>
              Initia Wasm Appchain
            </p>
            <h1 style={{ margin: '8px 0 0' }}>MemoBoard</h1>
          </div>

          {!initiaAddress ? (
            <button onClick={openConnect} className="btn-primary">
              Connect Wallet
            </button>
          ) : (
            <button onClick={openWallet} className="btn-primary">
              {username ? username : shortenAddress(initiaAddress)}
            </button>
          )}
        </header>

        <Board />
      </div>
    )
  }
  ```
</Accordion>

### Native Feature Verification

1. Connect your wallet in `memoboard-frontend`.
2. Confirm the header button shows your `.init` username (not only a truncated address).
3. Post a message and confirm the sender label for your message uses your username.

## Next Steps

Now that you've mastered a Wasm application, you're ready to build your own
idea! Ensure your project meets all the
[Submission Requirements](../submission-requirements) before submitting.
