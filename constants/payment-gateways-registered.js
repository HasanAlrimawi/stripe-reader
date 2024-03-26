import { DefaultController } from "../controllers/default-controller.js";
import { SerialBasedController } from "../controllers/serial-based-controller.js";
import { PaxIM30SerialDriver } from "../drivers/pax-im30-serial-device-driver.js";
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

  Object.freeze({
    LABEL: "Heartland - PAX",
    CONTROLLER: new SerialBasedController(new PaxIM30SerialDriver()),
  }),
];
