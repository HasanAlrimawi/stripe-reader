import { communicator } from "./communicator.js";
import { OBSERVER_TOPICS } from "./constants/observer-topics.js";
import { stripeConnectionDetails } from "./constants/stripe-connection.js";
import { stripeReaderView } from "./main-view.js";
import { observer } from "./observer.js";
import { ReadersModel } from "./readers-model.js";

document.addEventListener("DOMContentLoaded", async () => {
  handleAPIKey();
  observer.subscribe(OBSERVER_TOPICS.CONNECTION_LOST, handleDisonncetion);
  observer.subscribe(
    OBSERVER_TOPICS.CONNECTION_TOKEN_CREATION_ERROR,
    (error) => {
      failureConnectionToken(error);
    }
  );
  // The following try catch statements handle loading the stripe JS SDK
  try {
    await loadConnectStripeSDK("https://js.stripe.com/terminal/v1/");
  } catch (error) {
    document.getElementById("stripe-sdk").remove();
    alert(`${error}`);
  }
  document
    .getElementById("list-readers-btn")
    .addEventListener("click", getListReadersAvailable);
  document.getElementById("pay-btn").addEventListener("click", pay);

  document
    .getElementById("secretKeyCardAdditionButton")
    .addEventListener("click", showSecretKeyCard);
});

/**
 * Handles the failure of the request of connection token. Gets invoked by
 *     being the callback function of subscription.
 * @param {string} error
 */
function failureConnectionToken(error) {
  alert(error.message);
}

/**
 * Adds the needed script of the Stripe SDK as a tag to the document
 *
 * @param {string} url The URL of the script to be loaded
 * @returns {Promise}
 */
function loadScriptFile(url) {
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
}

/**
 * Calls the method responsible for SDK loading, then initiates connection
 *     with stripe terminal.
 *
 * @param {string} url The URL of the script to be loaded
 */
async function loadConnectStripeSDK(url) {
  const stripeSDKLoad = await loadScriptFile(url);
  console.log(stripeSDKLoad);
  console.log("HELLO loadConnectStripeSDK");
  if (stripeSDKLoad.status === "success") {
    console.log("success");
    await communicator.createStripeTerminal();
  }
}

/**
 * Handles Showing part of the view responsible for setting API secret key.
 */
function showSecretKeyCard() {
  document
    .getElementById("secretKeyCardAdditionButton")
    .setAttribute("disabled", true);
  document
    .getElementsByClassName("wrapper-horizontal")[0]
    .appendChild(stripeReaderView.createSecretKeySetterCard());
  document
    .getElementById("secretKeyButton")
    .addEventListener("click", setAPISecretKey);
}

/**
 * Handles setting the new API secret key and initating new connection
 *     with the stripe terminal using the new key.
 */
async function setAPISecretKey() {
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
    }, 2000);
    // The following try catch statements handle loading the stripe JS SDK
    //     and connecting to the stripe terminal using the new key added
    try {
      document.getElementById("stripe-sdk").remove();
      await loadConnectStripeSDK("https://js.stripe.com/terminal/v1/");
      console.log("HELLO");
    } catch (error) {
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
}

/**
 * Handles the sudden reader disconnection to notify the app user.
 */
function handleDisonncetion() {
  alert("Connection lost, make sure the reader is connected to internet");
}

/**
 * Configures the API secret key to be used, it checks whether a key has been
 *     assigned from previous app use to use it, and if not then it uses
 *     the default secret key specified
 */
function handleAPIKey() {
  if (
    localStorage.getItem(stripeConnectionDetails.LOCAL_STORAGE_API_KEY) === null
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
}

/**
 * Adds the readers' Ids to the dropdown list, after clearing the readers model
 *     and the dropdown list if they had any reader included before.
 */
async function getListReadersAvailable() {
  try {
    // To load the SDK script and connect to the terminal if the user connected
    //     to internet after opening the app.
    if (!communicator.isConnectedToTerminal()) {
      await loadConnectStripeSDK("https://js.stripe.com/terminal/v1/");
    }
    // Make sure to disonnect the connected reader before findnig other readers
    if (ReadersModel.getReaderConnected()) {
      await disconnectReader(ReadersModel.getReaderConnected());
    }
    ReadersModel.setReadersList(undefined);
    const availableReaders = await communicator.getReadersAvailable();
    ReadersModel.setReadersList(availableReaders);
    const readersHolderElement = document.getElementById(
      "available-readers-holder"
    );
    readersHolderElement.innerHTML = "";
    if (availableReaders) {
      for (const reader of availableReaders) {
        readersHolderElement.appendChild(makeReaderOptionElement(reader));
      }
    }
  } catch (error) {
    // If still no internet connection, the SDK script will be removed
    if (!communicator.isConnectedToTerminal()) {
      document.getElementById("stripe-sdk").remove();
    }
    alert("Check internet connection and try again");
  }
}

/**
 * Creates the reader holder that exposes the reader id and connect button.
 *
 * @param {string} readerId represents the reader's id
 * @returns {HTMLElement} Represents the html element containing the reader
 */
function makeReaderOptionElement(reader) {
  const readerWrapper = stripeReaderView.createAvailableReaderElement(reader);
  readerWrapper.lastElementChild.addEventListener("click", () => {
    connectToReader(reader);
  });
  return readerWrapper;
}

/**
 * Connects the reader with the specified id and saves the reader connected
 *     to the reader connected model object.
 *
 * @param {string} readerId
 */
async function connectToReader(reader) {
  const paymentButton = document.getElementById(reader.id);
  paymentButton.setAttribute("value", "Connecting");
  paymentButton.setAttribute("disabled", true);

  try {
    const connectResult = await communicator.connectReader(reader);

    if (connectResult.error) {
      paymentButton.setAttribute(
        "value",
        `${connectResult.error.code}\nTry again...`
      );
      setTimeout(function () {
        paymentButton.setAttribute("value", "Connect");
        paymentButton.removeAttribute("disabled");
      }, 2000);
    } else {
      ReadersModel.setReaderConnected(reader);
      document.getElementById("pay-btn").removeAttribute("disabled");
      controlConnectButtons(reader, "disable");
    }
  } catch (error) {
    paymentButton.setAttribute("value", `Check Internet`);
    setTimeout(function () {
      paymentButton.setAttribute("value", "Connect");
      paymentButton.removeAttribute("disabled");
    }, 2000);
  }
}

/**
 * Replaces the connect button of the just connected reader with a disconnect
 *     button, and disables the other readers' connect buttons.
 *
 * @param {string} mode to specify what to do with buttons, whether enable or
 *     disable
 * @param {string} readerId
 */
function controlConnectButtons(reader, mode) {
  let disconnectButton;
  let connectButton;
  let connectButtons;

  switch (mode) {
    case "disable":
      connectButton = document.getElementById(reader.id);
      disconnectButton = stripeReaderView.createDisconnectButton(reader.id);
      connectButton.replaceWith(disconnectButton);
      connectButtons = document.getElementsByClassName("connect-button");
      connectButtons.forEach((button) => {
        button.setAttribute("disabled", true);
      });
      disconnectButton.addEventListener("click", () => {
        disconnectReader(reader);
      });
      break;

    case "enable":
      disconnectButton = document.getElementById(reader.id);
      connectButton = stripeReaderView.createConnectButton(reader.id);
      disconnectButton.replaceWith(connectButton);
      connectButtons = document.getElementsByClassName("connect-button");
      connectButtons.forEach((button) => {
        button.removeAttribute("disabled");
      });
      connectButton.addEventListener("click", () => {
        connectToReader(reader);
      });
      break;
  }
}

/**
 * Disconnects the connected reader off the stripe terminal
 *
 * @param {string} readerId
 */
async function disconnectReader(reader) {
  try {
    await communicator.disonnectReader(reader);
    controlConnectButtons(reader, "enable");
    document.getElementById("pay-btn").setAttribute("disabled", true);
  } catch (error) {
    console.log(
      `Make sure you are connected to internet and try again ${error}`
    );
  }
}

/**
 * Takes the responsibility of the payment flow from intent making to
 *     payment collection and processing.
 */
async function pay() {
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
    const intent = await communicator.startIntent(amount);

    if (intent.error) {
      console.log(intent);
      console.log("INTENT CREATION LEVEL ERROR");
      payButton.removeAttribute("disabled");
      throw `Payment failed: ${intent.error.message}`;
    } else {
      console.log(`to collection \n${intent.client_secret}`);
      const result = await collectAndProcess(intent.client_secret);
      console.log(result);
      if (result?.error && intent?.status !== "succeeded") {
        console.log(await communicator.cancelIntent(intent.id));
        throw `Payment failed: ${result.error}`;
      } else {
        paymentStatus.value = "Payment success";
        payButton.removeAttribute("disabled");
      }
    }
  } catch (error) {
    paymentStatus.value = error;
    payButton.removeAttribute("disabled");
  }
}

/**
 * Consumes the collect API of the stripe's to make the reader ready for entry.
 *
 * @param {string} clientSecret Represents the intent created secret
 * @returns {object} collectionIntent Represents the payment intent that
 *     was returned by the stripe's terminal collect API
 */
async function collectionPayment(clientSecret) {
  const collectionIntent = await communicator.collectPayment(clientSecret);
  
  if (collectionIntent.error) {
    throw `Payment failed: ${intent.error.message}`;
  }
  return collectionIntent;
}

/**
 * Handles the payment collection and process stages, to make sure that
 *     to give the transaction a second chance if a sudden network issue
 *     happened or the payment method didn't succeed.
 *
 * @param {string} clientSecret Represents the intent created secret
 * @returns {object} processResult Represents the final result of the
 *     transaction
 */
async function collectAndProcess(clientSecret) {
  let collectionIntent = await collectionPayment(clientSecret);
  // console.log(collectionIntent);
  let processResult = await communicator.processPayment(collectionIntent);

  if (processResult.error) {
    // console.log("process came into error");
    if (processResult.intent?.status === "requires_payment_method") {
      // console.log("Collection repeated");
      const paymentStatus = document.getElementById("payment-status");
      paymentStatus.value = "Try using another payment method";
      collectionIntent = await collectionPayment(clientSecret);
      paymentStatus.value = "Payment pending...";
      processResult = await communicator.processPayment(collectionIntent);
    }
    if (processResult.intent?.status === "requires_confirmation") {
      // console.log("Process repeated");
      processResult = await communicator.processPayment(collectionIntent);
      return processResult;
    }
  }
  return processResult;
}
