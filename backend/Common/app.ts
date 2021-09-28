import express, { Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import debug, { IDebugger } from "debug";
import { RouteConfig } from "./common.route.config";
import { OrderRoutes } from "../Order/order.route.config";

export const debugLog: IDebugger = debug("app");

export const createApp = (): Express => {
  const app: Express = express();
  const routes: Array<RouteConfig> = [];

  app.use(express.json());
  app.use(express.urlencoded());
  app.use(cors());
  app.use(cookieParser());

  if (process.env.DEBUG) {
    process.on("unhandledRejection", (reason) => {
      debugLog("Unhandled Rejection:", reason);
      process.exit(1);
    });
  }

  routes.push(new OrderRoutes(app));

  routes.forEach((route: RouteConfig) => {
    debugLog(`Routes configured for ${route.getName()}`);
  });

  return app;
}