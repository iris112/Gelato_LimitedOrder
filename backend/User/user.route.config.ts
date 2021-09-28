import { RouteConfig } from "../Common/common.route.config";
import { Application } from "express";
import UserController from "./user.controller";
export class UserRoutes extends RouteConfig {
  constructor(app: Application) {
    super(app, "UserRoutes");
  }

  configureRoutes() {
    this.app.route(`/user`).get(UserController.getUser);

    return this.app;
  }
}