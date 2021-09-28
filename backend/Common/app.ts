import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import debug, { IDebugger } from "debug";
import { RouteConfig } from "./common.route.config";
import { UserRoutes } from "../User/user.route.config";
import { AuthRoutes } from "../Auth/auth.route.config";
import JWT from "./middlewares/JWT";

export const debugLog: IDebugger = debug("app");

export const createApp = (): Express => {
  const app: Express = express();
  const routes: Array<RouteConfig> = [];

  app.use(express.json());
  app.use(express.urlencoded());
  app.use(cors());
  app.use(cookieParser());
  app.use(JWT.authenticateJWTExcept("/login", "/signup"));
  app.use(express.static(process.cwd() + "/web-app/build/"));

  if (process.env.DEBUG) {
    process.on("unhandledRejection", function (reason) {
      debugLog("Unhandled Rejection:", reason);
      process.exit(1);
    });
  } else {
  }
  routes.push(new UserRoutes(app));
  routes.push(new AuthRoutes(app));

  routes.forEach((route: RouteConfig) => {
    debugLog(`Routes configured for ${route.getName()}`);
  });

  return app;
}