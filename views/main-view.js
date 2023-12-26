import { HTML_ELEMENTS_IDS } from "../constants/elements-ids.js";
import {
  CURRENT_ACTIVE_DRIVER,
  PAYMENT_GATEWAYS,
} from "../constants/payment-gateways-registered.js";
import { AUTHENTICATION_METHODS_FORMS } from "../ui-components/authentication-forms.js";
import { MULTIPLE_STEPS_FORM_GENERATION } from "../ui-components/multiple-steps-forms.js";
import { READER_SELECTION_METHODS_FORMS } from "../ui-components/reader-selection-forms.js";

export const mainView = (function () {
  let darkThemeSelected_ = false;

  /**
   * Responsible for loading the supported devices in a dropdown list.
   *
   * @param {Function} showPaymentGateway The callback function to be executed
   *     in order to show the payment gateway chosen
   */
  function listPaymentGatewaysinDropdown(showPaymentGateway) {
    const dropDownContainer = document.getElementById("dropdown-holder-div");
    const dropDownHead = document.createElement("div");
    const dropDownBody = document.createElement("div");
    const dropDownTitle = document.createElement("span");
    const caret = document.createElement("div");

    dropDownHead.setAttribute("class", "dropdown-head");
    dropDownTitle.textContent = "Select gateway";
    dropDownTitle.setAttribute("id", "drop-down-title");
    caret.setAttribute("class", "caret");
    dropDownHead.appendChild(dropDownTitle);
    dropDownHead.appendChild(caret);
    dropDownContainer.appendChild(dropDownHead);
    dropDownBody.setAttribute("class", "dropdown-content");

    for (const gateway of PAYMENT_GATEWAYS) {
      const element = document.createElement("p");
      element.setAttribute("class", "dropdown-elements");
      element.textContent = gateway.LABEL;
      element.addEventListener("click", () => {
        if (gateway.DRIVER != CURRENT_ACTIVE_DRIVER.DRIVER) {
          clearSettingsMenu();
          clearPaymentGatewaySpace();
          updateTitle(gateway.LABEL);
          CURRENT_ACTIVE_DRIVER.DRIVER = gateway.DRIVER;
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
   * @returns {HTMLElement} The form element that takes user's input to make
   *     transaction
   */
  function payForm() {
    const form = document.createElement("form");
    const span = document.createElement("span");
    const amountWrapper = document.createElement("div");
    const amountLabel = document.createElement("label");
    const amountInput = document.createElement("input");
    const buttonWrapper = document.createElement("div");
    const payButton = document.createElement("input");
    const statusWrapper = document.createElement("div");
    const statusLabel = document.createElement("label");
    const statusTextarea = document.createElement("textarea");

    form.classList.add("card-form");

    span.classList.add("subtitle");
    span.textContent = "Payment Details";
    form.appendChild(span);

    amountWrapper.classList.add("label-input-wrapper");

    amountLabel.setAttribute("for", "payment-amount");
    amountLabel.textContent = "Amount";

    amountInput.setAttribute("type", "text");
    amountInput.setAttribute("placeholder", "Enter transaction amount");
    amountInput.setAttribute("name", "payment-amount");
    amountInput.setAttribute("id", "payment-amount");
    amountInput.setAttribute("required", true);

    amountWrapper.appendChild(amountLabel);
    amountWrapper.appendChild(amountInput);
    form.appendChild(amountWrapper);

    buttonWrapper.classList.add("label-input-wrapper");

    payButton.classList.add("button");
    payButton.setAttribute("type", "submit");
    payButton.setAttribute("value", "Pay");
    payButton.setAttribute("id", "pay-btn");

    buttonWrapper.appendChild(payButton);
    form.appendChild(buttonWrapper);

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
    form.appendChild(statusWrapper);

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      payMethod();
    });

    return form;
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

  document
    .getElementById(HTML_ELEMENTS_IDS.TOGGLE_THEME_ICON)
    .addEventListener("click", changeTheme);

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
      newSettingHolder.addEventListener("click", () => {
        const modalContent = setting.callbackFunction();
        makeModal(modalContent);
      });
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
    modal.setAttribute("id", HTML_ELEMENTS_IDS.CURRENT_MODAL_SHOWN);
    modalContent.setAttribute("id", "modal-content");
    closeButton.setAttribute("class", "close");
    closeButton.innerHTML = `&times;`;
    modalContent.appendChild(closeButton);
    modalContent.appendChild(modalMainContent);
    modal.appendChild(modalContent);
    document
      .getElementById(HTML_ELEMENTS_IDS.PAYMENT_GATEWAY_VIEW_SPACE)
      .appendChild(modal);

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
   * Responsible for appending the pay form into the webpage.
   */
  const renderPayForm = () => {
    document
      .getElementById(HTML_ELEMENTS_IDS.PAYMENT_GATEWAY_VIEW_SPACE)
      .insertAdjacentElement("beforeend", payForm());
  };

  /**
   * Responsible for making the payment using the driver's pay method, and shows
   *     the result for the user on the payment form.
   */
  const payMethod = async () => {
    const paymentStatus = document.getElementById("payment-status");
    const payButton = document.getElementById("pay-btn");
    const amount = document.getElementById("payment-amount").value;
    payButton.setAttribute("disabled", true);

    if (isNaN(amount) || !amount) {
      paymentStatus.value = "Make sure to enter a numeric amount";
      payButton.removeAttribute("disabled");
      return;
    }
    paymentStatus.value = "pending...";
    let message = "Transaction Unsuccessful";

    try {
      const transactionResponse = await CURRENT_ACTIVE_DRIVER.DRIVER.pay(
        amount
      );
      payButton.removeAttribute("disabled");
      if (transactionResponse?.error) {
        message = `Transaction failure\nCause: ${transactionResponse.error}.`;
      } else {
        message = `Transaction is ${transactionResponse}`;
      }
    } catch (faultyTransaction) {
      payButton.removeAttribute("disabled");

      if (faultyTransaction == "TypeError: Failed to fetch") {
        paymentStatus.value =
          "Make sure you're connected to internet then try again.";
        return;
      }
      message = faultyTransaction;
    }
    paymentStatus.value = message;
  };

  /**
   * Responsible for showing the available payment gateways for user to choose.
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

    for (const gateway of PAYMENT_GATEWAYS) {
      const divGateway = document.createElement("div");
      divGateway.classList.add("main-menu-selection");
      divGateway.textContent = gateway.LABEL;
      divGateway.addEventListener("click", () => {
        clearSettingsMenu();
        clearPaymentGatewaySpace();
        CURRENT_ACTIVE_DRIVER.DRIVER = gateway.DRIVER;
        updateTitle(gateway.LABEL);
        showPaymentGateway(gateway.DRIVER);
      });
      divWrapper.appendChild(divGateway);
    }

    section.appendChild(span);
    section.appendChild(divWrapper);

    document
      .getElementById(HTML_ELEMENTS_IDS.PAYMENT_GATEWAY_VIEW_SPACE)
      .appendChild(section);
  };

  /**
   * Responsible for updating the title of the header and gateways'
   *     dropdown list
   *
   * @param {string} title The new title to be set
   */
  function updateTitle(title) {
    document.getElementById("title").textContent = title;
    document.getElementById("drop-down-title").textContent = title;
  }

  /**
   * Clears the space where the interaction with the payment gateway forms
   *     and payment will take place.
   */
  function clearPaymentGatewaySpace() {
    document.getElementById(
      HTML_ELEMENTS_IDS.PAYMENT_GATEWAY_VIEW_SPACE
    ).innerHTML = "";
  }

  /**
   * Shows the multi-step form based on the currently active driver.
   */
  function renderMultiStepForm() {
    document
      .getElementById(HTML_ELEMENTS_IDS.PAYMENT_GATEWAY_VIEW_SPACE)
      .insertAdjacentElement(
        "beforeend",
        MULTIPLE_STEPS_FORM_GENERATION[
          CURRENT_ACTIVE_DRIVER.DRIVER.getMultipleStepsFormMethod()
        ](
          AUTHENTICATION_METHODS_FORMS[
            CURRENT_ACTIVE_DRIVER.DRIVER.getAuthenticationMethod()
          ](
            CURRENT_ACTIVE_DRIVER.DRIVER.saveAuthenticationDetails,
            CURRENT_ACTIVE_DRIVER.DRIVER.getAuthenticationUnderUse()
          ),
          READER_SELECTION_METHODS_FORMS[
            CURRENT_ACTIVE_DRIVER.DRIVER.getReaderChoosingMethod()
          ](
            CURRENT_ACTIVE_DRIVER.DRIVER.saveReader,
            CURRENT_ACTIVE_DRIVER.DRIVER.getReaderUnderUse()
          ),
          renderPayForm
        )
      );
  }

  return {
    listPaymentGatewaysinDropdown,
    changeTheme,
    addSettings,
    makeModal,
    listPaymentGateways,
    renderPayForm,
    renderMultiStepForm,
  };
})();
