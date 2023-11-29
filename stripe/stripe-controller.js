import { stripeConnectionDetails } from "../constants/stripe-connection-details.js";
import { stripeReaderView } from "./stripe-view.js";
import { stripeReadersModel } from "./stripe-readers-model.js";
import { StripeDriver } from "./stripe-driver.js";
import { BaseController } from "../controllers/base-controller.js";

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
    document
      .getElementById("device-view")
      .insertAdjacentHTML("afterbegin", stripeReaderView.deviceHtml());
    document.getElementById("title").textContent = "Stripe";
    stripeReaderView.addPresetsButtons();
    const payBtn = document.getElementById("pay-btn");
    payBtn.setAttribute("disabled", true);
    document
      .getElementById("list-readers-btn")
      .addEventListener("click", this.#getListReadersAvailable);
    payBtn.addEventListener("click", this.#pay);
    document
      .getElementById("secret-key-card-addition-button")
      .addEventListener("click", this.#showSecretKeyCard);

    if (localStorage.getItem(stripeConnectionDetails.LOCAL_STORAGE_API_KEY)) {
      stripeConnectionDetails.SECRET_KEY = localStorage.getItem(
        stripeConnectionDetails.LOCAL_STORAGE_API_KEY
      );
    }
  };

  /**
   * Responsible for unsubscribing and reverting changes made to the main view
   *     in order to get ready for being removed.
   */
  destroy = () => {
    document.getElementById("secret-key-card-addition-button").remove();
    document.getElementById("title").textContent = "Payment Gateways";
  };

  /**
   * Handles Showing part of the view which is a form responsible for setting
   *     API secret key.
   */
  #showSecretKeyCard = () => {
    document
      .getElementById("secret-key-card-addition-button")
      .setAttribute("disabled", true);
    document
      .getElementById("device-space")
      .appendChild(
        stripeReaderView.createSecretKeySetterCard(this.#setAPISecretKey)
      );
    const secretKeyCardAdditionButton = document.getElementById(
      "secret-key-card-addition-button"
    );
    const cancelButton = document.getElementById(
      "secret-key-form-cancel-button"
    );
    const form = document.getElementById("secret-key-card");
    cancelButton.addEventListener("click", () => {
      secretKeyCardAdditionButton.removeAttribute("disabled");
      form.remove();
    });
  };

  /**
   * Handles setting the new API secret key and initating new connection
   *     with the stripe terminal using the new key.
   */
  #setAPISecretKey = async (event) => {
    event.preventDefault();
    const form = document.getElementById("secret-key-card");
    const secretKeySaveButton = document.getElementById("secret-key-button");
    const secretKeyInput = document.getElementById("secret-key-input");
    const secretKey = secretKeyInput.value;
    const secretKeyCardAdditionButton = document.getElementById(
      "secret-key-card-addition-button"
    );

    if (secretKey) {
      stripeConnectionDetails.SECRET_KEY = secretKey;
      localStorage.setItem(
        stripeConnectionDetails.LOCAL_STORAGE_API_KEY,
        secretKey
      );
      secretKeySaveButton.value = "The new key has been successfully set.";
      secretKeySaveButton.setAttribute("disabled", true);
      setTimeout(() => {
        secretKeyCardAdditionButton.removeAttribute("disabled");
        form.remove();
      }, 1500);
      this.#restoreDefault();
    } else {
      secretKeySaveButton.value =
        "Make sure to fill the field before setting the key.";
      secretKeySaveButton.setAttribute("disabled", true);
      setTimeout(() => {
        secretKeySaveButton.value = "Set key";
        secretKeySaveButton.removeAttribute("disabled");
      }, 2000);
    }
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
        this.#leaveReader(stripeReadersModel.getReaderUsed());
      }
      stripeReadersModel.setReadersList(undefined);
      console.log("BEFORE GETTING READERS");
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
    document.getElementById("pay-btn").setAttribute("disabled", true);
    document
      .getElementById("check-transaction-button")
      .setAttribute("disabled", true);
    document.getElementById("available-readers-holder").innerHTML = "";
    document.getElementById("payment-status").value = "";
    document.getElementById("payment-amount").value = "";
  };

  /**
   * selects the reader to use for transaction saves it
   *     to the reader used model object.
   *
   * @param {string} readerId
   */
  #useReader = (reader) => {
    const connectButton = document.getElementById(reader.id);
    connectButton.setAttribute("value", "leave");
    stripeReadersModel.setReaderUsed(reader);
    document.getElementById("pay-btn").removeAttribute("disabled");
    stripeReaderView.useLeaveReadersButtons(
      reader,
      "disable",
      this.#useReader,
      this.#leaveReader
    );
  };

  /**
   * deselects the previously used reader for transactions.
   *
   * @param {string} readerId
   */
  #leaveReader = (reader) => {
    stripeReaderView.useLeaveReadersButtons(
      reader,
      "enable",
      this.#useReader,
      this.#leaveReader
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
      console.log(result);

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
        error = "Payment failed: make sure you're connected to internet.";
      }
      paymentStatus.value = error;
    }
    payButton.removeAttribute("disabled");
  };
}
