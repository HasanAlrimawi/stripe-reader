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
    .then(function (response) {
      return response.json();
    })
    .then(function (data) {
      return data.secret;
    });
}

// ----------------------- --------------------------------- -----------------------

document
  .getElementById("connect-reader")
  .addEventListener("click", connectReader);

document
  .getElementById("pay")
  .addEventListener("click", handleTransactionCycle);

async function connectReader() {
  // Handler for a "Connect Reader" button
  const config = { simulated: true };
  const discoverResult = await terminal.discoverReaders(config);
  if (discoverResult.error) {
    console.log("Failed to discover: ", discoverResult.error);
  } else if (discoverResult.discoveredReaders.length === 0) {
    console.log("No available readers.");
  } else {
    // Just select the first reader here.
    const selectedReader = discoverResult.discoveredReaders[0];

    const connectResult = await terminal.connectReader(selectedReader);
    if (connectResult.error) {
      console.log("Failed to connect: ", connectResult.error);
    } else {
      console.log("Connected to reader: ", connectResult.reader.label);
    }
  }
}

async function pay() {
  return fetch("http://localhost:8085/startPayment", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: "1000",
    }),
  })
    .then((res) => {
      return res.json();
    })
    .catch((err) => {
      return err.json();
    });
}

async function collectPayment(clientSecret) {
  console.log(`The client secret extracted is ${clientSecret}`);
  const updatedIntent = await terminal.collectPaymentMethod(clientSecret);
  if (updatedIntent.error) {
    console.log("Failure of payment collection");
  } else {
    console.log(
      `Great, keep going, here is the updated intent: ${updatedIntent.paymentIntent}`
    );
    const result = await terminal.processPayment(updatedIntent.paymentIntent);
    if (result.error) {
      console.log(`process payment failure`);
    } else {
      console.log("process payment success");
    }
  }
}

async function handleTransactionCycle() {
  const intent = await pay();
  console.log(intent);
  await collectPayment(intent.payment_intent.client_secret);
}
