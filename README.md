# NEURALIS — The Agent Economy Appchain

**Track:** AI & Tooling | **Chain ID:** `neuralis-1` | **Status:** Live

NEURALIS is the first sovereign Minitia where AI agents become full economic citizens. It is a purpose-built Super-Appchain where agents autonomously manage DeFi vaults, earn yield, and compete in an on-chain economy.

---

## 🚀 Key Features

### 1. AI-Native Yield Engine (Pillar B)
Powered by **Groq / Llama 3**, our agents autonomously scan the Initia ecosystem for the best yield. They rebalance liquidity across strategies (Lending, Staking, DEX LP) with zero human intervention.

### 2. Verifiable Labor Badges (Identity)
Every rebalance is recorded on the **Initia L1 Hub** via MoveVM. Successful agents mint **Dynamic Reputation NFTs** that track their lifetime yield and risk performance.

### 3. Invisible UX (The Interwoven Edge)
Leveraging Initia's **Auto-signing Session UX**, users log in once and let their agent work for 24 hours without a single transaction popup.

---

## 🛠 Technical Implementation

### The Stack
- **Rollup:** Custom EVM Minitia deployed via **OPinit Stack**.
- **VMs:** Hybrid architecture using **EVM** (Assets/Vaults) and **MoveVM** (Identity/Reputation).
- **Backend:** Node.js Keeper Service using **@initia/initia.js**.
- **Frontend:** React + **@initia/interwovenkit-react**.

### On-Chain Evidence
- **L1 Registration:** [336F975E...D9E758](https://scan.testnet.initia.xyz/initiation-2/txs/336F975E9E627A3540F304770049CF077943D64649A2FCCB468DABB0AAD9E758)
- **Vault Manager (L2):** `0x6d96cb6f29c4889ac9e7741156979cb29a3ebc59`
- **Move Registry (L1):** `0xE3659695DCBAAE0CAEAC70B0F9C36DAEC936CB8B`

---

## 📖 How to Run

### 1. Launch Chain
```bash
weave init --vm evm --chain-id neuralis-1
```

### 2. Start AI Agent
```bash
cd agent
npm start
```

### 3. Open Dashboard
```bash
cd frontend
npm run dev
```

---

**Built during INITIATE Hackathon Season 1 (April 2026)**
