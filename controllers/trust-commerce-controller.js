import { TCDriver } from "../drivers/trust-commerce-driver.js";
import { BaseController } from "./base-controller.js";

export class TrustCommerceController extends BaseController {
  constructor() {
    super(TCDriver.getInstance());
  }

  static #TCControllerInstance;

  static getInstance() {
    if (!this.#TCControllerInstance) {
      this.#TCControllerInstance = new this();
    }
    return this.#TCControllerInstance;
  }
}
