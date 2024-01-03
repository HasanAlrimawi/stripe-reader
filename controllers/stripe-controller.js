import { StripeDriver } from "../drivers/stripe-driver.js";
import { BaseController } from "./base-controller.js";

export class StripeController extends BaseController {
  constructor() {
    super(StripeDriver.getInstance());
  }

  static #stripeControllerInstance;

  static getInstance() {
    if (!this.#stripeControllerInstance) {
      this.#stripeControllerInstance = new this();
    }
    return this.#stripeControllerInstance;
  }
}
