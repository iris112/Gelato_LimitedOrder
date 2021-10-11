//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/cryptography/draft-EIP712.sol";
import "./ERC20OrderRouter.sol";
import "hardhat/console.sol";

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

    address private constant _ERC20OrderRouter =
        0x0c2c2963A4353FfD839590f7cb1E783688378814;
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

    constructor(string memory name, string memory version)
        EIP712(name, version)
    {}

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    function getChainId() external view returns (uint256) {
        return block.chainid;
    }

    function hashMetaTransaction(MetaTransaction memory metaTx)
        internal
        pure
        returns (bytes32)
    {
        return
            keccak256(
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

    function getNonce(address user) external view returns (uint256 nonce) {
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
            _hashTypedDataV4(hashMetaTransaction(metaTx)),
            sigV,
            sigR,
            sigS
        );

        require(signer != address(0x0), "Invalid signature");
        return signer == user;
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
    ) public {
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
            verify(owner, metaTx, sigR, sigS, sigV),
            "Signer and signature do not match"
        );

        nonces[owner]++;

        //call ERC20OrderRouter.depositToken()
        _executeLimitOrder(metaTx);

        emit MetaTransactionExecuted(
            amount,
            owner,
            msg.sender,
            inputToken,
            data
        );
    }

    function _executeLimitOrder(MetaTransaction memory metaTx) private {
        IERC20(metaTx.inputToken).transferFrom(
            metaTx.owner,
            address(this),
            metaTx.amount
        );
        IERC20(metaTx.inputToken).approve(_ERC20OrderRouter, metaTx.amount);
        ERC20OrderRouter(_ERC20OrderRouter).depositToken(
            metaTx.amount,
            metaTx.module,
            metaTx.inputToken,
            payable(metaTx.owner),
            metaTx.witness,
            metaTx.data,
            metaTx.secret
        );
    }
}
