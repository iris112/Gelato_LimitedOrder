import { Response, NextFunction } from "express";
import UserService from "../Common/services/user";
class UserController {
  constructor() {}

  async getUser(req: any, res: Response, next: NextFunction) {
    const email = req.user.email;
    try {
      const user = await UserService.findUserByEmail(email);

      return res.status(200).json({
        success: true,
        data: user,
      });
    } catch (e) {
      next(e);
    }
  }
}

export default new UserController();