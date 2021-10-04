import { RouteConfig } from "../Common/common.route.config";
import { Application } from "express";
import OrderController from "./order.controller";
export class OrderRoutes extends RouteConfig {
  constructor(app: Application) {
    super(app, "OrderRoutes");
  }

  configureRoutes() {
    this.app.route(`/api/order`).post(OrderController.postOrder);
    this.app.route(`/api/permit`).post(OrderController.postPermit);

    return this.app;
  }
}