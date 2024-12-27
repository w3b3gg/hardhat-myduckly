import dotenv from "dotenv";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ledger";

dotenv.config();

const {
  PRIVATE_KEY,
  POLYGONSCAN_API_KEY,
  ALCHEMY_API_KEY,
  LEDGER_ACCOUNT,
} = process.env as {
  PRIVATE_KEY: string
  POLYGONSCAN_API_KEY: string
  ALCHEMY_API_KEY: string
  LEDGER_ACCOUNT: string
};

export default {
  solidity: "0.8.28",
  networks: {
    polygon: {
      url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      chainId: 137,
      ledgerAccounts: [LEDGER_ACCOUNT],
    },
    polygonAmoy: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      accounts: [PRIVATE_KEY],
      chainId: 80002,
    },
    polygonAmoyLedger: {
      url: `https://polygon-amoy.g.alchemy.com/v2/${ALCHEMY_API_KEY}`,
      chainId: 80002,
      ledgerAccounts: [
        LEDGER_ACCOUNT,
      ]
    }
  },
  etherscan: {
    apiKey: {
      polygon: POLYGONSCAN_API_KEY,
      polygonAmoy: POLYGONSCAN_API_KEY,
    },
    customChains: [
      {
        network: "polygon",
        chainId: 137,
        urls: {
          apiURL: "https://api.polygonscan.com/api",
          browserURL: "https://polygonscan.com",
        },
      },
      {
        network: "polygonAmoy",
        chainId: 80002,
        urls: {
          apiURL: "https://api-amoy.polygonscan.com/api",
          browserURL: "https://amoy.polygonscan.com",
        },
      }],
  },
};
