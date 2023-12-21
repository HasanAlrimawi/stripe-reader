import {
  currentActiveDriver,
  paymentGateways,
} from "../constants/payment-gateways.js";

export const mainView = (function () {
  let darkThemeSelected_ = false;

  /**
   * Responsible for loading the supported devices in a dropdown list.
   *
   * @param {Function} showPaymentGateway The callback function to be executed
   *     in order to show the payment gateway chosen
   */
  function listAccessibleDevices(showPaymentGateway) {
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
        if (gateway.DRIVER != currentActiveDriver.DRIVER) {
          clearSettingsMenu();
          dropDownTitle.textContent = gateway.LABEL;
          // currentActiveController.CONTROLLER?.destroy();
          currentActiveDriver.DRIVER = gateway.DRIVER;
          showPaymentGateway(gateway.DRIVER);
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
  function payForm(payMethod) {
    const section = document.createElement("section");
    const span = document.createElement("span");
    const amountWrapper = document.createElement("div");
    const amountLabel = document.createElement("label");
    const amountInput = document.createElement("input");
    const buttonWrapper = document.createElement("div");
    const payButton = document.createElement("input");
    const statusWrapper = document.createElement("div");
    const statusLabel = document.createElement("label");
    const statusTextarea = document.createElement("textarea");

    section.classList.add("card-form");

    span.classList.add("subtitle");
    span.textContent = "Payment Details";
    section.appendChild(span);

    amountWrapper.classList.add("label-input-wrapper");

    amountLabel.setAttribute("for", "payment-amount");
    amountLabel.textContent = "Amount";

    amountInput.setAttribute("type", "text");
    amountInput.setAttribute("placeholder", "Enter transaction amount");
    amountInput.setAttribute("name", "payment-amount");
    amountInput.setAttribute("id", "payment-amount");

    amountWrapper.appendChild(amountLabel);
    amountWrapper.appendChild(amountInput);
    section.appendChild(amountWrapper);

    buttonWrapper.classList.add("label-input-wrapper");

    payButton.classList.add("button");
    payButton.setAttribute("type", "button");
    payButton.setAttribute("value", "Pay");
    payButton.setAttribute("id", "pay-btn");
    payButton.addEventListener("click", payMethod);

    buttonWrapper.appendChild(payButton);
    section.appendChild(buttonWrapper);

    statusWrapper.classList.add("label-input-wrapper");

    statusLabel.setAttribute("for", "payment-status");
    statusLabel.textContent = "Payment Status";

    statusTextarea.setAttribute("disabled", "true");
    statusTextarea.setAttribute("id", "payment-status");
    statusTextarea.setAttribute("rows", "4");
    statusTextarea.setAttribute("cols", "28");
    statusTextarea.textContent = "No payment submitted";

    statusWrapper.appendChild(statusLabel);
    statusWrapper.appendChild(statusTextarea);
    section.appendChild(statusWrapper);

    return section;
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

  /**
   * @typedef {Object} Setting
   * @property {string} name
   * @property {function} callbackFunction
   */

  /**
   * Adds new settings of to the settings menu.
   *
   * @param {Array<Setting>} newSettings
   */
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

  /**
   * Clears the settings menu.
   */
  const clearSettingsMenu = () => {
    document.getElementsByClassName("settings-dropdown-content")[0].innerHTML =
      "";
  };

  /**
   * Creates modal which is a popup window for specific need.
   *
   * @param {HTMLElement} modalMainContent Represents the main content of the
   *     modal
   */
  const makeModal = (modalMainContent) => {
    const modal = document.createElement("div");
    const modalContent = document.createElement("div");
    const closeButton = document.createElement("div");
    modal.setAttribute("class", "modal");
    modal.setAttribute("id", "current-modal");
    modalContent.setAttribute("id", "modal-content");
    closeButton.setAttribute("class", "close");
    closeButton.innerHTML = `&times;`;
    modalContent.appendChild(closeButton);
    modalContent.appendChild(modalMainContent);
    modal.appendChild(modalContent);
    document.getElementById("payment-gateway-space").appendChild(modal);

    closeButton.addEventListener("click", () => {
      modal.remove();
    });

    window.onclick = function (event) {
      if (event.target == modal) {
        modal.remove();
      }
    };
  };

  /**
   * Responsible of showing the available payment gateways for user to choose.
   *
   * @param {function} showPaymentGateway The callback function to be executed
   *     in order to show the payment gateway chosen
   */
  const listPaymentGateways = (showPaymentGateway) => {
    const section = document.createElement("section");
    section.classList.add("card-form");

    const span = document.createElement("span");
    span.classList.add("subtitle");
    span.textContent = "Select payment gateway";

    const divWrapper = document.createElement("div");
    divWrapper.classList.add("wrapper-horizontal");

    for (const gateway of paymentGateways) {
      const divGateway = document.createElement("div");
      divGateway.classList.add("main-menu-selection");
      divGateway.textContent = gateway.LABEL;
      divGateway.addEventListener("click", () => {
        clearSettingsMenu();
        currentActiveDriver.DRIVER = gateway.DRIVER;
        showPaymentGateway(gateway.DRIVER);
      });
      divWrapper.appendChild(divGateway);
    }

    section.appendChild(span);
    section.appendChild(divWrapper);

    document.getElementById("payment-gateway-space").appendChild(section);
  };

  return {
    listAccessibleDevices,
    payForm,
    changeTheme,
    addSettings,
    makeModal,
    listPaymentGateways,
  };
})();
