// import { communicator } from "../communicators/stripe-communicator.js";
import { OBSERVER_TOPICS } from "../constants/observer-topics.js";
import { stripeConnectionDetails } from "../constants/stripe-connection-details.js";
import { stripeReaderView } from "./stripe-view.js";
import { observer } from "../observer.js";
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

  #currentIntentId = undefined;

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
    document
      .getElementById("payment-form-buttons")
      .appendChild(stripeReaderView.createCheckButton());
    document
      .getElementById("check-transaction-button")
      .addEventListener("click", () => {
        this.#checkTransaction(stripeConnectionDetails.SECRET_KEY);
      });
    document.getElementById("title").textContent = "Stripe Reader";
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
  };

  /**
   * Responsible for unsubscribing and reverting changes made to the main view
   *     in order to get ready for being removed.
   */
  destroy = () => {
    document.getElementById("secret-key-card-addition-button").remove();
    document.getElementById("title").textContent = "Peripherals";
  };

  /**
   * Handles Showing part of the view responsible for setting API secret key.
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
   * Checks if connection to stripe was successful and tries to do so if there
   *     isn't, adds the readers' Ids to the dropdown list, after clearing the readers model
   *     and the dropdown list if they had any reader included before.
   */
  #getListReadersAvailable = async () => {
    const listReadersButton = document.getElementById("list-readers-btn");
    listReadersButton.setAttribute("disabled", true);
    listReadersButton.value = "Getting readers...";

    try {
      // Make sure to disonnect the connected reader before finding other readers
      if (stripeReadersModel.getReaderConnected()) {
        await this.#leaveReader(stripeReadersModel.getReaderConnected());
      }
      stripeReadersModel.setReadersList(undefined);
      console.log("BEFORE GETTING READERS");
      const availableReaders = await this.communicator.getReadersAvailable(
        stripeConnectionDetails.SECRET_KEY
      );
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
    stripeReadersModel.setReaderConnected(undefined);
    stripeReadersModel.setReadersList(undefined);
    document.getElementById("pay-btn").setAttribute("disabled", true);
    document
      .getElementById("check-transaction-button")
      .setAttribute("disabled", true);
    this.#currentIntentId = undefined;
    document.getElementById("available-readers-holder").innerHTML = "";
    document.getElementById("payment-status").value = "";
    document.getElementById("payment-amount").value = "";
  };

  /**
   * Connects the reader with the specified id and saves the reader connected
   *     to the reader connected model object.
   *
   * @param {string} readerId
   */
  #useReader = async (reader) => {
    const connectButton = document.getElementById(reader.id);
    connectButton.setAttribute("value", "leave");
    stripeReadersModel.setReaderConnected(reader);
    document.getElementById("pay-btn").removeAttribute("disabled");
    stripeReaderView.controlConnectButtons(
      reader,
      "disable",
      this.#useReader,
      this.#leaveReader
    );
  };

  /**
   * Disconnects the connected reader off the stripe terminal
   *
   * @param {string} readerId
   */
  #leaveReader = async (reader) => {
    stripeReaderView.controlConnectButtons(
      reader,
      "enable",
      this.#useReader,
      this.#leaveReader
    );
    stripeReadersModel.setReaderConnected(undefined);
    document.getElementById("pay-btn").setAttribute("disabled", true);
  };

  /**
   * Takes the responsibility of the payment flow from intent making to
   *     payment collection and processing.
   */
  #pay = async () => {
    const payButton = document.getElementById("pay-btn");
    const checkTransactionButton = document.getElementById(
      "check-transaction-button"
    );
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
        stripeReadersModel.getReaderConnected().id
      );
      let message = "";
      this.#currentIntentId =
        result?.intent?.action?.process_payment_intent?.payment_intent;
      if (result?.intent?.action) {
        message = `Payment ${result.intent.action.status}. \nCheck status after card-holder interaction.`;
      } else {
        message = "Check transaction status";
      }
      paymentStatus.value = message;
      checkTransactionButton.removeAttribute("disabled");
    } catch (error) {
      if (error == "TypeError: Failed to fetch") {
        error = "Payment failed: make sure you're connected to internet.";
      }
      paymentStatus.value = error;
      checkTransactionButton.setAttribute("disabled", true);
      this.#currentIntentId = undefined;
    }
    payButton.removeAttribute("disabled");
  };

  /**
   * Checks the status of the last transaction made.
   *
   * @param {string} apiSecretKey
   */
  #checkTransaction = async (apiSecretKey) => {
    if (this.#currentIntentId) {
      const transactionStatus = await this.communicator.retrieveTransaction(
        apiSecretKey,
        this.#currentIntentId
      );
      const paymentStatus = document.getElementById("payment-status");
      if (transactionStatus.status) {
        paymentStatus.value = `Transaction amount: ${
          transactionStatus.amount / 100
        }$\nStatus: ${transactionStatus.status}`;
      } else {
        paymentStatus.value = transactionStatus?.error?.message;
      }
    }
  };
}
