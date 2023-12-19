import { stripeConnectionDetails } from "../constants/stripe-connection-details.js";
import { stripeReaderView } from "./stripe-view.js";
import { stripeReadersModel } from "./stripe-readers-model.js";
import { StripeDriver } from "./stripe-driver.js";
import { BaseController } from "../controllers/base-controller.js";
import { mainView } from "../views/main-view.js";

export class StripeController extends BaseController {
  static stripeControllerInstance_;

  static getInstance() {
    if (!this.stripeControllerInstance_) {
      this.stripeControllerInstance_ = new this();
    }
    return this.stripeControllerInstance_;
  }

  /** Instance of stripe's driver to reach its capabilties */
  communicator = StripeDriver.getInstance();

  /**
   * Handles the rendering of the stripe reader view.
   *
   * Takes care of showing the stripe's view, and initiating its functionality
   *     from subscriptions to event listeners to scripts loading.
   */
  renderView = async () => {
    document.getElementById("title").textContent = "Stripe";
    const showView = () => {
      const stripeSettings = [
        {
          name: "Change secret key",
          callbackFunction: this.#showSecretKeyCard,
        },
      ];
      mainView.addSettings(stripeSettings);
      document
        .getElementById("device-space")
        .insertAdjacentHTML("afterbegin", stripeReaderView.deviceHtml());
      document
        .getElementById("device-view")
        .insertAdjacentHTML("beforeend", mainView.payForm());
      const payBtn = document.getElementById("pay-btn");
      payBtn.setAttribute("disabled", true);
      document
        .getElementById("list-readers-btn")
        .addEventListener("click", this.#getListReadersAvailable);
      payBtn.addEventListener("click", this.#pay);
    };
    if (localStorage.getItem(stripeConnectionDetails.LOCAL_STORAGE_API_KEY)) {
      showView();
    } else {
      document
        .getElementById("device-space")
        .insertAdjacentElement(
          "beforeend",
          stripeReaderView.multipleStepsSetUpForm(
            this.#setAPISecretKey,
            showView
          )
        );
    }
  };

  /**
   * Responsible for unsubscribing and reverting changes made to the main view
   *     in order to get ready for being removed.
   */
  destroy = () => {
    document.getElementById("title").textContent = "Payment Gateways";
  };

  /**
   * Handles Showing part of the view which is a form responsible for setting
   *     API secret key.
   */
  #showSecretKeyCard = () => {
    const secretKeyForm = stripeReaderView.createSecretKeySetterCard(
      this.#setAPISecretKey
    );
    if (localStorage.getItem(stripeConnectionDetails.LOCAL_STORAGE_API_KEY)) {
      secretKeyForm
        .querySelector("#secret-key-input")
        .setAttribute("value", stripeConnectionDetails.SECRET_KEY);
    }
    mainView.makeModal(secretKeyForm);
  };

  /**
   * Handles setting the new API secret key and initating new connection
   *     with the stripe terminal using the new key.
   */
  #setAPISecretKey = async (secretKey) => {
    this.#restoreDefault();
    stripeConnectionDetails.SECRET_KEY = secretKey;
    localStorage.setItem(
      stripeConnectionDetails.LOCAL_STORAGE_API_KEY,
      secretKey
    );
  };

  /**
   * Gets the list of readers registered for the used stripe account and
   *     updates the list of readers model and view.
   */
  #getListReadersAvailable = async () => {
    const listReadersButton = document.getElementById("list-readers-btn");
    listReadersButton.setAttribute("disabled", true);
    listReadersButton.value = "Getting readers...";

    try {
      if (stripeReadersModel.getReaderUsed()) {
        this.#stopReader(stripeReadersModel.getReaderUsed());
      }
      stripeReadersModel.setReadersList(undefined);
      const availableReaders = await this.communicator.getReadersAvailable(
        stripeConnectionDetails.SECRET_KEY
      );

      if (availableReaders.error) {
        alert(availableReaders.error.message);
        listReadersButton.removeAttribute("disabled");
        listReadersButton.value = "List readers registered";
        return;
      }
      stripeReadersModel.setReadersList(availableReaders?.data);
      stripeReaderView.createAvailableReadersList(this.#useReader);
      listReadersButton.removeAttribute("disabled");
      listReadersButton.value = "List readers registered";
    } catch (error) {
      if (error == "TypeError: Failed to fetch") {
        error = "Make sure you're connected to internet then try again.";
      }
      listReadersButton.value = "List readers registered";
      listReadersButton.removeAttribute("disabled");
      alert(`${error}`);
    }
  };

  /**
   * Clears the retrieved readers from the model and the view, disables the pay
   *     button when the reader gets disconnected.
   */
  #restoreDefault = () => {
    stripeReadersModel.setReaderUsed(undefined);
    stripeReadersModel.setReadersList(undefined);
    document.getElementById("pay-btn")?.setAttribute("disabled", true);
    const availableReadersHolder = document.getElementById(
      "available-readers-holder"
    );
    availableReadersHolder
      ? (availableReadersHolder.innerHTML = "")
      : undefined;
    document.getElementById("payment-status")?.setAttribute("value", "");
    document.getElementById("payment-amount")?.setAttribute("value", "");
  };

  /**
   * selects the reader to use for transaction saves it
   *     to the reader used model object.
   *
   * @param {string} readerId
   */
  #useReader = (reader) => {
    const connectButton = document.getElementById(reader.id);
    connectButton.setAttribute("value", "stop");
    stripeReadersModel.setReaderUsed(reader);
    document.getElementById("pay-btn").removeAttribute("disabled");
    stripeReaderView.useStopReadersButtons(
      reader,
      "disable",
      this.#useReader,
      this.#stopReader
    );
  };

  /**
   * deselects the previously used reader for transactions.
   *
   * @param {string} readerId
   */
  #stopReader = (reader) => {
    stripeReaderView.useStopReadersButtons(
      reader,
      "enable",
      this.#useReader,
      this.#stopReader
    );
    stripeReadersModel.setReaderUsed(undefined);
    document.getElementById("pay-btn").setAttribute("disabled", true);
  };

  /**
   * Takes the responsibility of the payment flow from intent making to
   *     payment processing and cancelling if needed.
   */
  #pay = async () => {
    const payButton = document.getElementById("pay-btn");
    const paymentStatus = document.getElementById("payment-status");
    const amount = document.getElementById("payment-amount").value;
    paymentStatus.value = "Payment pending...";

    if (isNaN(amount) || !amount) {
      paymentStatus.value = "Make sure to enter a numeric amount";
      return;
    }
    payButton.setAttribute("disabled", true);

    try {
      const result = await this.communicator.pay(
        stripeConnectionDetails.SECRET_KEY,
        amount,
        stripeReadersModel.getReaderUsed().id
      );
      let message = "";

      if (result.last_payment_error) {
        message = `${
          result.last_payment_error.message.split(".")[0]
        }.\nTransaction has been canceled.`;
      } else if (result.status) {
        message = `Transaction amount: ${result.amount / 100}$\nStatus: ${
          result.status
        }`;
      }
      paymentStatus.value = message;
    } catch (error) {
      if (error == "TypeError: Failed to fetch") {
        error = "Transaction canceled: make sure you're connected to internet.";
      }
      const errorPartitioned = error.split(/(?<![0-9])\./);
      error =
        errorPartitioned.length > 1 ? errorPartitioned[0] : errorPartitioned;
      paymentStatus.value = error;
    }
    payButton.removeAttribute("disabled");
  };
}
