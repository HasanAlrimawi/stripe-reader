import { communicator } from "./communicator.js";
import { OBSERVER_TOPICS } from "./constants/observer-topics.js";
import { stripeConnectionDetails } from "./constants/stripe-connection.js";
import { stripeReaderView } from "./main-view.js";
import { observer } from "./observer.js";
import { ReadersModel } from "./readers-model.js";

document.addEventListener("DOMContentLoaded", () => {
  handleAPIKey();
  document
    .getElementById("list-readers-btn")
    .addEventListener("click", getListReadersAvailable);
  document.getElementById("pay-btn").addEventListener("click", pay);
  observer.subscribe(OBSERVER_TOPICS.CONNECTION_LOST, handleDisonncetion);
  observer.subscribe(
    OBSERVER_TOPICS.CONNECTION_TOKEN_CREATION_ERROR,
    failureConnectionToken
  );
  document
    .getElementById("secretKeyCardAdditionButton")
    .addEventListener("click", showSecretKeyCard);
});

function failureConnectionToken() {
  console.log("Subcriptiopn worked");
}

function showSecretKeyCard() {
  const secretKeyCardAdditionButton = document.getElementById(
    "secretKeyCardAdditionButton"
  );
  secretKeyCardAdditionButton.setAttribute("disabled", true);
  document
    .getElementsByClassName("wrapper-horizontal")[0]
    .appendChild(stripeReaderView.createSecretKeySetterCard());
  document
    .getElementById("secretKeyButton")
    .addEventListener("click", setAPISecretKey);
}

function setAPISecretKey() {
  const secretKeyButton = document.getElementById("secretKeyButton");
  const secretKeyInput = document.getElementById("secretKeyInput");
  const secretKey = secretKeyInput.value;
  if (secretKey) {
    stripeConnectionDetails.SECRET_KEY = secretKey;
    secretKeyButton.value = "The new key has been successfully set.";
    secretKeyButton.setAttribute("disabled", true);
    setTimeout(() => {
      // secretKeyButton.value = "Set key";
      // secretKeyButton.removeAttribute("disabled");
      document
        .getElementById("secretKeyCardAdditionButton")
        .removeAttribute("disabled");
      document.getElementById("secretKeyCard").remove();
    }, 3000);
  } else {
    secretKeyButton.value =
      "Make sure to fill the field before setting the key.";
    secretKeyButton.setAttribute("disabled", true);
    setTimeout(() => {
      secretKeyButton.value = "Set key";
      secretKeyButton.removeAttribute("disabled");
    }, 3000);
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
  console.log("SHOULD BE FIRST");
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
  // Make sure to disonnect the connected reader before findnig other readers
  try {
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
    console.log("Check your internet connection and try again");
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
  // const readers = ReadersModel.getReadersList();
  // const selectedReader = readers.filter((element) => element.id === readerId);

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
      }, 3000);
      // console.log(connectResult.error);
    } else {
      ReadersModel.setReaderConnected(reader);
      document.getElementById("pay-btn").removeAttribute("disabled");
      controlConnectButtons(reader, "disable");
    }
  } catch (error) {
    alert(`${error.message}.`);
    paymentButton.setAttribute("value", "Connect");
    paymentButton.removeAttribute("disabled");
    console.log({ error: error });
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
