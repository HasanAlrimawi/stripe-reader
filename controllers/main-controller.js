import { mainView } from "../views/main-view.js";

document.addEventListener("DOMContentLoaded", () => {
  mainView.listAccessibleDevices(showDevice);
});

/**
 * Calls the wanted device's starting function that renders its view.
 * 
 * @param {Controller} deviceController 
 */
const showDevice = (deviceController) => {
  document.getElementById("device-shown").innerHTML = "";
  deviceController.renderView();
};
