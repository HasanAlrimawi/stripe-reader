// const { ReadersModel } = require("./readers-model");
import { ReadersModel } from "./readers-model.js";

var terminal = StripeTerminal.create({
  onFetchConnectionToken: fetchConnectionToken,
  onUnexpectedReaderDisconnect: unexpectedDisconnect,
});

function unexpectedDisconnect() {
  // In this function, your app should notify the user that the reader disconnected.
  // You can also include a way to attempt to reconnect to a reader.
  console.log("Disconnected from reader");
}

function fetchConnectionToken() {
  // Do not cache or hardcode the ConnectionToken. The SDK manages the ConnectionToken's lifecycle.
  return fetch("http://localhost:8085/connectionToken", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "POST",
  })
    .then((response) => {
      return response.json();
    })
    .then((data) => {
      return data.secret;
    });
}

// ----------------------- --------------------------------- -----------------------

// document
//   .getElementById("connect-reader")
//   .addEventListener("click", connectReader);

// document
//   .getElementById("pay")
//   .addEventListener("click", handleTransactionCycle);

// document.getElementById("capture").addEventListener("click", capturePayment);

let latestIntent = undefined;

export async function getReadersAvailable() {
  const config = { simulated: true };
  const discoverResult = await terminal.discoverReaders(config);
  if (discoverResult.error) {
    console.log("Failed to discover: ", discoverResult.error);
  } else if (discoverResult.discoveredReaders.length === 0) {
    console.log("No available readers.");
  } else {
    const availableReaders = discoverResult.discoveredReaders;
    ReadersModel.setReadersAvailable(availableReaders);
    const selectedReader = discoverResult.discoveredReaders[0];
    console.log(
      `${selectedReader} while the size of available readers are: ${availableReaders.length}`
    );
    console.log(availableReaders);
    return availableReaders;
  }
}

export async function connectReader(selectedReader) {
  const connectResult = await terminal.connectReader(selectedReader);
  if (connectResult.error) {
    console.log("Failed to connect: ", connectResult.error);
  } else {
    console.log("Connected to reader: ", connectResult.reader.label);
  }
}

export async function startIntent(amount) {
  return await fetch("http://localhost:8085/startPayment", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amount,
    }),
  })
    .then((res) => {
      return res.json();
    })
    .catch((err) => {
      return err;
    });
}

export async function collectProcessPayment(clientSecret) {
  const updatedIntent = await terminal.collectPaymentMethod(clientSecret);
  latestIntent = updatedIntent;

  if (updatedIntent.error) {
    console.log("Failure of payment collection");
  } else {
    console.log(
      `Great, keep going, here is the updated intent: ${updatedIntent.paymentIntent}`
    );
    let result = await terminal.processPayment(updatedIntent.paymentIntent);

    // checks whether a failure occured in order to address it
    if (result.paymentIntent.status === "requires_payment_method") {
      console.log("payment method not working, try another");
    } else if (
      result.paymentIntent.status === "requires_confirmation" ||
      result.paymentIntent.status === null ||
      result.paymentIntent.status === undefined
    ) {
      console.log("Connectivity problem, trying again...");
      result = await terminal.processPayment(updatedIntent.paymentIntent);
    }
    if (result.error) {
      console.log(`process payment failure`);
    } else {
      console.log(result);
      console.log("process payment success");
    }
  }
}

// This function calls the function that makes intent, then passes it to
//     the next function that handles the collection and process of the payment
async function handleTransactionCycle() {
  try {
    const intent = await startIntent(10);
    console.log(intent);
    await collectProcessPayment(intent.payment_intent.client_secret);
  } catch {
    console.log("CAUGHT");
  }
}

// This function would be needed if the capture method is set to manual when making the payment intent
async function capturePayment() {
  return fetch("http://localhost:8085/capturePayment", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      intentId: latestIntent.paymentIntent.id,
    }),
  })
    .then((res) => {
      return res.json();
    })
    .catch((err) => {
      return err.json();
    });
}
