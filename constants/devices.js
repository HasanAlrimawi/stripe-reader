import { stripeController } from "../controllers/stripe-controller.js";

/**
 * @fileoverview This file contains the list of devices supported by the
 * application listed with their controllers for ease of adding the
 * device functionality, and includes ease of access to the controller
 * currently in use by application.
 */

/**
 * Wraps the peripherals accessible within an array to ease access
 * and prevent typos.
 */
export const peripheralsAccessible = [
  {
    TYPE: "Card Reader",
    DETAILS: [
      Object.freeze({
        LABEL: "stripe",
        CONTROLLER: stripeController,
      }),
      Object.freeze({
        LABEL: "trust commerce",
        //CONTROLLER: ,
      }),
    ],
  },
];

/**
 * Represents the device's controller that is in charge.
 */
export const currentActiveController = {
  CONTROLLER: undefined,
};
