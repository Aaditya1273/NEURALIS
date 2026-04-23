> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Introduction

> Learn how to install and get started with the initiad command-line interface for interacting with Initia L1

The [initiad CLI](https://github.com/initia-labs/initia) is a command-line
interface for interacting with the Initia L1. This tool provides comprehensive
functionality for developers and users to manage accounts, query blockchain
data, submit transactions, and perform other operations.

## Overview

With initiad, you can:

* **Account Management**: Create, import, and manage blockchain accounts
* **Transaction Operations**: Send transactions, delegate tokens, and interact
  with smart contracts
* **Data Queries**: Query blockchain state, account balances, and transaction
  history
* **Validator Operations**: Create validators, delegate stakes, and manage
  governance proposals
* **Network Interaction**: Connect to different networks (mainnet, testnet,
  local)

<Info>
  initiad is built using the Cosmos SDK and provides a familiar interface for
  users of other Cosmos-based chains.
</Info>

## Prerequisites

Before installing initiad, ensure you have the following requirements:

* **Go**: Version 1.21 or higher
* **Git**: For cloning the repository
* **Make**: For building the binary

<Tip>
  You can verify your Go installation by running `go version` in your terminal.
</Tip>

## Installation

<Steps>
  <Step title="Clone the Repository">
    First, clone the initiad repository from GitHub:

    ```bash theme={null}
    git clone https://github.com/initia-labs/initia.git
    cd initia
    ```
  </Step>

  <Step title="Get Version and Checkout">
    Fetch the current network version and checkout the corresponding tag. Select the network that matches your intended use case:

    <CodeGroup>
      <CodeBlock filename="Mainnet" language="bash">
        # Get the current mainnet version and checkout

        export VERSION=$(curl -s https://rest.initia.xyz/cosmos/base/tendermint/v1beta1/node_info | jq -r '.application_version.version' | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+')
                    echo "Checking out version: $VERSION"
        git checkout \$VERSION
      </CodeBlock>

      <CodeBlock filename="Testnet" language="bash">
        # Get the current testnet version and checkout

        export VERSION=$(curl -s https://rest.testnet.initia.xyz/cosmos/base/tendermint/v1beta1/node_info | jq -r '.application_version.version' | grep -oE 'v[0-9]+\.[0-9]+\.[0-9]+')
                    echo "Checking out version: $VERSION"
        git checkout \$VERSION
      </CodeBlock>

      <CodeBlock filename="Manual" language="bash">
        # Manually set a specific version and checkout

        export VERSION=v0.5.7
        echo "Checking out version: $VERSION"
                    git checkout $VERSION
      </CodeBlock>
    </CodeGroup>

    <Warning>
      Always use a specific version tag rather than the main branch for production
      environments to ensure stability.
    </Warning>

    <Note>
      Mainnet and testnet may run different versions, so select the appropriate network endpoint.
    </Note>
  </Step>

  <Step title="Build and Install">
    Compile and install the initiad binary:

    ```bash theme={null}
    make install
    ```

    This will build the binary and install it to your `$GOPATH/bin` directory.
  </Step>
</Steps>

## Verification

After installation, verify that initiad is correctly installed and accessible:

### Check CLI Version

```bash theme={null}
initiad version
# Output: v0.5.7
```

### Verify Installation Path

```bash theme={null}
which initiad
# Output: /Users/username/go/bin/initiad (or your $GOPATH/bin path)
```

### Check Available Commands

```bash theme={null}
initiad --help
```

## Network Configuration

By default, initiad connects to the Initia mainnet. You can configure it to
connect to different networks:

<CodeGroup>
  <CodeBlock filename="Mainnet" language="bash">
    initiad config chain-id initia-1
    initiad config node [https://rpc.initia.xyz:443](https://rpc.initia.xyz:443)
  </CodeBlock>

  <CodeBlock filename="Testnet" language="bash">
    initiad config chain-id initiation-1
    initiad config node [https://rpc.testnet.initia.xyz:443](https://rpc.testnet.initia.xyz:443)
  </CodeBlock>

  <CodeBlock filename="Local Node" language="bash">
    initiad config chain-id local-initia
    initiad config node tcp\://localhost:26657
  </CodeBlock>
</CodeGroup>

## Next Steps

Now that you have initiad installed and configured, you can:

<CardGroup cols={2}>
  <Card title="Create Your First Account" href="/developers/developer-guides/tools/clis/initiad-cli/accounts">
    Set up accounts for sending transactions and managing assets
  </Card>

  <Card title="Query Blockchain Data" href="/developers/developer-guides/tools/clis/initiad-cli/querying-data">
    Learn how to query balances, transactions, and network information
  </Card>

  <Card title="Send Transactions" href="/developers/developer-guides/tools/clis/initiad-cli/transactions">
    Execute transactions, transfers, and smart contract interactions
  </Card>
</CardGroup>
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Account

## Creating an Account

Before you can start building and transacting, you'll need to create an account.

```bash theme={null}
export ACCOUNT_NAME=test-account
initiad keys add $ACCOUNT_NAME

# - address: init17exjfvgtpn5ne4pgmuatjg52mvvtj08773tgfx
# name: test-account
# pubkey: '{"@type":"/cosmos.crypto.secp256k1.PubKey","key":"Ap+WnRzOsJGgfgsrgc4APi/EiTzl3t52ruiKGev7X9LW"}'
# type: local

# **Important** write this mnemonic phrase in a safe place.
# It is the only way to recover your account if you ever forget your password.

# glass easy miracle sign tent anchor position cluster shift calm march elite menu must nose inform antique reason meadow relief layer term crush gesture
```

<Warning>
  The mnemonic key is the only way to recover your account if you forget your
  password.
</Warning>

If you want to create an EVM account, you can use the following command:

```bash theme={null}
export ETH_KEY_TYPE=eth_secp256k1
export ETH_COIN_TYPE=60

initiad keys add $ACCOUNT_NAME --key-type $ETH_KEY_TYPE --coin-type $ETH_COIN_TYPE
```

<Note>
  Even with the same mnemonic phrase, the derived addresses differ because the
  method of generating the public key varies, leading to each account being
  treated separately.
</Note>

## Importing an Account

You can import an account by providing a mnemonic phrase.

```bash theme={null}
initiad keys add $ACCOUNT_NAME --recover
> Enter your bip39 mnemonic
glass easy miracle sign tent anchor position cluster shift calm march elite menu must nose inform antique reason meadow relief layer term crush gesture

# - address: init1x7jl4cx6pq4urdppmnhwtyzfdtn5w7ssw4hjfm
#   name: test-account
#   pubkey: '{"@type":"/cosmos.crypto.secp256k1.PubKey","key":"Am9tmvRft+pcol+h/unlMB9gRbKAZF/7Y8K3iWOtr9Dw"}'
#   type: local
```

To export the account's private key, run:

```bash theme={null}
initiad keys export $ACCOUNT_NAME > key.json

>Enter passphrase to encrypt the exported key:

# key.json
# -----BEGIN TENDERMINT PRIVATE KEY-----
# kdf: argon2
# salt: BE84B59652876BFBEEB0E01CA2AA753C
# type: secp256k1

# edch8EcPYgSQrWHdJlmRMZGmh7gqOLYvAHsynbovXonq2reSeP+eEgtvwNYEnrQu
# 2MZwMIs=
# =ObmR
# -----END TENDERMINT PRIVATE KEY-----
```

<Note>
  The exported private key is encrypted with a passphrase. So, you can only
  import it using `initiad` CLI. It is not possible to import it directly on
  Wallet Apps.
</Note>

To import the account using the exported private key, run:

```bash theme={null}
export NEW_ACCOUNT_NAME=test-account2

initiad keys import $NEW_ACCOUNT_NAME key.json
```

## Retrieving Account Data

You can retrieve account data stored in the keyring.

```bash theme={null}
initiad keys list

# - address: init1x7jl4cx6pq4urdppmnhwtyzfdtn5w7ssw4hjfm
#   name: test-account
#   pubkey: '{"@type":"/cosmos.crypto.secp256k1.PubKey","key":"Am9tmvRft+pcol+h/unlMB9gRbKAZF/7Y8K3iWOtr9Dw"}'
#   type: local
```

## Validator Address

If you run a validator node, you can get the validator address by running:

```bash theme={null}
initiad comet show-address

# initvalcons1kknrtmntc39v3z4hgv84hddeclyfsxdgzdtn3q
```

To get validator consensus public key, run:

```bash theme={null}
initiad comet show-validator

# {"@type":"/cosmos.crypto.ed25519.PubKey","key":"lusuUL6CKywnZDPul5COzCFKLPLDGEMbLEIZIZlDp44="}
```
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Querying Data

The initiad CLI offers a range of commands for querying data from Initia L1.

This guide walks you through using these commands to retrieve blockchain data.

`initiad query` command enables you to query data from the blockchain. Each
module provides a client-facing query interface.

The general syntax for querying data is:

```bash theme={null}
initiad query [module-name] [query-name] [args] [flags]
```

## Querying Account Balance

After receiving tokens to your address, you can view your account's balance
like:

```bash theme={null}
export ADDRESS=init1x7jl4cx6pq4urdppmnhwtyzfdtn5w7ssw4hjfm
export NODE_URL=https://rpc.testnet.initia.xyz

initiad query bank balances $ADDRESS --node $NODE_URL

# - amount: "100000000"
#   denom: uinit
```

## Querying Blocks

You can query a single block by its height or hash using the following command:

```bash theme={null}
export BLOCK_HEIGHT=1000
export BLOCK_HASH=04B7658B40508B290B04C61A0021EB5E9354F1E8C70DF5D6AE2A9B1F0B8D32A3

initiad query block --type=height $BLOCK_HEIGHT --node $NODE_URL
initiad query block --type=hash $BLOCK_HASH --node $NODE_URL
```

## Querying Transactions

You can query a single transaction by its hash using the following command:

```bash theme={null}
export TX_HASH=6DFEE8E4BFC38341E8AADBD74A23588D8DE94FA38052CB5721DDA780A24F8B1D

initiad query tx $TX_HASH --node $NODE_URL

# code: 0
# codespace: ""
# data: 12240A222F696E697469612E6D6F76652E76312E4D736745786563757465526573706F6E7365
# events:
# - attributes:
#   - index: true
#     key: sender
#     value: 0x1,0x512536dfca0b50144483dab26790912ad85b17fe
#     ...
```

## Querying Params

You can query the module parameters using the following command:

```bash theme={null}
initiad query mstaking params --node $NODE_URL

# bond_denoms:
# - uinit
# - move/dbf06c48af3984ec6d9ae8a9aa7dbb0bb1e784aa9b8c4a5681af660cf8558d7d
# - move/a2b0d3c8e53e379ede31f3a361ff02716d50ec53c6b65b8c48a81d5b06548200
# - move/b134ae6786f10ef74294e627d2519b63b7c742a6735f98682929fea9a84744d2
# historical_entries: 10000
# max_entries: 7
# max_validators: 100
# min_commission_rate: "0.000000000000000000"
# min_voting_power: "1000000"
# unbonding_time: 1814400s

initiad query move params --node $NODE_URL

# allowed_publishers: []
# base_denom: uinit
# base_min_gas_price: "0.015000000000000000"
# contract_shared_revenue_ratio: "0.000000000000000000"
# script_enabled: true
```

## Querying Oracle

If a node has the oracle module enabled, you can query the currency pairs and
price using the following commands:

```bash theme={null}
initiad query oracle currency-pairs --node $NODE_URL

# currency_pairs:
# - Base: AAVE
#   Quote: USD
# - Base: ADA
#   Quote: USD
# - Base: AEVO
#   Quote: USD

initiad query oracle price AAVE USD --node $NODE_URL

# decimals: "8"
# id: "19"
# nonce: "1233969"
# price:
#   block_height: "1237222"
#   block_timestamp: "2024-10-30T05:36:59.810774835Z"
#   price: "15143771245"
```
> ## Documentation Index
> Fetch the complete documentation index at: https://docs.initia.xyz/llms.txt
> Use this file to discover all available pages before exploring further.

# Transactions

`initiad tx` command enables you to modify the chain state by submitting a
transaction.

Each module provides a client-facing transaction interface.

The general syntax for submitting a transaction is:

```bash theme={null}
initiad tx [module-name] [action-name] [args] [flags]
```

## Send Tokens

To send tokens from one account to another, you can use the following command:

```bash theme={null}
export NODE_URL=https://rpc.testnet.initia.xyz
export ACCOUNT_NAME=test-account
export RECIPIENT_ADDRESS=init1x7jl4cx6pq4urdppmnhwtyzfdtn5w7ssw4hjfm
export CHAIN_ID=initiation-2

initiad tx bank send $ACCOUNT_NAME $RECIPIENT_ADDRESS 1000uinit \
    --node $NODE_URL \
    --from $ACCOUNT_NAME \
    --chain-id $CHAIN_ID \
    --gas auto \
    --gas-adjustment 1.4
```

## Deploy Move Module

First, clone the initia-tutorials repository, which contains the read\_write
module we'll be using.

```bash theme={null}
git clone git@github.com:initia-labs/initia-tutorials.git
```

Before building the module, you need to update the module owner's address to
your own address in the `Move.toml` configuration file located in
`./initia-tutorials/move/read_write`.

Use the following command to parse your Initia address into bytes format, which
is your HEX address.

```bash theme={null}
initiad keys parse init138ntr4czqvrfzz8vvfsmdz0a36u8h6g5ct5cna

# bytes: 89E6B1D70203069108EC6261B689FD8EB87BE914
# human: init
```

Now, modify the `Move.toml` file to include your HEX address:

```toml theme={null}
[package]
name = "read_write"
version = "0.0.0"

[dependencies]
InitiaStdlib = { git = "https://github.com/initia-labs/movevm.git", subdir = "precompile/modules/initia_stdlib", rev = "main" }

[addresses]
std =  "0x1"
your_address = "0x89E6B1D70203069108EC6261B689FD8EB87BE914"
```

Build the module using either CLI:

```bash theme={null}
initiad move build --path ./initia-tutorials/move/read_write
```

Then, publish the module to the Initia blockchain:

```bash theme={null}
initiad move deploy \
  --path ./initia-tutorials/move/read_write \
  --upgrade-policy COMPATIBLE \
  --from $ACCOUNT_NAME \
  --gas auto --gas-adjustment 1.5 \
  --gas-prices 0.015uinit \
  --node $NODE_URL \
  --chain-id $CHAIN_ID
```

**About the upgrade policy:**

| Policy         | Description                                                                                                           |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| **COMPATIBLE** | Performs a compatibility check during upgrades, ensuring no public function changes or resource layout modifications. |
| **IMMUTABLE**  | Marks the modules as immutable, preventing any future upgrades.                                                       |

To interact with the module, you can use the following command:

```bash theme={null}
export MODULE_ADDRESS=0x89E6B1D70203069108EC6261B689FD8EB87BE914
initiad query move view $MODULE_ADDRESS read_write read \
  --node $NODE_URL

# data: '"initial content"'
# events: []
# gas_used: "1166"

initiad tx move execute $MODULE_ADDRESS read_write write \
  --args '["string:new_string"]' \
  --from $ACCOUNT_NAME \
  --gas auto --gas-adjustment 1.5 --gas-prices 0.015uinit \
  --node $NODE_URL --chain-id $CHAIN_ID

initiad query move view $MODULE_ADDRESS read_write read \
  --node $NODE_URL

# data: '"new_string"'
# events: []
# gas_used: "1150"
```

