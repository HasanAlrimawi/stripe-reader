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
            currentActiveController.CONTROLLER?.destroy();
            currentActiveController.CONTROLLER = subPeripheral.CONTROLLER;
            showDevice(subPeripheral.CONTROLLER);
          }
        });
        dropDownHolder.appendChild(element);
      }
      peripheralsHolder.appendChild(dropDownHolder);
    }
  }

  function payForm() {
    return `<div class="card-vertical" id="device-view">
    <section class="card-form">
          <span class="subtitle">Payment Details</span>
          <div class="label-input-wrapper">
            <label for="payment-amount">Amount</label>
            <input type="text" placeholder="Enter transaction amount" name="payment-amount" id="payment-amount" />
          </div>
          <div class="label-input-wrapper" id="payment-form-buttons">
            <input
              class="button"
              type="button"
              value="Pay"
              id="pay-btn"
            />
          </div>
            <div class="label-input-wrapper">
              <label for="payment-status">Payment Status</label>
              <textarea
                type="text"
                disabled="true"
                id="payment-status"
                value="No payment submitted"
                rows="3"
                cols="20"
              >
              </textarea>
        </section>
        </div>`;
  }

  return {
    listAccessibleDevices,
    payForm,
  };
})();
