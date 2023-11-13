import {
  currentActiveController,
  peripheralsAccessible,
} from "../constants/devices.js";

export const mainView = (function () {
  /**
   * Responsible for loading the supported devices in a dropdown list.
   *
   * @param {Function} showDevice The callback function to be executed
   */
  function listAccessibleDevices(showDevice) {
    for (const peripheral of peripheralsAccessible) {
      const peripheralsHolder = document.getElementById("peripherals-holder");
      const peripheralType = document.createElement("div");
      const dropDownHolder = document.createElement("div");

      peripheralType.setAttribute("class", "label dropdown-title");
      peripheralType.textContent = peripheral.TYPE;
      peripheralsHolder.appendChild(peripheralType);
      dropDownHolder.setAttribute("class", "dropdown-content");
      for (const subPeripheral of peripheral.DETAILS) {
        const element = document.createElement("p");
        element.setAttribute("class", "dropdown-elements");
        element.textContent = subPeripheral.LABEL;
        element.addEventListener("click", () => {
          if (subPeripheral.CONTROLLER != currentActiveController.CONTROLLER) {
            currentActiveController.CONTROLLER?.destroyView();
            currentActiveController.CONTROLLER = subPeripheral.CONTROLLER;
            showDevice(subPeripheral.CONTROLLER);
          }
        });
        dropDownHolder.appendChild(element);
      }
      peripheralsHolder.appendChild(dropDownHolder);
    }
  }

  return {
    listAccessibleDevices,
  };
})();
