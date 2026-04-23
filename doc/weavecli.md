> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Introduction

Weave is a CLI tool designed to make working with Initia and its Interwoven
Rollups easier. Instead of dealing with multiple tools and extensive
documentation, developers can use a single command-line interface for the entire
development and deployment workflow.

Its primary purpose is to solve several key challenges:

1. **Infrastructure Management:** Weave can handle all critical infrastructure
   components within the Interwoven Rollup ecosystem:
   * Initia node setup and management (including state sync and chain upgrade
     management)
   * Rollup deployment and configuration
   * OPinit bots setup for the Optimistic bridge
   * IBC Relayer setup between Initia L1 and your Rollup
2. **Built for both local development and production deployments:** Weave
   provides
   * Interactive guided setup for step-by-step configuration and
   * Configuration file support for automated deployments
3. **Developer Experience:** Not only does it consolidate multiple complex
   operations into a single CLI tool, but it also changes how you interact with
   the tool to set up your configuration.

## How Experience with Weave Is Different

Here are some of the key features that make it stand out:

1. **Tooltip support in each step:** You can toggle tooltips on and off in each
   step by pressing `Ctrl + T` to get more information about the current step.

   This gives you the right amount of information at the right time, reducing
   time spent searching for what you need.

2. **Ability to go back to the previous step (for most steps):** Weave allows
   you to go back to the previous step in the setup process by pressing
   `Ctrl + Z`. This is particularly useful when you make a mistake in the setup
   process and need to correct it. Please note that this is not available for
   all steps.

3. **Simple service management:** Weave provides a simple command to start,
   stop, restart a service just like how you would do it with `systemctl` or
   `launchctl`. It also provides a `log` command to view the logs of the
   service.

   In essence, every infra-service you set up can be managed with the following
   commands:

   ```bash theme={null}
   weave <service-name> start, stop, restart, log
   ```

Get started with Weave now by following this
[installation guide](/developers/developer-guides/tools/clis/weave-cli/installation).
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Installation & Setup

## Prerequisites

* Operating System: **Linux, MacOS**
* Go **v1.24** or higher (when building from source)
* NPM & Node **v20** or higher (if you wish to run relayer in the same machine)
* Docker and Docker Compose
  * For macOS: Install Docker Desktop from
    [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
  * For Linux: Install Docker Engine and Docker Compose from
    [https://docs.docker.com/engine/install/](https://docs.docker.com/engine/install/)
  * Verify: `docker --version` and `docker compose version`
* LZ4 compression tool
  * For macOS: `brew install lz4`
  * For Ubuntu/Debian: `apt-get install lz4`

## Installation

<Steps>
  <Step title="Get Weave Binary">
    <Tabs>
      <Tab title="Homebrew (macOS)">
        ```bash theme={null}
        brew install initia-labs/tap/weave
        ```
      </Tab>

      <Tab title="wget (linux)">
        **AMD64**

        ```bash theme={null}
        VERSION=$(curl -s https://api.github.com/repos/initia-labs/weave/releases/latest | grep '"tag_name":' | cut -d'"' -f4 | cut -c 2-)
        wget https://github.com/initia-labs/weave/releases/download/v$VERSION/weave-$VERSION-linux-amd64.tar.gz
        tar -xvf weave-$VERSION-linux-amd64.tar.gz
        ```

        **ARM64**

        ```bash theme={null}
        VERSION=$(curl -s https://api.github.com/repos/initia-labs/weave/releases/latest | grep '"tag_name":' | cut -d'"' -f4 | cut -c 2-)
        wget https://github.com/initia-labs/weave/releases/download/v$VERSION/weave-$VERSION-linux-arm64.tar.gz
        tar -xvf weave-$VERSION-linux-arm64.tar.gz
        ```
      </Tab>

      <Tab title="Build from source">
        ```bash theme={null}
        git clone https://github.com/initia-labs/weave.git
        cd weave
        VERSION=$(curl -s https://api.github.com/repos/initia-labs/weave/releases/latest | grep '"tag_name":' | cut -d'"' -f4 | cut -c 2-)
        git checkout tags/v$VERSION
        make install
        ```
      </Tab>
    </Tabs>
  </Step>

  <Step title="Verify Installation">
    ```bash theme={null}
    weave version
    ```

    This should return the version of the Weave binary you have installed.
  </Step>

  <Step title="Quick Start">
    To get started with Weave, run

    ```bash theme={null}
    weave init
    ```

    It will ask you to set up the [Gas Station](/developers/developer-guides/tools/clis/weave-cli/gas-station) account and ask which infrastructure you want to set up.
    After that, Weave will guide you through the setup process step-by-step.

    <Note>
      Read the [Gas Station](/developers/developer-guides/tools/clis/weave-cli/gas-station) section to understand the purpose and usage of the Gas Station before proceeding.
    </Note>
  </Step>
</Steps>

<Warning>
  By default, Weave collects non-identifiable usage data to help improve the product. If you prefer not to share this data, you can opt out by running the following command:

  ```bash theme={null}
  weave analytics disable
  ```
</Warning>

### Next Steps

<CardGroup cols={2}>
  <Card title="Bootstrapping Initia Node" icon="microchip" href="/developers/developer-guides/tools/clis/weave-cli/initia-node">
    Set up your Initia node and start syncing with the chain.
  </Card>

  <Card title="Launching Rollup" icon="rocket-launch" href="/developers/developer-guides/tools/clis/weave-cli/rollup/launch">
    Configure and launch your own rollup.
  </Card>

  <Card title="Running IBC Relayer" icon="arrow-right-arrow-left" href="/developers/developer-guides/tools/clis/weave-cli/rollup/relayer">
    Set up and run the IBC relayer. This is necessary for the built-in oracle to
    work.
  </Card>

  <Card title="Running OPinit Bots" icon="circle-nodes" href="/developers/developer-guides/tools/clis/weave-cli/rollup/opinit-bots">
    Set up the OPinit bots to complete the optimistic rollup setup.
  </Card>
</CardGroup>

or run

```bash theme={null}
weave --help
```

to learn more about all the commands available.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Gas Station

The Gas Station is a dedicated account used by Weave to fund critical
infrastructure components of the Interwoven stack. It distributes funds to
essential services like
[OPinit Bots](/home/core-concepts/interwoven-stack/opinit-framework/introduction)
(including Bridge Executor, Output Submitter, Batch Submitter, and Challenger)
and the
[IBC relayer](https://tutorials.cosmos.network/academy/2-cosmos-concepts/13-relayer-intro.html)
to ensure smooth operation of the network.

This is essential for seamless operation with Weave as it eliminates the need
for manual fund distribution.

<Warning>
  While Weave requires your consent for all fund transfers, using a separate
  account prevents any potential misuse of an existing account. Creating a new
  dedicated account for Gas Station use rather than using an existing account is
  strongly recommended.
</Warning>

## Setting Up the Gas Station

```bash theme={null}
weave gas-station setup
```

You can either import an existing mnemonic or have Weave generate a new one.
Once setup is complete, you'll see two addresses in `init` and `celestia`
format.

<Note>
  While the Gas Station addresses for Celestia and the Initia ecosystem will be
  different, both are derived from the same mnemonic that you entered.
</Note>

Then fund the account with at least 10 INIT tokens to support the necessary
components. If you're planning to use Celestia as your Data Availability Layer,
you'll also need to fund the account with `TIA` tokens.

<Info>
  For testnet operations: - Get testnet `INIT` tokens from the [Initia
  faucet](https://faucet.testnet.initia.xyz/) - Get testnet `TIA` tokens from
  the [Celestia
  faucet](https://docs.celestia.org/how-to-guides/mocha-testnet#mocha-testnet-faucet)
</Info>

## Viewing Gas Station Information

```bash theme={null}
weave gas-station show
```

This command displays the addresses and current balances of the Gas Station
account in both `init` and `celestia` bech32 formats.
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Bootstrapping Initia Node

Setting up a node for a Cosmos SDK chain has traditionally been a complex
process requiring multiple steps:

* Locating the correct repository and version of the node binary compatible with
  your target network
* Either cloning and building the source code or downloading a pre-built binary
  from the release page
* Configuring the node with appropriate `config.toml` and `app.toml` files,
  which involves:
  * Setting correct values for `seeds`, `persistent_peers`, and `pruning`
  * Navigating through numerous other parameters that rarely need modification
* Finding and implementing the correct genesis file to sync with the network
* Setting up cosmovisor for automatic updates or manually maintaining the node
  binary

Weave streamlines this entire process into a simple command.

## Initialize Your Node

```bash theme={null}
weave initia init
```

This command guides you through the node setup process, taking you from an empty
directory to a fully synced node ready for operation. Once complete, you can run
the node using `weave initia start`.

**Available Flags**

<ParamField path="--initia-dir" type="string" default="~/.initia">
  The directory to store the node's data and configuration files.
</ParamField>

## Running Your Node

<Tabs>
  <Tab title="Start">
    ```bash theme={null}
    weave initia start
    ```

    **Available Flags**

    <ParamField path="--detach, -d" type="boolean" default="false">
      Whether to run the node in the background.
    </ParamField>
  </Tab>

  <Tab title="Stop">`bash weave initia stop `</Tab>

  <Tab title="Restart">`bash weave initia restart `</Tab>

  <Tab title="View logs">
    ```bash theme={null}
    weave initia log
    ```

    **Available Flags**

    <ParamField path="-n" type="number" default="100">
      The number of lines to display from the end of the logs.
    </ParamField>
  </Tab>
</Tabs>

## Help

To see all the available commands:

```bash theme={null}
weave initia --help
```








> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Introduction

Previously, for your rollup to be fully operational, you needed to follow a
series of extensive steps (multiple binaries, multiple configuration files,
etc.) described [here](/nodes-and-rollups/deploying-rollups).

Weave CLI simplifies all these steps into a set of easy-to-follow commands,
getting your rollup fully operational in no time.

**For a complete rollup deployment from scratch, follow these steps in order**.
If you only need to set up specific components, you can navigate directly to the
relevant sections.

1. [Launch your rollup and run sequencer/operator node(s)](/developers/developer-guides/tools/clis/weave-cli/rollup/launch)
2. [Running IBC Relayer](/developers/developer-guides/tools/clis/weave-cli/rollup/relayer)
   (necessary for the built-in oracle and IBC support)
3. [Running OPinit Bots](/developers/developer-guides/tools/clis/weave-cli/rollup/opinit-bots)
   (executor and challenger)
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Launching your Rollup

Weave simplifies
[this lengthy complex rollup deployment process](/nodes-and-rollups/deploying-rollups)
into a single command.

<Note>
  Weave will send some funds from Gas Station to the OPinit Bot accounts during
  this process. Please make sure that your Gas Station account has enough funds
  to cover the total amount of funds to be sent (this amount will be shown to
  you before sending the funds).
</Note>

<Warning>
  Haven't set up the Gas Station yet? Please [Check out this
  guide](/developers/developer-guides/tools/clis/weave-cli/gas-station) first.
</Warning>

```bash theme={null}
weave rollup launch
```

Once the process completes, your rollup node will be running and ready to
process queries and transactions. The command also provides an
[InitiaScan](https://scan.testnet.initia.xyz/) magic link that automatically
adds your local rollup to the explorer, allowing you to instantly view your
rollup's transactions and state.

<Note>
  This command only sets up the bot addresses but does not start the OPinit Bots (executor and challenger).

  To complete the setup, proceed to the
  [OPinit Bots setup](/developers/developer-guides/tools/clis/weave-cli/rollup/opinit-bots)
  section to configure and run the OPinit Bots.
</Note>

To launch from the config file without going through the interactive setup
process, use the `--with-config` and `--vm` flags.

```bash theme={null}
weave rollup launch --with-config <path-to-config-file> --vm <move|wasm|evm>
```

**Available Flags**

<ParamField path="--minitia-dir" type="string" default="~/.minitia">
  The directory to store the rollup node data and configuration files.
</ParamField>

<ParamField path="--with-config" type="string">
  Path to the rollup config file. Use this flag to launch from a config file
  without going through the interactive setup process.
</ParamField>

<ParamField path="--vm" type="string">
  The VM to use for the rollup node. The available options are `move`, `wasm`,
  and `evm`. **This is required when `--with-config` flag is provided.**
</ParamField>

<ParamField path="--force,-f" type="boolean" default="false">
  Force the launch of the rollup node even if the config file already exists.
  **This only works when `--with-config` flag is provided.**
</ParamField>

## Running Your Rollup Node

<Tabs>
  <Tab title="Start">
    `bash weave rollup start `

    <Note>
      Note that `launch` command already starts the rollup node for you. This
      command is only needed if you have stopped the node and want to start it
      again.
    </Note>

    **Available Flags**

    <ParamField path="--detach, -d" type="boolean" default="false">
      Whether to run the rollup node in the background.
    </ParamField>
  </Tab>

  <Tab title="Stop">`bash weave rollup stop `</Tab>
  <Tab title="Restart">`bash weave rollup restart `</Tab>

  <Tab title="View logs">
    `bash weave rollup log ` **Available Flags**

    <ParamField path="-n" type="number" default="100">
      The number of lines to display from the end of the logs.
    </ParamField>
  </Tab>
</Tabs>

## Help

To see all the available commands:

```bash theme={null}
weave rollup --help
```
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Running IBC Relayer

An IBC relayer is a software component that facilitates communication between
two distinct blockchain networks that support the Inter-Blockchain Communication
(IBC) protocol. Built-in oracle, Minitswap, and other cross-chain services
require it to function with your rollup.

Weave currently only supports Rapid relayer configuration generation. It will
support running the rapid relayer directly in the future. For more detailed
information about Rapid relayer, see the
[Rapid relayer documentation](https://github.com/initia-labs/rapid-relayer).

<Note>
  Weave only supports IBC relayer setup between Initia L1 and Interwoven
  Rollups. Setting up relayers between other arbitrary networks is not
  supported.
</Note>

## Setting Up

For this guide, you'll need Weave v0.3.0 or newer. You can check your Weave
version by running `weave version`. If you need to upgrade, run `weave upgrade`.

```bash theme={null}
weave relayer init
```

This command will guide you through 2 major parts of the relayer setup:

* Setting up networks and channels to relay messages between
* Setting up the account responsible for relaying messages

For the former, Weave will present you with three options:

1. Configure channels between Initia L1 and a whitelisted Rollup (those
   available in
   [Initia Registry](https://github.com/initia-labs/initia-registry))
2. Configure using artifacts from `weave rollup launch` (recommended for users
   who have just launched their rollup)
3. Configure manually

As for the latter, Weave will ask whether you want to use the OPinit Challenger
bot account for the relayer. This is recommended as it is exempted from gas fees
on the rollup and able to stop other relayers from relaying when it detects a
malicious message.

<Warning>
  Relayer requires funds to relay messages between Initia L1 and your rollup (if
  it's not in the fee whitelist). If Weave detects that your account does not
  have enough funds, Weave will ask you to fund via Gas Station.
</Warning>

## Running Relayer

Currently, Weave generates the relayer configuration file but does not run the
relayer directly. You'll need to manually set up and run the Rapid relayer using
the generated configuration.

<Note>
  Make sure you have Node.js and npm installed on your system if you wish to run
  the relayer in the same machine.
</Note>

<Steps>
  <Step title="Clone and Install Rapid relayer">
    Clone the Rapid relayer repository and install its dependencies:

    ```bash theme={null}
    git clone https://github.com/initia-labs/rapid-relayer
    cd rapid-relayer
    npm install
    ```
  </Step>

  <Step title="Copy Configuration File">
    Move the generated configuration file to the Rapid relayer directory:

    ```bash theme={null}
    cp ~/.relayer/config.json ./config.json
    ```
  </Step>

  <Step title="Start the Relayer">
    Launch the relayer with the configuration:

    ```bash theme={null}
    npm start
    ```
  </Step>
</Steps>

## Help

To see all the available commands:

```bash theme={null}
weave relayer --help
```
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Running OPinit Bots

Weave provides a streamlined way to configure and run
[OPinit Bots](/home/core-concepts/interwoven-stack/opinit-framework/introduction)
(executor and challenger) for your rollup.

## Setting Up

```bash theme={null}
weave opinit init
```

This command will guide you through selecting the bot type (executor or
challenger), configuring bot keys if needed, and setting up the bot's
configuration.

You can also specify the bot type directly:

<Tabs>
  <Tab title="Executor">
    ```bash theme={null}
    weave opinit init executor
    ```

    To set up Executor from the [config file](https://github.com/initia-labs/opinit-bots/blob/main/executor/README.md) without going through the interactive setup process, use the `--with-config` flag together with either `--generate-key-file` or `--key-file` flags.

    For example, to let Weave generate Executor's keys for you, use the following command:

    ```bash theme={null}
    weave opinit init executor --with-config <path-to-config-file> --generate-key-file
    ```

    To provide your own keys, use the following command:

    ```bash theme={null}
    weave opinit init executor --with-config <path-to-config-file> --key-file <path-to-key-file>
    ```

    **Available Flags**

    <ParamField path="--opinit-dir" type="string" default="~/.opinit">
      The directory to store OPinit bots data and configuration files
    </ParamField>

    <ParamField path="--minitia-dir" type="string" default="~/.minitia">
      Path to the rollup directory that contains the rollup's artifacts. This is
      useful when you are setting up OPinit bots for a rollup that you have just
      launched, as it can use the artifacts from the rollup to setup the bots.
    </ParamField>

    <ParamField path="--with-config" type="string">
      Path to the rollup [config file](https://github.com/initia-labs/opinit-bots/blob/main/executor/README.md). Use this flag to set up Executor from a config file without going through the interactive setup process.
    </ParamField>

    <ParamField path="--generate-key-file" type="boolean" default="false">
      Whether to generate Executor's keys during the setup process. Can only be used when `--with-config` flag is provided. Conflicts with `--key-file` flag.
    </ParamField>

    <ParamField path="--key-file" type="string">
      Path to the Executor's keys file. Can only be used when `--with-config` flag is provided. Conflicts with `--generate-key-file` flag.
    </ParamField>
  </Tab>

  <Tab title="Challenger">
    ```bash theme={null}
    weave opinit init challenger
    ```

    To set up Challenger from the [config file](https://github.com/initia-labs/opinit-bots/blob/main/challenger/README.md) without going through the interactive setup process, use the `--with-config` flag together with either `--generate-key-file` or `--key-file` flags.

    For example, to let Weave generate Challenger's keys for you, use the following command:

    ```bash theme={null}
    weave opinit init challenger --with-config <path-to-config-file> --generate-key-file
    ```

    To provide your own OPinit bot keys, use the following command:

    ```bash theme={null}
    weave opinit init challenger --with-config <path-to-config-file> --key-file <path-to-key-file>
    ```

    **Available Flags**

    <ParamField path="--opinit-dir" type="string" default="~/.opinit">
      The directory to store OPinit bots data and configuration files
    </ParamField>

    <ParamField path="--minitia-dir" type="string" default="~/.minitia">
      Path to the rollup directory that contains the rollup's artifacts. This is
      useful when you are setting up OPinit bots for a rollup that you have just
      launched, as it can use the artifacts from the rollup to setup the bots.
    </ParamField>

    <ParamField path="--with-config" type="string">
      Path to the rollup [config file](https://github.com/initia-labs/opinit-bots/blob/main/challenger/README.md). Use this flag to set up Challenger from a config file without going through the interactive setup process.
    </ParamField>

    <ParamField path="--generate-key-file" type="boolean" default="false">
      Whether to generate Challenger's keys during the setup process. Can only be used when `--with-config` flag is provided. Conflicts with `--key-file` flag.
    </ParamField>

    <ParamField path="--key-file" type="string">
      Path to the Challenger's keys file. Can only be used when `--with-config` flag is provided. Conflicts with `--generate-key-file` flag.
    </ParamField>
  </Tab>
</Tabs>

## Managing Keys

To modify bot keys, use the following command to either generate new keys or
restore existing ones:

```bash theme={null}
weave opinit setup-keys
```

**Available Flags**

<ParamField path="--opinit-dir" type="string" default="~/.opinit">
  The directory to store OPinit bots data and configuration files
</ParamField>

<ParamField path="--minitia-dir" type="string" default="~/.minitia">
  Path to the rollup directory that contains the rollup's artifacts. This is
  useful when you are setting up OPinit bots for a rollup that you have just
  launched, as it can use the artifacts from the rollup to setup the bots.
</ParamField>

<Warning>
  For the Executor bot to work, set up the Bridge Executor, Output Submitter, and Batch Submitter keys.

  For the Challenger bot to work, set up the Challenger key.

  For rollups with built-in oracle enabled, set up the Oracle Executor key.
</Warning>

## Resetting OPinit Bots

<Tabs>
  <Tab title="Executor">
    Reset Executor's database. This will clear all the data stored in the Executor's database (the configuration files are not affected).

    ```bash theme={null}
    weave opinit reset executor
    ```
  </Tab>

  <Tab title="Challenger">
    Reset Challenger's database. This will clear all the data stored in the Challenger's database (the configuration files are not affected).

    ```bash theme={null}
    weave opinit reset challenger
    ```
  </Tab>
</Tabs>

## Running OPinit Bots

<Tabs>
  <Tab title="Executor">
    <Tabs>
      <Tab title="Start">
        `bash weave opinit start executor ` **Available Flags**

        <ParamField path="--detach, -d" type="boolean" default="false">
          Whether to run the Executor in the background.
        </ParamField>
      </Tab>

      <Tab title="Stop">`bash weave opinit stop executor `</Tab>
      <Tab title="Restart">`bash weave opinit restart executor `</Tab>

      <Tab title="View logs">
        `bash weave opinit log executor ` **Available Flags**

        <ParamField path="-n" type="number" default="100">
          The number of lines to display from the end of the Executor's logs.
        </ParamField>
      </Tab>
    </Tabs>
  </Tab>

  <Tab title="Challenger">
    <Tabs>
      <Tab title="Start">
        `bash weave opinit start challenger ` **Available Flags**

        <ParamField path="--detach, -d" type="boolean" default="false">
          Whether to run the node in the background.
        </ParamField>
      </Tab>

      <Tab title="Stop">`bash weave opinit stop challenger `</Tab>
      <Tab title="Restart">`bash weave opinit restart challenger `</Tab>

      <Tab title="View logs">
        `bash weave opinit log challenger ` **Available Flags**

        <ParamField path="-n" type="number" default="100">
          The number of lines to display from the end of the logs.
        </ParamField>
      </Tab>
    </Tabs>
  </Tab>
</Tabs>

## Help

To see all the available commands:

```bash theme={null}
weave opinit --help
```
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Next Steps

## Building on Your Rollup

Once your rollup node is launched and both the OPinit bots and IBC Relayer are
configured, you can start integrating it with Initia tools. The resources below
will help you get started:

* **VM-specific tutorials**: Learn how to deploy contracts and interact with
  your rollup on each VM.
  * [EVM tutorials](/developers/developer-guides/vm-specific-tutorials/evm)
  * [MoveVM tutorials](/developers/developer-guides/vm-specific-tutorials/movevm)
  * [WasmVM tutorials](/developers/developer-guides/vm-specific-tutorials/wasmvm)
* **[Oracle](/developers/developer-guides/tools/oracles/connect/fetching-prices-from-api/getting-single-asset-price)**:
  Integrate oracles to fetch off-chain token price data and use it in your
  rollup applications.
* **[Indexer](/developers/developer-guides/tools/indexers/transactions-by-account)**:
  Use the Initia Indexer to query and retrieve data from your rollup.
* **[SDKs](/developers/developer-guides/tools/sdks)**: Explore the Initia SDKs
  for building applications on your rollup.

## Going Live

<Note>
  If you are launching a rollup for testing purposes, you can skip this section.
  When your rollup is ready for production and you want it to be publicly
  visible in the Initia ecosystem, contact the Initia team first via
  [Discord](https://discord.gg/initia) by raising a ticket. We will walk you
  through the registry and bridge integration steps described below.
</Note>

To make your rollup node visible to the Initia ecosystem, register it in the
[Initia Registry](https://github.com/initia-labs/initia-registry) and the
[Skip Go Registry](https://github.com/initia-labs/skip-go-registry). To list
your rollup node on **InitiaScan** and the **Initia Wallet widget**, follow
these steps:

* **[Register Initia Registry](/nodes-and-rollups/deploying-rollups/initia-registry)**

For bridge integration, register your rollup in Initia Registry first, then open
a PR that adds your node information to **skip-go-registry** repository.

* **[Skip Go Registry Repository](https://github.com/skip-mev/skip-go-registry)**
