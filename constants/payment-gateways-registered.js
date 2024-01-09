import { DefaultController } from "../controllers/default-controller.js";
import { StripeDriver } from "../drivers/stripe-driver.js";
import { TCDriver } from "../drivers/trust-commerce-driver.js";

/**
 * @fileoverview This file contains the list of payment gateways supported
 * by the application listed with their controllers for ease of adding the
 * gateway functionality to the application
 */

/**
 * Wraps the payment gateways accessible within an array to ease access
 * and prevent typos.
 */
export const PAYMENT_GATEWAYS = [
  Object.freeze({
    LABEL: "Stripe",
    CONTROLLER: new DefaultController(StripeDriver.getInstance()),
  }),

  Object.freeze({
    LABEL: "Trust Commerce",
    CONTROLLER: new DefaultController(TCDriver.getInstance()),
  }),
];
