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
  ReadersModel.setReadersList(undefined);
  const availableReaders = await communicator.getReadersAvailable();
  const selectionElement = document.getElementById("available-readers-holder");
  selectionElement.innerHTML = "";
  if (availableReaders) {
    for (const reader of availableReaders) {
      selectionElement.appendChild(makeOptionElement(reader.id));
    }
    // document.getElementById("connection-status").value =
    //   "Listed available readers";
  }
}
// async function getListReadersAvailable() {
//   ReadersModel.setReadersList(undefined);
//   const availableReaders = await communicator.getReadersAvailable();
//   const selectionElement = document.getElementById("readers-list");
//   while (selectionElement.childElementCount > 1) {
//     selectionElement.removeChild(selectionElement.lastChild);
//   }
//   if (availableReaders) {
//     for (const reader of availableReaders) {
//       selectionElement.appendChild(makeOptionElement(reader.id));
//     }
//     document.getElementById("connection-status").value =
//       "Listed available readers";
//   }
// }

/**
 *
 * @param {string} readerId represents the reader's id
 * @returns {HTMLElement} Represents the html element containing the reader
 */
// function makeOptionElement(themeUsed, readerId) {
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
  // if (themeUsed) {
  //   connectButton.setAttribute("background-color", themeUsed?.BACKGROUND_COLOR);
  //   connectButton.setAttribute(
  //     "hover-background-color",
  //     themeUsed?.HOVER_BACKGROUND_COLOR
  //   );
  // }
  readerWrapper.appendChild(readerLabel);
  readerWrapper.appendChild(connectButton);
  return readerWrapper;
}

function createConnectButton(readerId) {
  const connectButton = document.createElement("custom-button");
  connectButton.setAttribute("id", readerId);
  connectButton.setAttribute("value", "Connect");
  connectButton.setAttribute("class", "connect-button");
  return connectButton;
}

function createDisconnectButton(readerId) {
  const disconnectButton = document.createElement("custom-button");
  disconnectButton.setAttribute("id", readerId);
  disconnectButton.setAttribute("value", "Disconnect");
  return disconnectButton;
}

/**
 * Connects the reader with the specified id and saves the reader connected
 *     to the reader connected model object.
 *
 * @param {string} readerId
 */
async function connectToReader(readerId) {
  // const connectionStatus = document.getElementById("connection-status");
  // connectionStatus.value = "Connection pending...";
  const readers = ReadersModel.getReadersList();
  const selectedReader = readers.filter((element) => element.id === readerId);
  try {
    await communicator.connectReader(selectedReader[0]);
    ReadersModel.setReaderConnected(selectedReader[0]);
    // todo remove the connect button for the connected reader and replace it with disconnect button, then disable all connect buttons for other readers;
    document.getElementById("pay-btn").disabled = false;
    controlConnectButtons(readerId, "disable");
  } catch (error) {
    // connectionStatus.value = "Connection failed";
    console.log({ error: error });
  }
}

/**
 * Replaces the connect button of the just connected reader with a disconnect
 *     button, and disables the other readers' connect buttons.
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
        console.log("PRESSED");
        disconnectReader(readerId);
      });
      break;

    case "enable":
      disconnectButton = document.getElementById(readerId);
      connectButton = createConnectButton(readerId);
      disconnectButton.replaceWith(connectButton);
      connectButtons = document.getElementsByClassName("connect-button");
      connectButtons.forEach((button) => {
        button.setAttribute("disabled", false);
      });
      connectButton.addEventListener("click", () => {
        connectToReader(readerId);
      });
      break;
  }
}

async function disconnectReader(readerId) {
  try {
    //
    const readers = ReadersModel.getReadersList();
    const selectedReader = readers.filter((element) => element.id === readerId);
    const result = await communicator.disonnectReader(selectedReader);
    console.log(result);
    controlConnectButtons(readerId, "enable");
  } catch (error) {
    console.log(error);
  }
}

/**
 * Takes the responsibility of the payment flow from intent making to
 *     payment collection and processing.
 */
async function pay() {
  const paymentStatus = document.getElementById("payment-status");
  paymentStatus.value = "Payment pending...";
  const amount = document.getElementById("payment-amount").value;
  try {
    const intent = await communicator.startIntent(amount);
    console.log(intent);
    if (intent.err) {
      console.log(intent.err.raw.message);
      // communicator.cancelIntent(intent.payment_intent.id);
      console.log("canceled intent");
      // paymentStatus.value = intent.err.raw.message;
      throw intent.err;
    } else {
      console.log("to collection");
      const result = await communicator.collectProcessPayment(
        intent.payment_intent.client_secret
      );

      if (result?.error) {
        paymentStatus.value = "Payment failure";
        console.log(await communicator.cancelIntent(intent.payment_intent.id));
        console.log("canceled intent");
      } else {
        paymentStatus.value = "Payment success";
      }
    }
  } catch (error) {
    paymentStatus.value = error.raw.message;
    console.log(error);
  }
}
