import { Response, NextFunction } from "express";
import { ethers } from 'ethers';
import debug, { IDebugger } from "debug";
import RelayProxyABI from '../ABI/RelayProxy.json';
import IDAIABI from '../ABI/IDAI.json';

const log: IDebugger = debug("order:controller");

class OrderController {
  constructor() {}

  async postOrder(req: any, res: Response, next: NextFunction) {
    const {
      amount,
      secret,
      module,
      inputToken,
      owner,
      witness,
      data,
      signature: { sigR, sigS, sigV},
    } = req.body;

    try {
      const provider = ethers.getDefaultProvider(`https://rpc-mainnet.maticvigil.com/v1/${process.env.MATIC_RPC_KEY}`);
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);
      const relayProxy = new ethers.Contract(process.env.CONTRACT_ADDRESS as string, RelayProxyABI, signer);
      await relayProxy.executeLimitOrder(
        amount,
        secret,
        module,
        inputToken,
        owner,
        witness,
        data,
        sigR,
        sigS,
        sigV
      );
      
      log("Send Transaction Success");
      return res.status(200).json({
        success: true,
      });

    } catch (e) {
      next(e);
    }
  }

  async postPermit(req: any, res: Response, next: NextFunction) {
    const {
      holder,
      spender,
      nonce,
      expiry,
      allowed,
      signature: { sigR, sigS, sigV},
    } = req.body;

    try {
      const provider = ethers.getDefaultProvider(`https://rpc-mainnet.maticvigil.com/v1/${process.env.MATIC_RPC_KEY}`);
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string, provider);
      const daiAddress = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
      const DAI = new ethers.Contract(daiAddress, IDAIABI, signer);
      await DAI.permit(
        holder,
        spender,
        nonce,
        expiry,
        allowed,
        sigV,
        sigR,
        sigS
      );
      
      log("Send Transaction Success");
      return res.status(200).json({
        success: true,
      });

    } catch (e) {
      next(e);
    }
  }
}

export default new OrderController();