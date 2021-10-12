import { ethers, network } from "hardhat";
import chai from "chai";
import { solidity } from "ethereum-waffle";
import {
  RelayProxy,
  RelayProxy__factory,
  IDAI__factory,
  IERC20__factory,
} from "../typechain";

const expect = chai.expect;
chai.use(solidity);

describe("RelayProxy", function () {
  let relayProxy: RelayProxy;

  before("deploy base app", async () => {
    const [deployer] = await ethers.getSigners();
    const factory = new RelayProxy__factory(deployer);
    relayProxy = await factory.deploy("DepositToken", "1");

    await relayProxy.deployed();
  });

  it("Should check signature verification of DAI.permit() ", async function () {
    const [deployer] = await ethers.getSigners();
    const daiAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
    const DAI = IDAI__factory.connect(daiAddress, deployer);
    const nonce = await DAI.getNonce(deployer.address);

    //Make signature
    const typedData = {
      types: {
        Permit: [
          { name: "holder", type: "address" },
          { name: "spender", type: "address" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint256" },
          { name: "allowed", type: "bool" },
        ],
      },
      domain: {
        name: "(PoS) Dai Stablecoin",
        version: "1",
        salt: ethers.utils.hexZeroPad(ethers.utils.hexlify(137), 32),
        verifyingContract: daiAddress,
      },
      txData: {
        holder: deployer.address,
        spender: relayProxy.address,
        nonce: nonce,
        expiry: 0,
        allowed: true,
      },
    };

    const { domain, types, txData } = typedData;
    const signature = await deployer._signTypedData(domain, types, txData);
    const split = ethers.utils.splitSignature(signature);

    // Call with signature
    await expect(
      DAI.permit(
        txData.holder,
        txData.spender,
        txData.nonce,
        txData.expiry,
        txData.allowed,
        split.v,
        split.r,
        split.s
      )
    ).to.not.be.reverted;
  });

  it("Should check signature verification of RelayProxy.executeLimitOrder ", async function () {
    const [deployer, relayer] = await ethers.getSigners();
    const nonce = await relayProxy.getNonce(deployer.address);
    const moduleAddress = "0x5A36178E38864F5E724A2DaF5f9cD9bA473f7903";
    const daiAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
    const usdtAddress = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";
    const randomSecret = ethers.utils
      .hexlify(ethers.utils.randomBytes(19))
      .replace("0x", "");
    // 0x67656c61746f6e6574776f726b = gelatonetwork in hex
    const fullSecret = `0x67656c61746f6e6574776f726b${randomSecret}`;
    const { privateKey: secret, address: witness } = new ethers.Wallet(
      fullSecret
    );
    const inputAmount = ethers.utils.parseEther("0.5");
    const outputAmount = ethers.utils.parseUnits("0.6", 6);
    const gelatoFeeBPS = 2;
    const slippageBPS = 40;
    const gelatoFee = ethers.BigNumber.from(outputAmount)
      .mul(gelatoFeeBPS)
      .div(10000)
      .gte(1)
      ? ethers.BigNumber.from(outputAmount).mul(gelatoFeeBPS).div(10000)
      : ethers.BigNumber.from(1);
    const slippage = ethers.BigNumber.from(outputAmount)
      .mul(slippageBPS)
      .div(10000);
    const minReturn = ethers.BigNumber.from(outputAmount)
      .sub(gelatoFee)
      .sub(slippage);
    const abiEncoder = new ethers.utils.AbiCoder();
    const encodedData = abiEncoder.encode(
      ["address", "uint256"],
      [usdtAddress, minReturn]
    );

    //Make some test DAI
    await network.provider.request({
      method: "hardhat_impersonateAccount",
      params: ["0xBa0E13B23B2D5Fd5CB80544a34345FD370151179"],
    });
    const signer = await ethers.provider.getSigner(
      "0xBa0E13B23B2D5Fd5CB80544a34345FD370151179"
    );
    const DAI = await IERC20__factory.connect(daiAddress, signer);
    await DAI.transfer(deployer.address, ethers.utils.parseEther("1"));

    //Make signature
    const typedData = {
      types: {
        MetaTransaction: [
          { name: "nonce", type: "uint256" },
          { name: "amount", type: "uint256" },
          { name: "secret", type: "bytes32" },
          { name: "module", type: "address" },
          { name: "inputToken", type: "address" },
          { name: "owner", type: "address" },
          { name: "witness", type: "address" },
          { name: "data", type: "bytes" },
        ],
      },
      domain: {
        name: "DepositToken",
        version: "1",
        chainId: 1337,
        verifyingContract: relayProxy.address,
      },
      txData: {
        nonce: nonce,
        amount: inputAmount,
        secret: secret,
        module: moduleAddress,
        inputToken: daiAddress,
        owner: deployer.address,
        witness: witness,
        data: encodedData,
      },
    };

    const { domain, types, txData } = typedData;

    const signature = await deployer._signTypedData(domain, types, txData);
    const split = ethers.utils.splitSignature(signature);

    // Call with signature
    await expect(
      relayProxy
        .connect(relayer)
        .executeLimitOrder(
          txData.amount,
          txData.secret,
          txData.module,
          txData.inputToken,
          txData.owner,
          txData.witness,
          txData.data,
          split.r,
          split.s,
          split.v
        )
    ).to.not.be.reverted;
  });
});
