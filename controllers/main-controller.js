import { mainView } from "../views/main-view.js";

document.addEventListener("DOMContentLoaded", () => {
  mainView.listPaymentGateways(showPaymentGateway);
  mainView.listAccessibleDevices(showPaymentGateway);
  document
    .getElementById("theme-icon")
    .addEventListener("click", mainView.changeTheme);
});

/**
 * Calls the wanted device's starting function that renders its view.
 *
 * @param {Controller} deviceController
 */
const showPaymentGateway = (deviceController) => {
  document.getElementById("device-space").innerHTML = "";
  deviceController.renderView();
};
