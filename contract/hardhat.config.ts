import { HardhatUserConfig } from "hardhat/types";
import { task } from "hardhat/config";
import "@typechain/hardhat";
import "@nomiclabs/hardhat-ethers";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-etherscan";
import { config as dotenvConfig } from "dotenv";
import { resolve } from "path";
dotenvConfig({ path: resolve(__dirname, "./.env") });

const PRIVATE_KEY = process.env.PRIVATE_KEY || "";
const POLYGONSCAN_KEY = process.env.POLYGONSCAN_KEY || "";
const ALCHEMY_KEY = process.env.ALCHEMY_KEY || "";
const MATIC_RPC_KEY = process.env.MATIC_RPC_KEY || "";

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (args, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

const config: HardhatUserConfig = {
  solidity: "0.8.0",
  networks: {
    hardhat: {
      chainId: 1337,
      throwOnTransactionFailures: true,
      throwOnCallFailures: true,
      forking: {
        url: `https://polygon-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`,
        blockNumber: 19827323,
      },
    },
    matic: {
      url: `https://rpc-mainnet.maticvigil.com/v1/${MATIC_RPC_KEY}`,
      accounts: [PRIVATE_KEY],
      network_id: 80001,
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true,
      networkCheckTimeout: 100000,
    } as any,
  },
  etherscan: {
    apiKey: POLYGONSCAN_KEY,
  },
  typechain: {
    outDir: "typechain",
    target: "ethers-v5",
  },
};
export default config;
