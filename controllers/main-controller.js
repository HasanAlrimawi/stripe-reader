import { mainView } from "../views/main-view.js";
import { PAYMENT_GATEWAYS } from "../constants/payment-gateways-registered.js";

document.addEventListener("DOMContentLoaded", () => {
  const paymentGatewaysLabels = [];
  PAYMENT_GATEWAYS.forEach((driver) =>
    paymentGatewaysLabels.push(driver.LABEL)
  );
  mainView.listPaymentGateways(paymentGatewaysLabels, showPaymentGateway);
  mainView.listPaymentGatewaysinDropdown(
    paymentGatewaysLabels,
    showPaymentGateway
  );
});

/** Represents the payment gateways controller that is currently active */
let CURRENT_ACTIVE_CONTROLLER = undefined;

/**
 * Responsible for calling the needed controller with the needed payment
 *     gateway driver initiated in it.
 *
 * @param {String} paymentGatewaySelected Represents the label of the driver
 *     selected
 */
const showPaymentGateway = (paymentGatewaySelected) => {
  if (paymentGatewaySelected === CURRENT_ACTIVE_CONTROLLER?.LABEL) {
    return;
  }

  CURRENT_ACTIVE_CONTROLLER = PAYMENT_GATEWAYS.filter(
    (gateway) => gateway.LABEL === paymentGatewaySelected
  )[0];

  mainView.clearSettingsMenu();
  mainView.clearPaymentGatewaySpace();
  mainView.updateTitle(CURRENT_ACTIVE_CONTROLLER.LABEL);

  CURRENT_ACTIVE_CONTROLLER.CONTROLLER.start();
};
