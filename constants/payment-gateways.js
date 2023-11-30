import { StripeController } from "../stripe/stripe-controller.js";
import { TCController } from "../trust-commerce/TC-controller.js";

/**
 * @fileoverview This file contains the list of payment gateways supported
 * by the application listed with their controllers for ease of adding the
 * gateway functionality to the application
 */

/**
 * Wraps the peripherals accessible within an array to ease access
 * and prevent typos.
 */
export const paymentGateways = [
  Object.freeze({
    LABEL: "Stripe",
    CONTROLLER: StripeController.getInstance(),
  }),

  // Object.freeze({
  //   LABEL: "Trust Commerce",
  //   CONTROLLER: TCController.getInstance(),
  // }),
];

/**
 * Represents the gateway's controller that is in charge.
 */
export const currentActiveController = {
  CONTROLLER: undefined,
};
