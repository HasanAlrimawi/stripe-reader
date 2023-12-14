import { TCConnectionDetails } from "../constants/TC-connection-details.js";
import { BaseController } from "../controllers/base-controller.js";
import { mainView } from "../views/main-view.js";
import { TCDriver } from "./TC-driver.js";
import { TCReadersModel } from "./TC-model.js";
import { TCReaderView } from "./TC-view.js";

export class TCController extends BaseController {
  static tcControllerInstance_;

  static getInstance() {
    if (!this.stripeControllerInstance_) {
      this.stripeControllerInstance_ = new this();
    }
    return this.stripeControllerInstance_;
  }

  /** Trust Commerce driver instance that provides the functionality for
   *     making transactions.
   */
  communicatorTc = TCDriver.getInstance();

  /**
   * Responsible for registering event listener and rendering the device's view
   *     whether by adding or editing the main view
   */
  renderView = () => {
    const renderPayForm = () => {
      const TCSettings = [
        {
          name: "Change credentials",
          callbackFunction: this.#updateAccountCredentials,
        },
        {
          name: "Change reader device",
          callbackFunction: this.#changeReaderDevice,
        },
      ];
      mainView.addSettings(TCSettings);
      document
        .getElementById("device-space")
        .insertAdjacentHTML("beforeend", mainView.payForm());
      document.getElementById("pay-btn").addEventListener("click", this.#pay);
    };

    if (
      localStorage.getItem(TCConnectionDetails.TC_ACCOUNT_LOCAL_STORAGE_KEY) &&
      localStorage.getItem(
        TCConnectionDetails.TC_READER_SAVED_LOCAL_STORAGE_KEY
      )
    ) {
      this.#onStart();
      renderPayForm();
    } else {
      document
        .getElementById("device-space")
        .insertAdjacentElement(
          "beforeend",
          TCReaderView.multipleStepsSetUpForm(
            this.#saveAccountCredentials,
            this.#saveReaderDetails,
            renderPayForm
          )
        );
    }
    // TCReaderView.addPresetsButtons();
    document.getElementById("title").textContent = "Trust Commerce";
    // document
    //   .getElementById("add-reader-button")
    //   .addEventListener("click", () => {
    //     if (!document.getElementById("payment-device-form")) {
    //       document
    //         .getElementById("device-space")
    //         .insertAdjacentElement(
    //           "beforeend",
    //           TCReaderView.defineReaderDeviceCard(this.#saveReaderDetails)
    //         );
    //     }
    //   });

    // document
    //   .getElementById("set-account-credentials-button")
    //   .addEventListener("click", () => {
    //     if (!document.getElementById("account-credentials-form")) {
    //       document
    //         .getElementById("device-space")
    //         .insertAdjacentElement(
    //           "beforeend",
    //           TCReaderView.accountCredentialsCard(this.#saveAccountCredentials)
    //         );
    //     }
    //   });
  };

  /**
   * Handles the needed setup for the application to act as expected.
   *
   * Responsible for any needed subscriptions, scripts loading and preset
   *     configuration at the very start of device viewing.
   */
  #onStart = () => {
    TCReadersModel.loadConfigFromLocalStorage();
  };

  /**
   * Responsible for unsubscribing and reverting changes made to the main view
   *      or any needed action in order to get ready for being removed.
   */
  destroy = () => {
    document.getElementById("title").textContent = "Payment Gateways";
  };

  /**
   * Responsible for saving account credentials that were filled in the
   *     corresponding form in local storage to use for making transactions.
   *
   * @param {Event} event represents the event of submitting form
   */
  #saveAccountCredentials = (customerId, password) => {
    TCReadersModel.setAccountCredentials({
      customerId: customerId,
      password: password,
    });
  };

  /**
   * Responsible for saving device details that were filled in the
   *     corresponding form in local storage to use for making transactions.
   *
   * @param {Event} event represents the event of submitting form
   */
  #saveReaderDetails = (readerName) => {
    TCReadersModel.setReaderUsed(readerName);
  };

  /**
   * Responsible for making the transaction from taking the amount to viewing
   *     meaningfyl messages for the application user.
   */
  #pay = async () => {
    const paymentStatus = document.getElementById("payment-status");
    const payButton = document.getElementById("pay-btn");
    const amount = document.getElementById("payment-amount").value;
    payButton.setAttribute("disabled", true);
    const amountAndPresetsCheck = this.#checkPresetsAndAmount(amount);

    if (amountAndPresetsCheck?.error) {
      paymentStatus.value = amountAndPresetsCheck.error;
      payButton.removeAttribute("disabled");
      return;
    }
    paymentStatus.value = "pending...";
    let message = "Transaction Unsuccessful";

    try {
      const transactionResponse = await this.communicatorTc.pay(
        TCReadersModel.getAccountCredentials().customerId,
        TCReadersModel.getAccountCredentials().password,
        amount,
        TCReadersModel.getReaderUsed()
      );
      payButton.removeAttribute("disabled");
      message = `Transaction is ${
        transactionResponse.status
          ? transactionResponse.status
          : transactionResponse.cloudpaystatus
      }`;
    } catch (faultyTransaction) {
      payButton.removeAttribute("disabled");

      if (faultyTransaction == "TypeError: Failed to fetch") {
        paymentStatus.value =
          "Make sure you're connected to internet then try again.";
        return;
      }
      message = `${
        faultyTransaction.devicestatus
          ? `Device status: ${faultyTransaction.description}.\nMake sure device is connected and available.`
          : `Transaction result: ${
              faultyTransaction.message
                ? faultyTransaction.message
                : faultyTransaction.cloudpaystatus
            }.`
      }`;
    }
    paymentStatus.value = message;
  };

  /**
   * Checks if there is a defined reader for transaction or account credentials
   *     not specified or if the amount entered isn't numeric then payment
   *     can't be done and returns error
   *
   * @param {number} amount
   * @returns {Object} An object with error attribute if violation found
   */
  #checkPresetsAndAmount = (amount) => {
    // if there isn't a defined reader for transaction or account credentials
    //     not specified then payment can't be done
    if (
      TCReadersModel.getAccountCredentials() === undefined ||
      TCReadersModel.getReaderUsed() === undefined
    ) {
      return {
        error: "Make sure to set account credentials and device details first.",
      };
    }

    if (isNaN(amount) || !amount) {
      return {
        error: "Make sure to enter a numeric amount",
      };
    }
    return;
  };

  #updateAccountCredentials = () => {
    const accountCredentialsForm = TCReaderView.accountCredentialsCard(
      this.#saveAccountCredentials
    );
    mainView.makeModal(accountCredentialsForm);
    // console.log("update credentials");
  };

  #changeReaderDevice = () => {
    const setReaderForm = TCReaderView.defineReaderDeviceCard(
      this.#saveReaderDetails
    );
    mainView.makeModal(setReaderForm);
    console.log("change reader device");
  };
}
