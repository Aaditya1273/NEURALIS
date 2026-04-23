> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Set Up Your Appchain

## Build an Appchain with Your AI Agent

Welcome to the hackathon! This guide will walk you through building an appchain
from scratch. You'll go from a simple idea to a functioning appchain and
frontend efficiently.

## Step 1: Prepare Your Workspace

Before installing tools or initializing your appchain, create a dedicated
directory for your project. This keeps your configuration files, VM binaries,
and smart contracts organized in one place.

**Run the following commands in your terminal:**

```bash wrap theme={null}
mkdir my-initia-project
cd my-initia-project
```

## Step 2: Install Your AI Skill

Your AI agent needs the `Initia Appchain Dev` skill to help you manage
your appchain, write smart contracts, and build your frontend.

**Run the following command in your terminal:**

```bash wrap theme={null}
npx skills add initia-labs/agent-skills
```

## Step 3: Select an AI Agent

These guides assume you are using a code-aware AI agent that can access your
project directory, read files, run commands, and help you edit code. Any
equivalent tool is fine.

### Terminal Agents (CLI)

* [OpenAI Codex](https://help.openai.com/en/articles/11096431-openai-codex-ci-getting-started)
* [Claude Code](https://code.claude.com/docs/en/setup)
* [Gemini CLI](https://geminicli.com/docs/get-started/installation/)

### AI-Powered IDEs

* [Cursor](https://cursor.com/download)
* [VS Code](https://code.visualstudio.com/download)

Keep your AI agent open in your project root so it can use your local context
when you paste the prompts in this guide.

<Tip>
  **Recommended setup:** Use two terminal tabs or a split-screen layout:

  1. **AI agent**: For high-level tasks, contract generation, and
     troubleshooting.
  2. **Standard terminal**: For interactive CLI commands like `weave init` and
     long-running builds.
</Tip>

## Step 4: Select Your Track & VM

Before installing tools, decide what you want to build. This choice determines
which `Virtual Machine (VM)` your AI agent will set up for you.

| Track                  | Recommended VM   | Reason                                                       |
| :--------------------- | :--------------- | :----------------------------------------------------------- |
| `Gaming / Consumer`    | `Move`           | Best for complex onchain logic and object-oriented assets.   |
| `DeFi / Institutional` | `EVM` (Solidity) | Best for leveraging existing Ethereum tooling and libraries. |
| `AI / Tooling`         | `Wasm` (Rust)    | Best for backend-heavy apps, agents, and tooling.            |

<Note>
  If you are building for the AI track and want guidance on where AI should
  live in your architecture, see
  [AI Track Guidance](/hackathon/ai-track-guidance).
</Note>

## Step 5: Prerequisites Checklist

To ensure a smooth setup, verify you have the following system tools installed:

* **[Docker Desktop](https://www.docker.com/products/docker-desktop/)**: Required for running the bridge bots and relayer. **Must be running.**
* **[Go (1.22+)](https://go.dev/doc/install)**: Required to build the appchain binaries.
* **Track Specifics**:
  * **Move**: No extra tools required.
  * **EVM**: **[Foundry](https://book.getfoundry.sh/getting-started/installation)** (Forge) is recommended for contract development.
  * **Wasm**: **[Rust & Cargo](https://rustup.rs/)** are required for contract development.

## Step 6: AI-Powered Initia Tool Setup and Verification

Now, ask your AI agent to handle the Initia-specific tools. It will install the core CLIs (`weave`, `initiad`, `jq`), build your chosen VM binary (`minitiad`), and verify everything is in your `PATH`.

Replace `<MOVE / EVM / WASM>` with your selected track from Step 4 (`Move`, `EVM`, or `Wasm`).

```terminal title="Prompt: Set up my environment" wrap theme={null}
Using the `initia-appchain-dev` skill, please set up my environment for the <MOVE / EVM / WASM> track.
```

### Verify Installation & PATH

After setup completes, your AI agent can verify the tools are accessible from
anywhere on your system.

```terminal title="Prompt: Verify tool installation" wrap theme={null}
Using the `initia-appchain-dev` skill, please verify that `initiad`, `weave`, and `minitiad` are properly installed and accessible in my PATH.
```

## Step 7: Initial Setup with `weave init`

Your AI agent is your partner in this hackathon, but the `weave` CLI requires
an interactive setup flow to prepare your environment and launch your appchain.
You can run it whenever you need to initialize or reconfigure your setup.

<Warning>
  **Resetting Existing Local State:** If you already ran `weave init` and want to create a new appchain, run the
  following commands first. This clears your existing local Initia, Minitia,
  OPinit, and relayer setup:

  ```bash wrap theme={null}
  rm -rf ~/.weave ~/.initia ~/.minitia ~/.opinit
  docker rm -f weave-relayer || true
  ```
</Warning>

**Run the following command in your terminal:**

```bash wrap theme={null}
weave init
```

Here's a guide on how to navigate the interactive setup:

<Steps>
  <Step title="Foundation & Funding">
    ### Generate Gas Station Account

    The Gas Station is an account on the Initia L1 that will fund your rollup's infrastructure.

    **Prompt:**

    ```terminal wrap theme={null}
    How would you like to set up your Gas Station account?
    ```

    **Action:**
    Select `Generate new account (recommended)`.

    **Result:**
    You will see your new Gas Station Address. Copy this address.

    ### Fund Your Gas Station Account

    **Action:**
    Go to the [Initia Testnet Faucet](https://app.testnet.initia.xyz/faucet).

    **Action:**
    Paste your address and click **Submit** to receive testnet INIT tokens.

    **Prompt:**

    ```terminal wrap theme={null}
    Type `continue` to proceed.
    ```

    **Action:**
    Type `continue` and press Enter.
  </Step>

  <Step title="Rollup Identity">
    ### Select Your Action

    **Prompt:**

    ```terminal wrap theme={null}
    What do you want to do?
    ```

    **Action:**
    Select `Launch a new rollup`.

    <Warning>
      **Switching VMs?** Reinstall the correct `minitiad` binary first (Step 6). If you have existing rollup data, type `confirm` when prompted to clean it and proceed.
    </Warning>

    ### Select L1 Network

    **Prompt:**

    ```terminal wrap theme={null}
    Select the Initia L1 network
    ```

    **Action:**
    Select `Testnet (initiation-2)`.

    ### Select Virtual Machine (VM)

    **Prompt:**

    ```terminal wrap theme={null}
    Select the Virtual Machine (VM)
    ```

    **Action:**
    Select your desired VM (e.g., `Move`).

    ### Specify Rollup Chain ID

    **Prompt:**

    ```terminal wrap theme={null}
    Specify rollup chain ID
    ```

    **Action:**
    Enter a unique ID (e.g., `mygame-1`).

    <Tip>
      **Save your Chain ID!** You'll need this unique identifier for your final submission.
    </Tip>

    ### Specify Rollup Gas Denom

    **Prompt:**

    ```terminal wrap theme={null}
    Specify rollup gas denom
    ```

    **Action:**
    Press `Tab` for default (`umin`) or enter your own.

    ### Specify Rollup Node Moniker

    **Prompt:**

    ```terminal wrap theme={null}
    Specify rollup node moniker
    ```

    **Action:**
    Press `Tab` for default (`operator`).
  </Step>

  <Step title="Network & Infrastructure">
    ### Submission Interval

    **Prompt:**

    ```terminal wrap theme={null}
    Specify OP bridge config: Submission Interval
    ```

    **Action:**
    Press `Tab` for default (`1m`).

    ### Finalization Period

    **Prompt:**

    ```terminal wrap theme={null}
    Specify OP bridge config: Output Finalization Period
    ```

    **Action:**
    Press `Tab` for default (`168h`).

    ### Data Availability

    **Prompt:**

    ```terminal wrap theme={null}
    Where should the rollup blocks data be submitted?
    ```

    **Action:**
    Select `Initia L1`.

    ### Enable Oracle Price Feed

    **Prompt:**

    ```terminal wrap theme={null}
    Would you like to enable oracle price feed from L1?
    ```

    **Action:**
    Select `Enable`.
  </Step>

  <Step title="Security & Genesis">
    ### Setup Method for System Keys

    **Prompt:**

    ```terminal wrap theme={null}
    Select a setup method for the system keys
    ```

    **Action:**
    Select `Generate new system keys`.

    ### System Accounts Funding Option

    **Prompt:**

    ```terminal wrap theme={null}
    Select system accounts funding option
    ```

    **Action:**
    Select `Use the default preset`.

    ### Specify Fee Whitelist Addresses

    **Prompt:**

    ```terminal wrap theme={null}
    Specify fee whitelist addresses
    ```

    **Action:**
    Press `Enter` to leave empty.

    ### Add Gas Station Account to Genesis

    **Prompt:**

    ```terminal wrap theme={null}
    Would you like to add the Gas Station account to genesis accounts?
    ```

    **Action:**
    Select `Yes`.

    ### Specify Genesis Balance

    **Prompt:**

    ```terminal wrap theme={null}
    Specify the genesis balance for the Gas Station account
    ```

    **Action:**
    Enter `1000000000000000000000000` (10^24). This ensures you have plenty of tokens for testing, especially for EVM.

    <Warning>
      **Move Track Balance Limit:** Use `10000000000000000000` (10^19) to avoid `u64` overflows.
    </Warning>

    ### Add Additional Genesis Accounts

    **Prompt:**

    ```terminal wrap theme={null}
    Would you like to add genesis accounts?
    ```

    **Action:**
    Select `No`.
  </Step>

  <Step title="Launch">
    ### Verify System Keys & Continue

    **Prompt:**

    ```terminal wrap theme={null}
    Type 'continue' to proceed.
    ```

    **Action:**
    Type `continue` and press Enter.

    ### Confirm Transactions

    **Prompt:**

    ```terminal wrap theme={null}
    Confirm to proceed with signing and broadcasting the following transactions? [y]:
    ```

    **Action:**
    Type `y` and press Enter.

    Your appchain will now launch and start producing blocks!
  </Step>
</Steps>

## Step 8: Setup Interwoven Bots

To enable the Optimistic bridge and cross-chain communication (IBC) between
Initia L1 and your appchain, you need to start the `OPinit Executor` and the
`IBC Relayer`. These bots manage the cross-chain connectivity of your chain.

<Note>
  **Prerequisite:** Your appchain must be running before configuring these bots. Because `weave init` runs your chain in the background, you can continue using the same terminal window.
</Note>

### 8.1 Start the OPinit Executor

The executor handles the submission of rollup data and bridge operations.

**Run the following command:**

```bash wrap theme={null}
weave opinit init executor
```

Follow the interactive guide:

<Steps>
  <Step title="Use Detected Keys">
    **Prompt:**

    ```terminal wrap theme={null}
    Existing keys in config.json detected. Would you like to add these to the keyring before proceeding?
    ```

    **Action:**
    Select `Yes, use detected keys`.
  </Step>

  <Step title="System Key for Oracle">
    **Prompt:**

    ```terminal wrap theme={null}
    Please select an option for the system key for Oracle Bridge Executor
    ```

    **Action:**
    Select `Generate new system key`.
  </Step>

  <Step title="Pre-fill Data">
    **Prompt:**

    ```terminal wrap theme={null}
    Existing config.json detected. Would you like to use the data in this file to pre-fill some fields?
    ```

    **Action:**
    Select `Yes, prefill`.
  </Step>

  <Step title="Listen Address">
    **Prompt:**

    ```terminal wrap theme={null}
    Specify listen address of the bot
    ```

    **Action:**
    Press `Tab` to use `localhost:3000` (ensure nothing else is running on this port).
  </Step>

  <Step title="Finalize Configuration">
    **Action:**
    Press `Enter` for L1 RPC, Chain ID, and Gas Denom. For Rollup RPC, press `Tab` to use `http://localhost:26657`.
  </Step>

  <Step title="Start the Bot">
    Once initialized, start the bot in the background:

    ```bash wrap theme={null}
    weave opinit start executor -d
    ```
  </Step>
</Steps>

### 8.2 Start the IBC Relayer

The relayer enables asset transfers (like INIT) between the L1 and your
appchain.

<Warning>Docker Desktop must be running to launch the relayer.</Warning>

**Run the following command:**

```bash wrap theme={null}
weave relayer init
```

Follow the interactive guide:

<Steps>
  <Step title="Select Rollup">
    **Prompt:**

    ```terminal wrap theme={null}
    Select the type of Interwoven rollup you want to relay
    ```

    **Action:**
    Select `Local Rollup (<YOUR_APPCHAIN_ID>)`.
  </Step>

  <Step title="Endpoints">
    **Action:**
    Press `Tab` for both **RPC** (`http://localhost:26657`) and **REST** (`http://localhost:1317`) endpoints.
  </Step>

  <Step title="Channel Method">
    **Prompt:**

    ```terminal wrap theme={null}
    Select method to set up IBC channels for the relayer
    ```

    **Action:**
    Select `Subscribe to only transfer and nft-transfer IBC Channels (minimal setup)`.
  </Step>

  <Step title="Select Channels">
    **Prompt:**

    ```terminal wrap theme={null}
    Select the IBC channels you would like to relay
    ```

    **Action:**
    Press `Space` to select all (transfer and nft-transfer), then press `Enter`.
  </Step>

  <Step title="Challenger Key">
    **Prompt:**

    ```terminal wrap theme={null}
    Do you want to set up relayer with the challenger key
    ```

    **Action:**
    Select `Yes (recommended)`.
  </Step>

  <Step title="Start Relayer">
    Start the relayer process:

    ```bash wrap theme={null}
    weave relayer start -d
    ```

    <Note>
      You can view relayer logs at any time by running `weave relayer log` in your terminal.
    </Note>
  </Step>
</Steps>

<Note>
  **Persistence After Restart:**
  After restarting your computer, the relayer remains managed by Docker. As
  long as Docker Desktop is open, it should still be running. You still need to
  restart your rollup full node and executor:

  ```bash wrap theme={null}
  weave rollup start -d

  weave opinit start executor -d
  ```
</Note>

## Step 9: Final Key Setup

**Why:** The `Gas Station` account acts as your `Universal Developer
Key`. Importing it allows you to sign transactions manually via the CLI, and it
enables your AI co-pilot to deploy contracts and interact with your appchain.

**Action:** Run these commands to import your account into both the L1
(`initiad`) and L2 (`minitiad`) keychains:

```bash wrap theme={null}
# Extract your mnemonic from the weave config
MNEMONIC=$(jq -r '.common.gas_station.mnemonic' ~/.weave/config.json)

# Import into initiad (L1)
initiad keys add gas-station --recover --keyring-backend test --coin-type 60 --key-type eth_secp256k1 --source <(echo -n "$MNEMONIC")

# Import into minitiad (L2)
minitiad keys add gas-station --recover --keyring-backend test --coin-type 60 --key-type eth_secp256k1 --source <(echo -n "$MNEMONIC")
```

**Action:** Verify the import by listing your keys to ensure `gas-station`
appears in both:

```bash wrap theme={null}
# Verify L1 keys
initiad keys list --keyring-backend test

# Verify L2 keys
minitiad keys list --keyring-backend test
```

<Warning>
  **Production Security:** This workflow is for rapid prototyping only.

  * **Insecure Storage:** `config.json` and `--keyring-backend test` are for convenience, not production.
  * **Mainnet:** Use secure keyrings (OS keychain, hardware wallet) and never store mnemonics in plaintext.
  * **Best Practice:** Use separate accounts for `Gas Station`, `Validator`, and `Developer` roles on Mainnet.
</Warning>

## Step 10: Verifying Your Appchain

After completing the infrastructure setup, verify that everything is healthy.

```terminal title="Prompt: Verify my appchain is healthy" wrap theme={null}
Using the `initia-appchain-dev` skill, please verify that my appchain, executor bot, and relayer are running and that my Gas Station account has a balance.
```

## Step 11: Build Your App

Congratulations! You have successfully launched your first appchain. Next, head
to the [Builder Guide](/hackathon/builder-guide) to select whether to build
from scratch or start from a Blueprint, then build your app with AI, debug
issues, and prepare your submission.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Builder Guide

Use this page after [Set Up Your Appchain](/hackathon/get-started). Select a
direction, prompt your AI agent, deploy, and verify real onchain
behavior.

Prerequisites:

* **Tools ready**: `weave`, `initiad`, and `minitiad` are installed and in your
  PATH ([Step 6](/hackathon/get-started#step-6-ai-powered-initia-tool-setup-and-verification)).
* **Infrastructure live**: your rollup and OPinit/Relayer bots are running
  ([Step 8](/hackathon/get-started#step-8-setup-interwoven-bots)).
* **Gas Station keys imported**: your `gas-station` keys are available in the local keyrings
  ([Step 9](/hackathon/get-started#step-9-final-key-setup)).

## Recommended Flow

1. **Set Up Your Appchain**: Complete [Set Up Your Appchain](/hackathon/get-started) and launch your local environment.
2. **Select Your Path**: Decide whether to build your app from scratch or adapt a Blueprint.
3. **Build Your App with AI**: Implement your app and confirm it works onchain.
4. **Debug and Refine**: Fix frontend or onchain issues before packaging your project.
5. **Prepare Your Submission**: Complete [Submission Requirements](/hackathon/submission-requirements).

## Part 1: Select Your Path

You can either build your app from scratch with your AI agent or start from a
Blueprint that matches the native feature you want to implement.

<CardGroup cols={2}>
  <Card title="Build From Scratch" icon="hammer" href="#part-2-build-your-app-with-ai">
    Start from a blank project and use the AI-assisted workflow below to build,
    deploy, and verify your app.
  </Card>

  <Card title="Select Your Blueprint" icon="drafting-compass" href="#select-your-blueprint">
    Start from a Blueprint that already maps to a supported native feature,
    then adapt it into your own original project.
  </Card>
</CardGroup>

<Note>
  **Blueprint Path:** If you select a Blueprint, you can jump directly into
  that tutorial. Come back to this page later for debugging help or official
  references if you need them. After you adapt the Blueprint into your own
  original app, use
  [Submission Requirements](/hackathon/submission-requirements) to confirm your
  final submission is complete.
</Note>

### Select Your Blueprint

To qualify for the hackathon prizes, your project must implement at least one
supported Native Feature. These Blueprints provide implementation patterns you
can adapt, or use as references while building your own concept.

<CardGroup cols={1}>
  <Card title="Blueprint 1: BlockForge Game (Auto-signing)" icon="wand-magic-sparkles" href="/hackathon/examples/move-game">
    A high-frequency application where the blockchain handles logic silently in
    the background. Users approve a session once, then continue interacting
    without repeated wallet popups.

    * **Native Feature:** [`Auto-signing`](/interwovenkit/features/autosign/introduction)
    * **Best for:** Gaming, Microtransactions, High-frequency trading.
  </Card>

  <Card title="Blueprint 2: MiniBank (Interwoven Bridge)" icon="bridge" href="/hackathon/examples/evm-bank">
    An application that allows users to move assets between Initia L1 and an
    appchain without leaving the app.

    * **Native Feature:** [`Interwoven Bridging`](/interwovenkit/features/transfers/deposit-withdraw)
    * **Best for:** DeFi, Cross-chain payments, Multi-chain apps.
  </Card>

  <Card title="Blueprint 3: MemoBoard (Initia Usernames)" icon="user-group" href="/hackathon/examples/wasm-social">
    An application that prioritizes human-readable identities, replacing
    complex hex addresses with personal usernames.

    * **Native Feature:** [`Initia Usernames`](/developers/developer-guides/integrating-initia-apps/usernames)
    * **Best for:** Social apps, Peer-to-peer payments, Community apps.
  </Card>
</CardGroup>

<Note>
  **Originality matters:** Whether you build from scratch or adapt a Blueprint,
  judges will look for clear custom logic, UX, and product differentiation.
</Note>

## Part 2: Build Your App with AI

### Funding Your Personal Wallet

Before you can interact with your appchain via a browser wallet (like Keplr,
Leap, or MetaMask), you need to fund your personal address from your Gas
Station.

1. Copy your wallet address (`init1...`).

2. Ask your AI agent to fund your wallet:

```terminal title="Prompt: Fund your personal wallet" wrap theme={null}
Using the `initia-appchain-dev` skill, please fund my personal wallet <YOUR_WALLET_ADDRESS> with 1 INIT on L1 and 100 of my appchain's native tokens on L2.
```

### Development Workflow

1. **Describe the Goal**: Tell the AI what you want to achieve and why.

   <Tip>
     **Gather Submission Metadata Early:** As you build, keep track of the
     deployed contract or module address and the final repo paths you plan to
     submit for your core logic and native feature frontend files. You will use
     them in the [Submission JSON](/hackathon/submission-requirements#submission-json).
   </Tip>

2. **Build and Test**: Clearly describe your app's behavior and rules, then let
   the AI write the code and unit tests.

   ```terminal title="Prompt: Create and test the contract" wrap theme={null}
   Using the `initia-appchain-dev` skill, please create a new <MOVE / EVM / WASM> contract project in a directory named <PROJECT_NAME>, implement the core logic for <APP_NAME> with the following requirements:
   <APP_REQUIREMENTS>

   Please also create and run unit tests that verify both success and failure paths.
   ```

3. **Deploy to Your Appchain**: Instruct the AI to deploy your contract/module to your appchain.

   ```terminal title="Prompt: Deploy to your appchain" wrap theme={null}
   Using the `initia-appchain-dev` skill, please build and deploy my contract/module from the <PROJECT_NAME> directory to my appchain using my Gas Station account.

   If this VM requires instantiate after deploy, run that too, then return the deployed address.
   ```

4. **Verify Onchain Behavior**: Ask the AI to verify your live deployment with interactions and state queries.

   ```terminal title="Prompt: Smoke test live deployment" wrap theme={null}
   Using the `initia-appchain-dev` skill, I want to smoke test my live <CONTRACT_NAME> on my appchain.

   Please run 2-3 realistic user actions, then query state after each step and confirm the observed results match expected behavior.
   ```

5. **Integrate the Frontend**: Ask the AI to build or update your frontend and connect it to your appchain.

   ```terminal title="Prompt: Build the frontend" wrap theme={null}
   Using the `initia-appchain-dev` skill, please create or update my frontend in <FRONTEND_PROJECT_NAME> to connect to my appchain with `InterwovenKit`, integrate my deployed <CONTRACT_OR_MODULE_NAME>, and implement the core user flow for <APP_NAME>.
   ```

   <Note>
     **Run the Frontend Locally:** After the frontend is implemented, follow
     your AI agent's instructions to start the app locally and verify the core
     user flow in the browser.
   </Note>

6. **Add a Native Feature**: Ask the AI to implement one supported native feature and wire it into your app flow.

   <Note>
     **Supported Native Features:** To be eligible for prizes, your project
     should implement at least one supported native feature. Select one of the
     following:

     * `auto-signing`
     * `interwoven-bridge`
     * `initia-usernames`

     These features are covered in the Blueprint tutorials, but you can also
     add them to a project you build from scratch.
   </Note>

   ```terminal title="Prompt: Add a native feature" wrap theme={null}
   Using the `initia-appchain-dev` skill, please add <AUTO-SIGNING / INTERWOVEN BRIDGE / INITIA USERNAMES> support to my app.

   Please update the frontend and any required configuration so this native feature works in the core user flow.
   ```

## Part 3: Debugging & Troubleshooting

### Debugging Workflow

Whether you are building from scratch or adapting a Blueprint, errors are
inevitable.

1. **Open the Browser Console**: Press `F12` or `Cmd+Option+J` to see the exact
   error logs.
2. **Provide Project Context**: Ensure your AI agent is open in your project root.
   This allows it to reference your `package.json`, your `interwovenkit`
   initialization, and your specific chain configuration.
3. **Evaluate and Fix the Error**: Ask your AI agent to fix the issue directly,
   and include the exact console error in your prompt.

   ```terminal title="Prompt: Fix the error in my codebase" wrap theme={null}
   Please find and fix this error directly in my codebase, then tell me what changed.

   [PASTE_CONSOLE_ERROR]
   ```

## Part 4: Prepare Your Submission

Use [Submission Requirements](/hackathon/submission-requirements) to complete
your final submission files and confirm your project is eligible.

### Official References

* **Official Docs**: Visit [docs.initia.xyz](https://docs.initia.xyz/) for
  architectural details and API references.
* **Initia Examples**: Reference the
  [initia-labs/examples](https://github.com/initia-labs/examples) repository for
  working code across all VMs (EVM, Move, Wasm).
* **Core Repositories**: Explore [initia-labs](https://github.com/initia-labs)
  on GitHub to see the underlying implementation of the SDKs and CLI tools.
* **Initia L1**: [initia-labs/initia](https://github.com/initia-labs/initia)
  contains the core Layer 1 source code.
* **Weave CLI**: [initia-labs/weave](https://github.com/initia-labs/weave) is
  the main CLI for launching and managing appchains.
* **InterwovenKit**:
  [initia-labs/interwovenkit](https://github.com/initia-labs/interwovenkit) is
  the standard React SDK for Initia frontends.
* **Initia.js**: [initia-labs/initia.js](https://github.com/initia-labs/initia.js)
  is the primary JavaScript library for blockchain interactions.

#### Useful Endpoints

* **Local Rollup Indexer:** `http://localhost:8080`
* **L1 Indexer Swagger:** `https://indexer.initia.xyz/swagger/index.html`
* **L1 Testnet RPC:** `https://rpc.testnet.initia.xyz`
* **L1 Testnet REST:** `https://rest.testnet.initia.xyz`
* **Faucet:** `https://faucet.testnet.initia.xyz`
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# AI Track Guidance

Use this page if you are building for the AI track and want a practical model
for how AI should fit into your Initia appchain architecture.

You do not need to run model inference onchain. In most projects, inference
will happen offchain, with the appchain handling the parts of the product that
need blockchain guarantees.

<CardGroup cols={2}>
  <Card title="Use AI Offchain" icon="robot">
    Generate or transform content, make recommendations, power copilots or
    agents, and run classification or summarization.
  </Card>

  <Card title="Use the Appchain" icon="diagram-project">
    Store ownership and state, handle rewards and payments, enforce access or
    reputation, and coordinate marketplaces or escrow.
  </Card>
</CardGroup>

## External AI Services

You may use hosted model APIs in your project. If your project depends on a
third-party AI provider, plan to supply your own API key or backend
configuration for development and demos. For most hackathon teams, hosted APIs
are the fastest and most common way to add AI features.

<Warning>
  **API key security:** If your project uses an external AI API, store secrets
  in a local `.env` file or another secure secret manager. Do not commit API
  keys to GitHub or expose them in your demo video, screenshots, or frontend
  code.
</Warning>

If you need to add a model provider to your app, start with the official API
docs for your chosen service:

<CardGroup cols={3}>
  <Card title="OpenAI" icon="book-open" href="https://platform.openai.com/docs/quickstart">
    API docs
  </Card>

  <Card title="Anthropic" icon="book-open" href="https://platform.claude.com/docs/en/api/overview">
    API docs
  </Card>

  <Card title="Google Gemini" icon="book-open" href="https://ai.google.dev/docs">
    API docs
  </Card>
</CardGroup>

<Note>
  For demos, it is acceptable to use mocked, cached, or pre-generated AI
  outputs if you clearly disclose that setup. Judges will evaluate the
  product, appchain integration, and overall user experience, not whether the
  model itself is hosted onchain.
</Note>
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Submission Requirements

Use this page to prepare your final submission. Complete the required
submission files and fill in any missing details before you submit.

## Requirements

If you followed [Set Up Your Appchain](/hackathon/get-started) and completed
one of the Blueprint tutorials, you likely already satisfy the first three
requirements below: appchain deployment, frontend experience, and native
feature. Use this section to verify those pieces and complete the required
submission files.

<CardGroup cols={2}>
  <Card title="Appchain Deployment" icon="diagram-project">
    Your project should run as its own Initia appchain, with its own rollup
    identity and deployed application logic.
  </Card>

  <Card title="Frontend Experience" icon="display">
    Your frontend should use `InterwovenKit` for wallet connection and
    transaction flows so the app reflects the core Initia user experience.
  </Card>

  <Card title="Native Feature" icon="bolt">
    Your project should implement at least one supported Native Feature:

    * `auto-signing`
    * `interwoven-bridge`
    * `initia-usernames`
  </Card>

  <Card title="Submission Files" icon="file-lines">
    Your repository should include:

    * `.initia/submission.json`
    * `README.md` at the repository root
  </Card>
</CardGroup>

<Note>
  **Showcase your app's originality:** Projects that only reproduce a Blueprint without
  meaningful customization are not eligible for prizes. Your submission should
  include clear custom logic, UX, or product differentiation.
</Note>

## Submission JSON

Required file path: `.initia/submission.json`

Use this exact structure:

```json title=".initia/submission.json" theme={null}
{
  "project_name": "My Project",
  "repo_url": "https://github.com/<org>/<repo>",
  "commit_sha": "0123456789abcdef0123456789abcdef01234567",
  "rollup_chain_id": "my-game-1",
  "deployed_address": "0x...",
  "vm": "move",
  "native_feature": "auto-signing",
  "core_logic_path": "blockforge/sources/items.move",
  "native_feature_frontend_path": "blockforge-frontend/src/Game.jsx",
  "demo_video_url": "https://youtu.be/..."
}
```

## Submission JSON Field Reference

All fields in `.initia/submission.json` are required.

| Field                          | Expected value                                                                                                           |
| :----------------------------- | :----------------------------------------------------------------------------------------------------------------------- |
| `project_name`                 | Non-empty string                                                                                                         |
| `repo_url`                     | Reachable public GitHub repository URL                                                                                   |
| `commit_sha`                   | 40-character hex Git commit SHA                                                                                          |
| `rollup_chain_id`              | Non-empty string                                                                                                         |
| `deployed_address`             | Primary deployed address for your application logic. Use your contract address, or your module address for Move projects |
| `vm`                           | `move`, `evm`, or `wasm`                                                                                                 |
| `native_feature`               | `auto-signing`, `interwoven-bridge`, or `initia-usernames`                                                               |
| `core_logic_path`              | Repo-relative file path that must exist at `commit_sha`                                                                  |
| `native_feature_frontend_path` | Repo-relative file path that must exist at `commit_sha`                                                                  |
| `demo_video_url`               | Public Loom or YouTube URL for a 1 to 3 minute walkthrough video                                                         |

## Project Description

Required file path: `README.md` at the repository root

Copy this block near the top of your `README.md` and fill it in:

```markdown title="README.md" theme={null}
## Initia Hackathon Submission

- **Project Name**: [Your Project Name]

### Project Overview

[Provide a 2-3 sentence description of your application, the problem it solves,
who it is for, and why it is valuable to users.]

### Implementation Detail

- **The Custom Implementation**: Briefly describe the unique logic you added.
  What original functionality did you design and implement?
- **The Native Feature**: Which Interwoven feature did you use, and exactly how does
  it improve the user experience?

### How to Run Locally

[Provide 3-4 clear steps for a judge to run your frontend and connect it to a
local environment if necessary.]
```
