// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";
import { RelayProxy, RelayProxy__factory } from "../typechain";

async function main(): Promise<void> {
  //Deploy RelayProxy contract
  const [deployer] = await ethers.getSigners();
  const factory = new RelayProxy__factory(deployer);
  const relayProxy: RelayProxy = await factory.deploy("DepositToken", "1");

  await relayProxy.deployed();

  console.log("RelayProxy deployed to:", relayProxy.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
