import { StripeDriver } from "../drivers/stripe-driver.js";
import { TCDriver } from "../drivers/trust-commerce-driver.js";

/**
 * @fileoverview This file contains the list of payment gateways supported
 * by the application listed with their drivers for ease of adding the
 * gateway functionality to the application
 */

/**
 * Wraps the drivers accessible within an array to ease access
 * and prevent typos.
 */
export const PAYMENT_GATEWAYS = [
  Object.freeze({
    LABEL: "Stripe",
    DRIVER: StripeDriver.getInstance(),
  }),

  Object.freeze({
    LABEL: "Trust Commerce",
    DRIVER: TCDriver.getInstance(),
  }),
];
