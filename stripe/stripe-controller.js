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

  /** Stores the subscriptions this controller makes, in order to
   *     unsubscribe when the stripe functionality is ended.
   */
  subscriptions = [];

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
    document.getElementById("title").textContent = "Stripe Reader";
    stripeReaderView.addPresetsButtons();
    const payBtn = document.getElementById("pay-btn");
    payBtn.setAttribute("disabled", true);

    await this.#onStart();

    document
      .getElementById("list-readers-btn")
      .addEventListener("click", this.#getListReadersAvailable);

    payBtn.addEventListener("click", this.#pay);

    document
      .getElementById("secretKeyCardAdditionButton")
      .addEventListener("click", this.#showSecretKeyCard);
  };

  /**
   * Handles the needed setup when for the application to act as expected.
   *
   * Responsible for any needed subscriptions, scripts loading and preset
   *     configuration
   */
  #onStart = async () => {
    this.#loadAPIKey();
    const subId1 = observer.subscribe(
      OBSERVER_TOPICS.CONNECTION_LOST,
      this.#handleDisonncetion
    );
    const subId2 = observer.subscribe(
      OBSERVER_TOPICS.CONNECTION_TOKEN_CREATION_ERROR,
      (error) => {
        this.#failureConnectionToken(error);
      }
    );
    this.subscriptions.push([
      {
        subId: subId1,
        topic: OBSERVER_TOPICS.CONNECTION_LOST,
      },
      {
        subId: subId2,
        topic: OBSERVER_TOPICS.CONNECTION_TOKEN_CREATION_ERROR,
      },
    ]);
    // The following try catch statements handle loading the stripe JS SDK
    try {
      await this.#loadConnectStripeSDK(
        stripeConnectionDetails.STRIPE_API_JS_SDK_URL
      );
    } catch (error) {
      document.getElementById("stripe-sdk").remove();
      alert(`${error}`);
    }
  };

  /**
   * Responsible for unsubscribing and reverting changes made to the main view
   *     in order to get ready for being removed.
   */
  destroy = () => {
    for (const subscription of this.subscriptions) {
      observer.unsubscribe(subscription.topic, subscription.subId);
    }
    document.getElementById("secretKeyCardAdditionButton").remove();
    document.getElementById("title").textContent = "Peripherals";
    document.getElementById("stripe-sdk")?.remove();
    this.communicator.disconnectFromTerminal();
  };

  /**
   * Handles the failure of the request of connection token. Gets invoked by
   *     being the callback function of subscription.
   * @param {string} error
   */
  #failureConnectionToken = (error) => {
    alert(error.message);
  };

  /**
   * Adds the needed script of the Stripe SDK as a tag to the document
   *
   * @param {string} url The URL of the script to be loaded
   * @returns {Promise}
   */
  #loadScriptFile = (url) => {
    return new Promise((resolve, reject) => {
      const stripeJSSDK = document.createElement("script");
      stripeJSSDK.type = "text/javascript";
      stripeJSSDK.src = url;
      stripeJSSDK.async = false;
      stripeJSSDK.setAttribute("id", "stripe-sdk");
      stripeJSSDK.addEventListener("load", (done) => {
        resolve({ status: "success" });
      });

      stripeJSSDK.addEventListener("error", () => {
        reject("Check internet connection and try again");
      });
      document.body.appendChild(stripeJSSDK);
    });
  };

  /**
   * Calls the method responsible for SDK loading, then initiates connection
   *     with stripe terminal.
   *
   * @param {string} url The URL of the script to be loaded
   */
  #loadConnectStripeSDK = async (url) => {
    const stripeSDKLoad = await this.#loadScriptFile(url);
    if (stripeSDKLoad.status === "success") {
      await this.communicator.createStripeTerminal();
    }
  };

  /**
   * Handles Showing part of the view responsible for setting API secret key.
   */
  #showSecretKeyCard = () => {
    document
      .getElementById("secretKeyCardAdditionButton")
      .setAttribute("disabled", true);
    document
      .getElementById("device-space")
      .appendChild(stripeReaderView.createSecretKeySetterCard());
    document
      .getElementById("secretKeyButton")
      .addEventListener("click", this.#setAPISecretKey);
  };

  /**
   * Handles setting the new API secret key and initating new connection
   *     with the stripe terminal using the new key.
   */
  #setAPISecretKey = async () => {
    const secretKeyButton = document.getElementById("secretKeyButton");
    const secretKeyInput = document.getElementById("secretKeyInput");
    const secretKey = secretKeyInput.value;

    if (secretKey) {
      stripeConnectionDetails.SECRET_KEY = secretKey;
      localStorage.setItem(
        stripeConnectionDetails.LOCAL_STORAGE_API_KEY,
        secretKey
      );
      secretKeyButton.value = "The new key has been successfully set.";
      secretKeyButton.setAttribute("disabled", true);
      setTimeout(() => {
        document
          .getElementById("secretKeyCardAdditionButton")
          .removeAttribute("disabled");
        document.getElementById("secretKeyCard").remove();
      }, 1500);
      // The following try catch statements handle loading the stripe JS SDK
      //     and connecting to the stripe terminal using the new key added
      try {
        document.getElementById("stripe-sdk")?.remove();
        await this.#loadConnectStripeSDK(
          stripeConnectionDetails.STRIPE_API_JS_SDK_URL
        );
        this.#restoreDefault();
      } catch (error) {
        document.getElementById("stripe-sdk")?.remove();
        alert(`${error}`);
      }
    } else {
      secretKeyButton.value =
        "Make sure to fill the field before setting the key.";
      secretKeyButton.setAttribute("disabled", true);
      setTimeout(() => {
        secretKeyButton.value = "Set key";
        secretKeyButton.removeAttribute("disabled");
      }, 2000);
    }
  };

  /**
   * Handles the sudden reader disconnection to notify the app user.
   */
  #handleDisonncetion = () => {
    alert(
      "Connection lost, make sure the reader and the PC are connected to internet"
    );
    stripeReaderView.controlConnectButtons(
      stripeReadersModel.getReaderConnected(),
      "enable",
      this.#connectToReader,
      this.#disconnectReader
    );
    document.getElementById("pay-btn").setAttribute("disabled", true);
  };

  /**
   * Configures the API secret key to be used, it checks whether a key has been
   *     assigned from previous app use to use it, and if not then it uses
   *     the default secret key specified
   */
  #loadAPIKey = () => {
    if (
      localStorage.getItem(stripeConnectionDetails.LOCAL_STORAGE_API_KEY) ===
      null
    ) {
      localStorage.setItem(
        stripeConnectionDetails.LOCAL_STORAGE_API_KEY,
        stripeConnectionDetails.SECRET_KEY
      );
    } else {
      stripeConnectionDetails.SECRET_KEY = localStorage.getItem(
        stripeConnectionDetails.LOCAL_STORAGE_API_KEY
      );
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
      // To load the SDK script and connect to the terminal if the user connected
      //     to internet after opening the app.
      if (!this.communicator.isConnectedToTerminal()) {
        await this.#loadConnectStripeSDK(
          stripeConnectionDetails.STRIPE_API_JS_SDK_URL
        );
      }
    } catch (error) {
      document.getElementById("stripe-sdk").remove();
      listReadersButton.removeAttribute("disabled");
      listReadersButton.value = "List readers registered";
      alert(error);
    }

    if (this.communicator.isConnectedToTerminal()) {
      try {
        // Make sure to disonnect the connected reader before finding other readers
        if (stripeReadersModel.getReaderConnected()) {
          await this.#disconnectReader(stripeReadersModel.getReaderConnected());
        }
        stripeReadersModel.setReadersList(undefined);
        console.log("BEFORE GETTING READERS");
        const availableReaders = await this.communicator.getReadersAvailable();
        console.log(availableReaders);
        stripeReadersModel.setReadersList(availableReaders);
        stripeReaderView.createAvailableReadersList(this.#connectToReader);
        listReadersButton.removeAttribute("disabled");
        listReadersButton.value = "List readers registered";
      } catch (error) {
        // If still no internet connection, the SDK script will be removed
        // if (!communicator.isConnectedToTerminal()) {
        //   document.getElementById("stripe-sdk").remove();
        // }
        listReadersButton.value = "List readers registered";
        listReadersButton.removeAttribute("disabled");
        alert(`${error}`);
      }
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
    document.getElementById("available-readers-holder").innerHTML = "";
  };

  /**
   * Connects the reader with the specified id and saves the reader connected
   *     to the reader connected model object.
   *
   * @param {string} readerId
   */
  #connectToReader = async (reader) => {
    const connectButton = document.getElementById(reader.id);
    connectButton.setAttribute("value", "Connecting");
    connectButton.setAttribute("disabled", true);

    try {
      const connectResult = await this.communicator.connectReader(reader);

      if (connectResult.error) {
        connectButton.setAttribute(
          "value",
          `${connectResult.error.code}\nTry again...`
        );
        setTimeout(function () {
          connectButton.setAttribute("value", "Connect");
          connectButton.removeAttribute("disabled");
        }, 2000);
      } else {
        stripeReadersModel.setReaderConnected(reader);
        document.getElementById("pay-btn").removeAttribute("disabled");
        stripeReaderView.controlConnectButtons(
          reader,
          "disable",
          this.#connectToReader,
          this.#disconnectReader
        );
      }
    } catch (error) {
      // address the issue where the reader can't be reached
      alert(error.message);
      connectButton.setAttribute("value", `Check Internet`);
      setTimeout(function () {
        connectButton.setAttribute("value", "Connect");
        connectButton.removeAttribute("disabled");
      }, 2000);
    }
  };

  /**
   * Disconnects the connected reader off the stripe terminal
   *
   * @param {string} readerId
   */
  #disconnectReader = async (reader) => {
    try {
      await this.communicator.disonnectReader(reader);
      stripeReaderView.controlConnectButtons(
        reader,
        "enable",
        this.#connectToReader,
        this.#disconnectReader
      );
      stripeReadersModel.setReaderConnected(undefined);
      document.getElementById("pay-btn").setAttribute("disabled", true);
    } catch (error) {
      alert("Disconnecting from reader failed");
    }
  };

  /**
   * Takes the responsibility of the payment flow from intent making to
   *     payment collection and processing.
   */
  #pay = async () => {
    const payButton = document.getElementById("pay-btn");
    const paymentStatus = document.getElementById("payment-status");
    paymentStatus.value = "Payment pending...";
    const amount = document.getElementById("payment-amount").value;

    if (isNaN(amount) || !amount) {
      paymentStatus.value = "Make sure to enter a numeric amount";
      return;
    }
    payButton.setAttribute("disabled", true);
    try {
      const result = await this.communicator.pay(amount);
      if (result.success) {
        paymentStatus.value = "Payment success";
        payButton.removeAttribute("disabled");
      }
    } catch (error) {
      if (error == "TypeError: Failed to fetch") {
        error = "Payment failed: make sure you're connected to internet.";
      }
      paymentStatus.value = error;
      payButton.removeAttribute("disabled");
    }
  };
}
