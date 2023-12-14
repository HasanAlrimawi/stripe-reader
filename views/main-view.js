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
    const dropDownContainer = document.getElementById("dropdown-holder-div");
    const dropDownHead = document.createElement("div");
    const dropDownBody = document.createElement("div");
    const dropDownTitle = document.createElement("span");
    const caret = document.createElement("div");

    dropDownHead.setAttribute("class", "dropdown-head");
    dropDownTitle.textContent = "Select gateway";
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
          clearSettingsMenu();
          dropDownTitle.textContent = gateway.LABEL;
          currentActiveController.CONTROLLER?.destroy();
          currentActiveController.CONTROLLER = gateway.CONTROLLER;
          showDevice(gateway.CONTROLLER);
        }
      });
      dropDownBody.appendChild(element);
    }
    dropDownContainer.appendChild(dropDownBody);
  }

  /**
   * Returns the payment form that permits defining amount of transaction
   *     and payment button with payment status text area.
   *
   * @returns {string} The form HTML
   */
  function payForm() {
    return `
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
                rows="4"
                cols="28"
              >
              </textarea>
        </section>`;
  }

  /**
   * toggles the theme selected.
   */
  const changeTheme = () => {
    darkThemeSelected_ = !darkThemeSelected_;
    if (darkThemeSelected_) {
      document.documentElement.setAttribute("page-theme", "dark");
    } else {
      document.documentElement.setAttribute("page-theme", "");
    }
  };

  const addSettings = (newSettings) => {
    const settingsContentWrapper = document.getElementsByClassName(
      "settings-dropdown-content"
    )[0];
    newSettings.forEach((setting) => {
      const newSettingHolder = document.createElement("p");
      newSettingHolder.classList.add("settings-dropdown-elements");
      newSettingHolder.textContent = setting.name;
      newSettingHolder.addEventListener("click", setting.callbackFunction);
      settingsContentWrapper.appendChild(newSettingHolder);
    });
  };

  const clearSettingsMenu = () => {
    document.getElementsByClassName("settings-dropdown-content")[0].innerHTML =
      "";
  };

  const makeModal = (makeElement) => {
    const modal = document.createElement("div");
    const modalContent = document.createElement("div");
    const closeButton = document.createElement("div");
    modal.setAttribute("class", "modal");
    modalContent.setAttribute("id", "modal-content");
    closeButton.setAttribute("class", "close");
    closeButton.innerHTML = `&times;`;
    modalContent.appendChild(closeButton);
    modalContent.appendChild(makeElement);
    modal.appendChild(modalContent);
    document.getElementById("device-space").appendChild(modal);

    closeButton.addEventListener("click", () => {
      modal.remove();
    });

    window.onclick = function (event) {
      if (event.target == modal) {
        modal.remove();
      }
    };
  };

  return {
    listAccessibleDevices,
    payForm,
    changeTheme,
    addSettings,
    makeModal,
  };
})();
