// const { ReadersModel } = require("./readers-model");
import { ReadersModel } from "./readers-model.js";

export const communicator = (function () {
  // initiate stripe terminal object to access its funtionalities
  var terminal = StripeTerminal.create({
    onFetchConnectionToken: fetchConnectionToken,
    onUnexpectedReaderDisconnect: unexpectedDisconnect,
  });

  function unexpectedDisconnect() {
    // In this function, your app should notify the user that the reader disconnected.
    // You can also include a way to attempt to reconnect to a reader.
    console.log("Disconnected from reader");
  }

  /**
   * Fetches connection token from the server, in order to give the app access
   *     to the readers registered to the server.
   * @returns {!object}
   */
  async function fetchConnectionToken() {
    // Do not cache or hardcode the ConnectionToken. The SDK manages the ConnectionToken's lifecycle.
    return await fetch("http://localhost:8085/connectionToken", {
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

  // let latestIntent = undefined;

  /**
   * Gets the readers that are registered to the stripe terminal
   *     and saves them in the reader model.
   * @returns {object<string, string} The availabe readers registered to terminal
   */
  async function getReadersAvailable() {
    const config = { simulated: true };
    const discoverResult = await terminal.discoverReaders(config);
    if (discoverResult.error) {
      console.log("Failed to discover: ", discoverResult.error);
    } else if (discoverResult.discoveredReaders.length === 0) {
      console.log("No available readers.");
    } else {
      const availableReaders = discoverResult.discoveredReaders;
      ReadersModel.setReadersList(availableReaders);
      console.log(`Available readers are: ${availableReaders}`);
      return availableReaders;
    }
  }

  /**
   * Connects to the reader specified.
   *
   * @param {object} selectedReader represents the reader to
   *     connect to
   */
  async function connectReader(selectedReader) {
    const connectResult = await terminal.connectReader(selectedReader);
    if (connectResult.error) {
      console.log("Failed to connect: ", connectResult.error);
    } else {
      console.log("Connected to reader: ", connectResult.reader.label);
    }
  }

  /**
   * Disconnects from the reader specified.
   *
   * @param {object} selectedReader represents the reader to
   *     disconnect from
   */
  async function disonnectReader(selectedReader) {
    try {
      const disconnectionResult = await terminal.disconnectReader(
        selectedReader
      );
      console.log(disconnectionResult);
      if (disconnectionResult.error) {
        console.log("Failed to connect: ", connectResult.error);
      } else {
        console.log("Connected to reader: ", connectResult.reader.label);
      }
    } catch (error) {}
  }

  /**
   * Creates payment intent with the specifed amount.
   *
   * @param {string} amount represents the amount of the transaction to take place
   * @returns {object}
   */
  async function startIntent(amount) {
    try {
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
          return {
            stage: "Make intent",
            state: "Failure",
            error: err,
          };
        });
    } catch (error) {
      console.log({ stage: "Make Intent", state: "Failure", error: error });
      return { stage: "Make Intent", state: "Failure", error: error };
    }
  }

  /**
   * Handles payment collection and process stages.
   *
   * @param {string} clientSecret Represents the intent created secret
   * @returns {object}
   */
  async function collectProcessPayment(clientSecret) {
    try {
      // const updatedIntent = await terminal.collectPaymentMethod(clientSecret);
      // // latestIntent = updatedIntent;

      // if (updatedIntent.error) {
      //   console.log({
      //     stage: "Collect payment method",
      //     state: "Failure",
      //     error: updatedIntent.error,
      //     try_again: false,
      //   });
      // }
      //   else {
      //   console.log("to payment process");
      //   let result = await terminal.processPayment(updatedIntent.paymentIntent);
      //   // latestIntent = updatedIntent;
      //   // checks whether a Failure occured in order to address it
      //   if (result.paymentIntent.status === "requires_payment_method") {
      //     console.log({
      //       stage: "Process payment",
      //       state: "Failure",
      //       error: "Payment Method not working, try another",
      //       try_again: false,
      //     });
      //   } else if (
      //     result.paymentIntent.status === "requires_confirmation" ||
      //     result.paymentIntent.status === null ||
      //     result.paymentIntent.status === undefined
      //   ) {
      //     console.log({
      //       stage: "Process payment",
      //       state: "Failure",
      //       error: "Connectivity problem, try again",
      //       try_again: true,
      //     });
      //   }
      //   if (result.error) {
      //     console.log({
      //       stage: "Process payment",
      //       state: "Failure",
      //       error: result.error,
      //       try_again: false,
      //     });
      //   } else {
      //     console.log({
      //       stage: "Payment collection and processing",
      //       state: "Success",
      //     });
      //   }
      // }
    } catch (error) {
      console.log("CAUGHT");
      return {
        stage: "Payment collection and processing",
        state: "Failure",
        error: error,
      };
    }
  }

  /**
   * Cancels the specified intent in some failure cases.
   *
   * @param {string} intentId
   * @returns {object} The intent canceled
   */
  const cancelIntent = async function (intentId) {
    try {
      const canceledIntentReturned = await fetch(
        "http://localhost:8085/cancelIntent",
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            intentId: intentId,
          }),
        }
      );
      return canceledIntentReturned;
    } catch (error) {
      return { error: error };
    }
  };

  //todo add a function that fetches API from server to close intent
  return {
    collectProcessPayment,
    startIntent,
    connectReader,
    getReadersAvailable,
    cancelIntent,
    disonnectReader,
  };
})();

// This function calls the function that makes intent, then passes it to
//     the next function that handles the collection and process of the payment
// async function handleTransactionCycle() {
//   try {
//     const intent = await startIntent(10);
//     console.log(intent);
//     await collectProcessPayment(intent.payment_intent.client_secret);
//   } catch {
//     console.log("CAUGHT");
//   }
// }

// // This function would be needed if the capture method is set to manual when making the payment intent
// async function capturePayment() {
//   return fetch("http://localhost:8085/capturePayment", {
//     method: "POST",
//     headers: {
//       Accept: "application/json",
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       intentId: latestIntent.paymentIntent.id,
//     }),
//   })
//     .then((res) => {
//       return res.json();
//     })
//     .catch((err) => {
//       return err.json();
//     });
// }
