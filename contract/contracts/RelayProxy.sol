//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
// import "hardhat/console.sol";


contract RelayProxy is EIP712 {
  /*
    * Meta transaction structure.
    * It will include all params which is needed for ERC20OrderRouter.depositToken()
    */
  struct MetaTransaction {
    uint256 nonce;
    uint256 amount;
    bytes32 secret;
    address module;
    address inputToken;
    address owner;
    address witness;
    bytes data;
	}

  bytes32 private constant META_TRANSACTION_TYPEHASH =
    keccak256(
      bytes(
        "MetaTransaction(uint256 nonce,uint256 amount,bytes32 secret,address module,address inputToken,address owner,address witness,bytes data)"
      )
    );

  mapping(address => uint256) internal nonces;

  event MetaTransactionExecuted(
    uint256 amount,
    address userAddress,
    address relayerAddress,
    address inputToken,
    bytes data
  );

  constructor(string memory name, string memory version) EIP712(name, version) {}

  function domainSeparator() external view returns (bytes32) {
    return _domainSeparatorV4();
  }

  function getChainId() external view returns (uint256) {
    return block.chainid;
  }

  function hashMetaTransaction(MetaTransaction memory metaTx) internal pure returns (bytes32) {
    return keccak256(
      abi.encode(
        META_TRANSACTION_TYPEHASH,
        metaTx.nonce,
        metaTx.amount,
        metaTx.secret,
        metaTx.module,
        metaTx.inputToken,
        metaTx.owner,
        metaTx.witness,
        keccak256(metaTx.data)
      )
    );
	}

  function getNonce(address user) external view returns(uint256 nonce) {
    nonce = nonces[user];
  }

  function verify(
    address user,
    MetaTransaction memory metaTx,
    bytes32 sigR,
    bytes32 sigS,
    uint8 sigV
  ) internal view returns (bool) {
    address signer = ecrecover(
      _hashTypedDataV4(
        hashMetaTransaction(metaTx)
      ),
      sigV,
      sigR,
      sigS
    );

    require(signer != address(0x0), 'Invalid signature');
    return signer == user;
	}

  function msgSender() internal view returns(address sender) {
    if(msg.sender == address(this)) {
      bytes memory array = msg.data;
      uint256 index = msg.data.length;
      assembly {
        // Load the 32 bytes word from memory with the address on the lower 20 bytes, and mask those.
        sender := and(mload(add(array, index)), 0xffffffffffffffffffffffffffffffffffffffff)
      }
    } else {
      sender = msg.sender;
    }
    return sender;
  }

  function executeLimitOrder(
    uint256 amount,
    bytes32 secret,
    address module,
    address inputToken,
    address owner,
    address witness,
    bytes calldata data,
    bytes32 sigR,
    bytes32 sigS,
    uint8 sigV
  ) public payable {
    MetaTransaction memory metaTx = MetaTransaction({
      nonce: nonces[owner],
      amount: amount,
      secret: secret,
      module: module,
      inputToken: inputToken,
      owner: owner,
      witness: witness,
      data: data
    });

    require(
      verify(
        owner,
        metaTx,
        sigR,
        sigS,
        sigV
      ), "Signer and signature do not match"
    );

    nonces[owner]++;

    // // Append userAddress at the end to extract it from calling context
    // (bool success, bytes memory returnData) = address(this).call(
    //   abi.encodePacked(
    //     functionSignature,
    //     userAddress
    //   )
    // );

    // require(
    //     success,
    //     'Function call not successful'
    // );

    emit MetaTransactionExecuted(
      amount,
      owner,
      msg.sender,
      inputToken,
      data
    );
  }
}