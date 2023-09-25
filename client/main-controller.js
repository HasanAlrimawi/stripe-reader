// const { getReadersAvailable } = require("./client");
import {
  collectProcessPayment,
  connectReader,
  getReadersAvailable,
  startIntent,
} from "./client.js";
import { ReadersModel } from "./readers-model.js";

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("list-readers-btn")
    .addEventListener("click", getListReadersAvailable);

  const readerListSelection = document.getElementById("readers-list");
  readerListSelection.addEventListener("change", () => {
    connectToReader(readerListSelection.value);
  });

  document.getElementById("pay-btn").addEventListener("click", pay);
});

/**
 * Adds the readers' Ids to the dropdown list
 */
async function getListReadersAvailable() {
  const availableReaders = await getReadersAvailable();
  const selectionElement = document.getElementById("readers-list");
  for (const reader of availableReaders) {
    selectionElement.appendChild(makeOptionElement(reader.id));
  }
}

/**
 *
 * @param {string} readerId represents the reader's id
 * @returns {HTMLElement} Represents the option tag containing the reader's id
 */
function makeOptionElement(readerId) {
  const option = document.createElement("option");
  option.textContent = readerId;
  option.setAttribute("value", readerId);
  return option;
}

function connectToReader(readerId) {
  const readers = ReadersModel.getReadersAvailable();
  const selectedReader = readers.filter((element) => element.id === readerId);
  try {
    connectReader(selectedReader[0]);
    ReadersModel.setReaderConnected(selectedReader[0]);
    document.getElementById(
      "connection-status"
    ).value = `${readerId} is connected`;
    document.getElementById("pay-btn").disabled = false;
  } catch (error) {
    console.log({ error: error });
  }
}

async function pay() {
  const amount = document.getElementById("payment-amount").value;
  try {
    const intent = await startIntent(amount);
    await collectProcessPayment(intent.payment_intent.client_secret);
  } catch (error) {
    console.log({ error: error });
  }
}
