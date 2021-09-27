const chai = require('chai');
const { solidity } = require('ethereum-waffle')

const expect = chai.expect
chai.use(solidity)

describe("RelayProxy", function() {
  it("Should check signature verification of RelayProxy ", async function() {
    const [deployer, module, inputToken, witness] = await ethers.getSigners();
    const RelayProxy = await ethers.getContractFactory("RelayProxy");
    const relayProxy = await RelayProxy.deploy("DepositToken", "1");
    
    await relayProxy.deployed();
    
    const nonce = await relayProxy.getNonce(deployer.address);
    const typedData = {
      types: {
        MetaTransaction: [
          { name: 'nonce', type: 'uint256' },
          { name: 'amount', type: 'uint256' },
          { name: 'secret', type: 'bytes32' },
          { name: 'module', type: 'address' },
          { name: 'inputToken', type: 'address' },
          { name: 'owner', type: 'address' },
          { name: 'witness', type: 'address' },
          { name: 'data', type: 'bytes' },
        ],
      },
      domain: {
        name: 'DepositToken',
        version: '1',
        chainId: 1337,
        verifyingContract: relayProxy.address,
      },
      txData: {
        nonce: nonce,
        amount: 10,
        secret: "0x1234567812345678123456781234567812345678123456781234567812345678",
        module: module.address,
        inputToken: inputToken.address,
        owner: deployer.address,
        witness: witness.address,
        data: "0xFFFFFFFFFFFFFFFFFFFFFF"
      },
    };
    
    const { domain, types, txData } = typedData;

    signature = await deployer._signTypedData(domain, types, txData);
    const split = ethers.utils.splitSignature(signature);

    // Call with signature
    await expect(
      relayProxy.executeLimitOrder(
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
