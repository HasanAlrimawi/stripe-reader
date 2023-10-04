import { communicator } from "./communicator.js";
import { ReadersModel } from "./readers-model.js";

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("list-readers-btn")
    .addEventListener("click", getListReadersAvailable);

  document.getElementById("pay-btn").addEventListener("click", pay);
});

/**
 * Adds the readers' Ids to the dropdown list, after clearing the readers model
 *     and the dropdown list if they had any reader included before.
 */
async function getListReadersAvailable() {
  // Make sure to disonnect the connected reader before findnig other readers
  if (ReadersModel.getReaderConnected()) {
    await disconnectReader(ReadersModel.getReaderConnected().id);
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
      readersHolderElement.appendChild(makeOptionElement(reader.id));
    }
  }
}

/**
 * Creates the reader holder that exposes the reader id and connect button.
 *
 * @param {string} readerId represents the reader's id
 * @returns {HTMLElement} Represents the html element containing the reader
 */
function makeOptionElement(readerId) {
  const readerWrapper = document.createElement("div");
  const readerLabel = document.createElement("label");
  const connectButton = createConnectButton(readerId);

  readerWrapper.setAttribute("class", "vertical-wrapper");
  readerLabel.textContent = readerId;

  connectButton.addEventListener(
    "click",
    () => {
      connectToReader(readerId);
    },
    { once: true }
  );
  readerWrapper.appendChild(readerLabel);
  readerWrapper.appendChild(connectButton);
  return readerWrapper;
}

/**
 * Creates HTML connect button with event listener to connect to the wanted
 *     reader when selected.
 *
 * @param {string} readerId holds the ID of the reader to expose for connection
 * @returns {HTMLElement}
 */
function createConnectButton(readerId) {
  const connectButton = document.createElement("input");
  connectButton.setAttribute("id", readerId);
  connectButton.setAttribute("value", "Connect");
  connectButton.setAttribute("class", "connect-button button");
  connectButton.setAttribute("type", "button");
  return connectButton;
}

/**
 * Creates HTML disconnect button with event listener to disconnect the already
 *     connected reader when selected.
 *
 * @param {string} readerId holds the ID of the reader to expose for disconnection
 * @returns {HTMLElement}
 */
function createDisconnectButton(readerId) {
  const disconnectButton = document.createElement("input");
  disconnectButton.setAttribute("id", readerId);
  disconnectButton.setAttribute("value", "Disconnect");
  disconnectButton.setAttribute("class", "button");
  disconnectButton.setAttribute("type", "button");
  return disconnectButton;
}

/**
 * Connects the reader with the specified id and saves the reader connected
 *     to the reader connected model object.
 *
 * @param {string} readerId
 */
async function connectToReader(readerId) {
  const paymentButton = document.getElementById(readerId);
  paymentButton.setAttribute("value", "Connecting");
  paymentButton.setAttribute("disabled", true);
  const readers = ReadersModel.getReadersList();
  const selectedReader = readers.filter((element) => element.id === readerId);

  try {
    const connectResult = await communicator.connectReader(selectedReader[0]);

    if (connectResult.error) {
      console.log(connectResult.error);
    } else {
      ReadersModel.setReaderConnected(selectedReader[0]);
      document.getElementById("pay-btn").removeAttribute("disabled");
      controlConnectButtons(readerId, "disable");
    }
  } catch (error) {
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
function controlConnectButtons(readerId, mode) {
  let disconnectButton;
  let connectButton;
  let connectButtons;
  switch (mode) {
    case "disable":
      connectButton = document.getElementById(readerId);
      disconnectButton = createDisconnectButton(readerId);
      connectButton.replaceWith(disconnectButton);
      connectButtons = document.getElementsByClassName("connect-button");
      connectButtons.forEach((button) => {
        button.setAttribute("disabled", true);
      });
      disconnectButton.addEventListener("click", () => {
        disconnectReader(readerId);
      });
      break;

    case "enable":
      disconnectButton = document.getElementById(readerId);
      connectButton = createConnectButton(readerId);
      disconnectButton.replaceWith(connectButton);
      connectButtons = document.getElementsByClassName("connect-button");
      connectButtons.forEach((button) => {
        button.removeAttribute("disabled");
      });
      connectButton.addEventListener("click", () => {
        connectToReader(readerId);
      });
      break;
  }
}

/**
 * Disconnects the connected reader off the stripe terminal
 *
 * @param {string} readerId
 */
async function disconnectReader(readerId) {
  try {
    //
    const readers = ReadersModel.getReadersList();
    const selectedReader = readers.filter((element) => element.id === readerId);
    await communicator.disonnectReader(selectedReader[0]);
    controlConnectButtons(readerId, "enable");
    document.getElementById("pay-btn").setAttribute("disabled", true);
  } catch (error) {
    console.log(error);
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
      payButton.removeAttribute("disabled");
      throw intent.error.code;
    } else {
      console.log(`to collection \n${intent.client_secret}`);
      const result = await communicator.collectProcessPayment(
        intent.client_secret
      );

      if (result?.error) {
        console.log(await communicator.cancelIntent(intent.id));
        throw "Payment failure";
      } else {
        paymentStatus.value = "Payment success";
        payButton.removeAttribute("disabled");
      }
    }
  } catch (error) {
    paymentStatus.value = error;
    console.log(error);
    payButton.removeAttribute("disabled");
  }
}
