import {
  currentActiveController,
  paymentGateways,
} from "../constants/payment-gateways.js";

export const mainView = (function () {
  let darkThemeSelected_ = false;

  /**
   * Responsible for loading the supported devices in a dropdown list.
   *
   * @param {Function} showDevice The callback function to be executed
   */
  function listAccessibleDevices(showDevice) {
    // for (const gateway of paymentGateways) {
    const dropDownContainer = document.getElementById("dropdown-holder-div");
    const dropDownHead = document.createElement("div");
    const dropDownBody = document.createElement("div");
    const dropDownTitle = document.createElement("span");
    const caret = document.createElement("div");

    dropDownHead.setAttribute("class", "dropdown-head");
    dropDownTitle.textContent = "Select payment gateway";
    caret.setAttribute("class", "caret");
    dropDownHead.appendChild(dropDownTitle);
    dropDownHead.appendChild(caret);
    dropDownContainer.appendChild(dropDownHead);
    dropDownBody.setAttribute("class", "dropdown-content");
    for (const gateway of paymentGateways) {
      const element = document.createElement("p");
      element.setAttribute("class", "dropdown-elements");
      element.textContent = gateway.LABEL;
      element.addEventListener("click", () => {
        if (gateway.CONTROLLER != currentActiveController.CONTROLLER) {
          currentActiveController.CONTROLLER?.destroy();
          currentActiveController.CONTROLLER = gateway.CONTROLLER;
          showDevice(gateway.CONTROLLER);
        }
      });
      dropDownBody.appendChild(element);
    }
    dropDownContainer.appendChild(dropDownBody);
    // }
  }

  /**
   * Returns the payment form that permits defining amount of transaction
   *     and payment button with payment status text area.
   *
   * @returns {string} The form HTML
   */
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

  /**
   * toggles the theme selected.
   */
  const changeTheme = function () {
    darkThemeSelected_ = !darkThemeSelected_;
    if (darkThemeSelected_) {
      document.documentElement.setAttribute("page-theme", "dark");
    } else {
      document.documentElement.setAttribute("page-theme", "");
    }
  };

  return {
    listAccessibleDevices,
    payForm,
    changeTheme,
  };
})();
