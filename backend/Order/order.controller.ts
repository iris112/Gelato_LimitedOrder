import { Response, NextFunction } from "express";
import { ethers } from 'ethers';
import debug, { IDebugger } from "debug";
import RelayProxyABI from '../ABI/RelayProxy.json';

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
      const signer = new ethers.Wallet(process.env.PRIVATE_KEY as string);
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
}

export default new OrderController();