import { BaseController } from "../controllers/base-controller.js";
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
    this.#onStart();

    TCReaderView.addPresetsButtons();
    document.getElementById("title").textContent = "Trust Commerce";
    document
      .getElementById("add-reader-button")
      .addEventListener("click", () => {
        document
          .getElementById("device-space")
          .insertAdjacentElement(
            "beforeend",
            TCReaderView.defineReaderDeviceCard(this.#saveDeviceDetails)
          );
      });

    document
      .getElementById("set-account-credentials-button")
      .addEventListener("click", () => {
        document
          .getElementById("device-space")
          .insertAdjacentElement(
            "beforeend",
            TCReaderView.accountCredentialsCard(this.#saveAccountCredentials)
          );
      });

    document.getElementById("pay-btn").addEventListener("click", this.#pay);
    // document
    //   .getElementById("payment-form-buttons")
    //   .insertAdjacentElement("beforeend", TCReaderView.createCheckButton());
    // document
    //   .getElementById("check-pay")
    //   .addEventListener("click", this.mockCheckTransaction);
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
    document.getElementById("add-reader-button").remove();
    document.getElementById("set-account-credentials-button").remove();
    document.getElementById("title").textContent = "Peripherals";
  };

  /**
   * Responsible for saving account credentials that were filled in the
   *     corresponding form in local storage to use for making transactions.
   *
   * @param {Event} event represents the event of submitting form
   */
  #saveAccountCredentials = (event) => {
    event.preventDefault();
    const customerId = document.getElementById("customer-id").value;
    const password = document.getElementById("password").value;
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
  #saveDeviceDetails = (event) => {
    event.preventDefault();
    const deviceName = document.getElementById("device-model").value;
    TCReadersModel.setReaderUsed(deviceName);
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

    // if there isn't a defined reader for transaction or account credentials
    //     not specified then payment can't be done
    if (
      TCReadersModel.getAccountCredentials() === undefined ||
      TCReadersModel.getReaderUsed() === undefined
    ) {
      paymentStatus.value =
        "Make sure to set account credentials and device details.";
      payButton.removeAttribute("disabled");
      return;
    }

    if (isNaN(amount) || !amount) {
      paymentStatus.value = "Make sure to enter a numeric amount";
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
      message = `Transaction is ${transactionResponse.cloudpaystatus}`;
      console.log(transactionResponse);
    } catch (transactionResult) {
      if (transactionResult.message) {
        message = transactionResult.message;
      } else {
        message = `${
          transactionResult.devicestatus
            ? `Device status: ${transactionResult.devicestatus}.\nMake sure device is connected and available.`
            : `Transaction result: ${transactionResult.cloudpaystatus}.`
        }`;
      }
      console.log(transactionResult);
    }
    payButton.removeAttribute("disabled");
    console.log(message);
    paymentStatus.value = message;
  };
}
