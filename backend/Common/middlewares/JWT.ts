import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
const JWT_KEY = process.env.JWT_SECRET || "123456";
import debug, { IDebugger } from "debug";

const log: IDebugger = debug("middleware:JWT");

class JWT {
  authenticateJWT(req: Request, res: Response, next: NextFunction) {
    const authToken = req.cookies.token;
    if (authToken && authToken !== "null") {
      log("auth Header", JWT_KEY);
      jwt.verify(authToken, JWT_KEY, (err: any, user: any) => {
        if (err) {
          log("Error", err);
          return res.redirect('/login');;
        }
        req.user = user;
        next();
      });
    } else {
      res.redirect('/login');
    }
  }

  authenticateJWTExcept(...paths: string[]) {
    return (req: Request, res: Response, next: NextFunction) => {
      const pathCheck = paths.some(path => path === req.path);
      pathCheck ? next() : this.authenticateJWT(req, res, next);
    };
  };
}

export default new JWT();
