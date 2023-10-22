import { stripeConnectionDetails } from "./constants/stripe-connection.js";

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
    try {
      return await fetch(
        `${stripeConnectionDetails.STRIPE_API_URL}terminal/connection_tokens`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${stripeConnectionDetails.SECRET_KEY}`,
          },
        }
      )
        .then((response) => {
          console.log(response);
          return response.json();
        })
        .then((data) => {
          console.log(data);
          return data.secret;
        });
    } catch (error) {
      console.log(error);
    }
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
    return connectResult;
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
      if (disconnectionResult.error) {
        console.log("Failed to connect: ", disconnectionResult.error);
      } else {
        console.log("Disconnected from reader");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Creates payment intent with the specifed amount.
   *
   * @param {string} amount represents the amount of the transaction to take place
   * @returns {object}
   */
  async function startIntent(amount) {
    return await fetch(
      `${stripeConnectionDetails.STRIPE_API_URL}payment_intents`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeConnectionDetails.SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `amount=${amount}&currency=usd&payment_method_types[]=card_present`,
        // body: `amount=${amount}&currency=usd&confirm=true&payment_method=pm_card_visa&automatic_payment_methods[enabled]=true&automatic_payment_methods[allow_redirects]=never`,

        // body: `amount=${amount}&currency=usd&payment_method=pm_card_visa_debit`,
        // body: `amount=${amount}&currency=usd&confirm=true&payment_method=visa&automatic_payment_methods[allow_redirects]=never&automatic_payment_methods[enabled]=true`,
        // body: `amount=${amount}&currency=usd&automatic_payment_methods[enabled]=true&return_url=https://stripe.com`,
        // body: `amount=${amount}&currency=usd&payment_method_types[]=card_present`,
        // body: `amount=${amount}&currency=usd&payment_method=offline_pin_cvm&payment_method_types[]=card_present&capture_method=automatic_async&confirm=true&return_url=https://stripe.com`,
      }
    )
      .then((res) => {
        console.log("First then");
        if (!res.ok) {
          // console.log(res.json());
          console.log("Not ok response");
          throw res.json();
        }
        return res.json();
      })
      .then((data) => {
        console.log("Second then");
        return data;
      })
      .catch((err) => {
        console.log("inner throw");
        return err;
      });
  }

  /**
   * Handles payment collection stage.
   *
   * @param {string} clientSecret Represents the intent created secret
   * @returns {object} paymentIntent Represents the payment intent returned from
   *     the collect payment API in success case.
   */
  async function collectPayment(clientSecret) {
    try {
      const updatedIntent = await terminal.collectPaymentMethod(clientSecret);
      console.log(updatedIntent);
      if (updatedIntent.error) {
        return {
          stage: "Collect payment method",
          status: "Failure",
          error: updatedIntent.error,
        };
      } else {
        return updatedIntent.paymentIntent;
      }
    } catch (error) {
      return {
        stage: "Collect payment method",
        status: "Failure",
        error: error,
      };
    }
  }

  /**
   * Handles the process of the payment
   *
   * @param {object} paymentIntent Represents the payment intent returned from
   *     the collect payment API
   * @returns {object} intent Represents the returned intent from the process
   *     payment if successful, and the error object if it failed
   */
  async function processPayment(paymentIntent) {
    console.log(paymentIntent);
    try {
      let result = await terminal.processPayment(paymentIntent);
      console.log(result);

      if (result.error) {
        return {
          stage: "Process payment",
          status: "Failure",
          error: result.error.message,
          intent: result.paymentIntent,
        };
      } else {
        return {
          stage: "Payment collection and processing",
          status: "Success",
        };
      }
    } catch (error) {
      return {
        stage: "Payment collection and processing",
        status: "Failure",
        error: error,
        intent: result?.paymentIntent,
      };
    }
  }

  // /**
  //  * Handles payment collection and process stages.
  //  *
  //  * @param {string} clientSecret Represents the intent created secret
  //  * @returns {object}
  //  */
  // async function collectProcessPayment(clientSecret) {
  //   try {
  //     const updatedIntent = await terminal.collectPaymentMethod(clientSecret);
  //     console.log(updatedIntent);
  //     if (updatedIntent.error) {
  //       return {
  //         stage: "Collect payment method",
  //         status: "Failure",
  //         error: updatedIntent.error,
  //       };
  //     } else {
  //       console.log("to payment process");
  //       let numberOfTries = 0;

  //       while (numberOfTries < 2) {
  //         numberOfTries++;
  //         let result = await terminal.processPayment(
  //           updatedIntent.paymentIntent
  //         );
  //         console.log(result);

  //         if (result.error) {
  //           if (
  //             numberOfTries < 2 &&
  //             result.paymentIntent.status === "requires_confirmation"
  //           ) {
  //             continue;
  //           }
  //           numberOfTries = 2;
  //           console.log("error caused");
  //           return {
  //             stage: "Process payment",
  //             status: "Failure",
  //             error: result.error.message,
  //           };
  //         } else {
  //           return {
  //             stage: "Payment collection and processing",
  //             status: "Success",
  //           };
  //         }
  //       }
  //     }
  //   } catch (error) {
  //     console.log("CAUGHT");
  //     return {
  //       stage: "Payment collection and processing",
  //       status: "Failure",
  //       error: error,
  //     };
  //   }
  // }

  /**
   * Cancels the specified intent in some failure cases.
   *
   * @param {string} intentId
   * @returns {object} The intent that has been canceled
   */
  const cancelIntent = async function (intentId) {
    return await fetch(
      `${stripeConnectionDetails.STRIPE_API_URL}payment_intents/${intentId}/cancel`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${stripeConnectionDetails.SECRET_KEY}`,
        },
      }
    )
      .then((res) => {
        return res.json();
      })
      .catch((error) => {
        return error;
      });
  };

  // /**
  //  * Creates a reader object to register it for a client account.
  //  *
  //  * @param {!Object} readerDetails
  //  *     @property {string} registrationCode Represents the code that is
  //  *         generated on the reader in order to save it as a reader for client
  //  *     @property {string} label Acts as a name for the reader
  //  *     @property {string} locationId
  //  *
  //  * @returns {object} if successful then it represents the reader object
  //  *     registered, if failed then it represents the error occured
  //  */
  // const createReader = async function (readerDetails) {
  //   try {
  //     const createdReader = await fetch(
  //       `${stripeConnectionDetails.STRIPE_API_URL}readers`,
  //       {
  //         method: "POST",
  //         headers: {
  //           Accept: "application/json",
  //           "Content-Type": "application/x-www-form-urlencoded",
  //           Authorization: `Bearer ${stripeConnectionDetails.SECRET_KEY}`,
  //         },
  //         body: `registration_code=${readerDetails.registrationCode}&
  //         label=${readerDetails.label}&location=${readerDetails.locationId}`,
  //       }
  //     );
  //     return createdReader;
  //   } catch (error) {
  //     return { error: error };
  //   }
  // };

  // /**
  //  * Creates a location object
  //  *
  //  * @param {!object} locationDetails Represents the details of the location
  //  *     to be created
  //  *     @property {string} displayName
  //  *     @property {string} line
  //  *     @property {string} city
  //  *     @property {number} postalCode
  //  *     @property {string} state
  //  *     @property {string} country
  //  * @returns {object} if successful then it represents the location object
  //  *     registered, if failed then it represents the error occured
  //  */
  // const createLocation = async function (locationDetails) {
  //   try {
  //     const createdLocation = await fetch(
  //       `${stripeConnectionDetails.STRIPE_API_URL}locations`,
  //       {
  //         method: "POST",
  //         headers: {
  //           Accept: "application/json",
  //           "Content-Type": "application/x-www-form-urlencoded",
  //           Authorization: `Bearer ${stripeConnectionDetails.SECRET_KEY}`,
  //         },
  //         body: `display_name=${locationDetails.displayName}&
  //         address[line1]=${locationDetails.line}&
  //         address[city]=${locationDetails.city}&
  //         address[postal_code]=${locationDetails.postalCode}&
  //         address[state]=${locationDetails.state}&
  //         address[country]=${locationDetails.country}`,
  //       }
  //     );
  //     return createdLocation;
  //   } catch (error) {
  //     return { error: error };
  //   }
  // };

  //todo add a function that fetches API from server to close intent
  return {
    // collectProcessPayment,
    startIntent,
    connectReader,
    getReadersAvailable,
    cancelIntent,
    disonnectReader,
    collectPayment,
    processPayment,
    // createLocation,
    // createReader,
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
