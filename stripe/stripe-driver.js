import { BaseDriver } from "../drivers/base-driver.js";
import { OBSERVER_TOPICS } from "../constants/observer-topics.js";
import { stripeConnectionDetails } from "../constants/stripe-connection-details.js";
import { observer } from "../observer.js";
export class StripeDriver extends BaseDriver {
  static stripeDriverInstance_;

  // Declare stripe terminal object to access its funtionalities
  #terminal = undefined;

  // Represents the connection to the stripe's terminal has been initiated
  //     successfully or not.
  #isConnected = false;

  static getInstance() {
    if (!this.stripeDriverInstance_) {
      this.stripeDriverInstance_ = new this();
    }
    return this.stripeDriverInstance_;
  }

  /**
   * Creates a terminal instance the permits consuming terminal APIs
   *     to communicate with stripe terminal.
   */
  async createStripeTerminal() {
    try {
      this.#terminal = await StripeTerminal.create({
        onFetchConnectionToken: this.fetchConnectionToken,
        onUnexpectedReaderDisconnect: this.unexpectedDisconnect,
      });
      this.#isConnected = true;
    } catch (error) {
      console.log("STRIPE TERMINAL CREATION ERROR");
      console.log(error);
    }
  }

  /**
   * Declares the event of loss of connection with the reader.
   */
  unexpectedDisconnect() {
    // In this function, your app should notify the user that the reader disConnected_.
    // You can also include a way to attempt to reconnect to a reader.
    observer.publish(OBSERVER_TOPICS.CONNECTION_LOST, "");
  }

  /**
   * Fetches connection token from the server, in order to give the app access
   *     to the readers registered to the server.
   * @returns {!object}
   */
  async fetchConnectionToken() {
    // Do not cache or hardcode the ConnectionToken. The SDK manages the ConnectionToken's lifecycle.
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
        return response.json();
      })
      .then((data) => {
        if (data.error) {
          observer.publish(
            OBSERVER_TOPICS.CONNECTION_TOKEN_CREATION_ERROR,
            data.error
          );
          return data.error.message;
        }
        return data.secret;
      });
  }

  // ----------------------- --------------------------------- -----------------------

  /**
   * Returns the state of whether an instance of terminal that secures
   *     communication with the stripe terminal has been created successfully.
   *
   * @returns {boolean} the state of whether an instance of terminal that
   *     secures communication with the stripe terminal has
   *     been created successfully
   */
  isConnectedToTerminal() {
    return this.#isConnected;
  }

  /**
   * Used to mark the flag indicating connection as false.
   *
   * Should be called when the SDK script is removed, as the
   *     driver is singleton.
   */
  disconnectFromTerminal = () => {
    this.#isConnected = false;
  };

  /**
   * Gets the readers that are registered to the stripe terminal
   *     and saves them in the reader model.
   * @returns {object<string, string} The availabe readers registered to terminal
   */
  async getReadersAvailable() {
    const config = { simulated: false };
    const discoverResult = await this.#terminal.discoverReaders(config);

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
  async connectReader(selectedReader) {
    const connectResult = await this.#terminal.connectReader(selectedReader);

    if (connectResult.error) {
      throw connectResult.error;
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
  async disonnectReader(selectedReader) {
    try {
      const disconnectionResult = await this.#terminal.disconnectReader(
        selectedReader
      );

      if (disconnectionResult.error) {
        console.log("Failed to connect: ", disconnectionResult.error);
      } else {
        console.log("DisConnected_ from reader");
      }
    } catch (error) {
      console.log(error);
    }
  }

  /**
   * Creates payment intent with the specifed amount in cents.
   *
   * @param {string} amount represents the amount of the transaction to take place
   * @returns {object}
   */
  async startIntent(amount) {
    return await fetch(
      `${stripeConnectionDetails.STRIPE_API_URL}payment_intents`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeConnectionDetails.SECRET_KEY}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `amount=${amount}&currency=usd&payment_method_types[]=card_present`,
        // body: `amount=${amount}&currency=usd&payment_method=pm_card_cvcCheckFail&capture_method=automatic_async&automatic_payment_methods[enabled]=true&automatic_payment_methods[allow_redirects]=never`,
      }
    ).then((res) => {
      return res.json();
    });
  }

  /**
   * Handles payment collection stage.
   *
   * @param {string} clientSecret Represents the intent created secret
   * @returns {object} paymentIntent Represents the payment intent returned from
   *     the collect payment API in success case.
   */
  async collectPayment(clientSecret) {
    try {
      const updatedIntent = await this.#terminal.collectPaymentMethod(
        clientSecret
      );
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
  async processPayment(paymentIntent) {
    try {
      let result = await this.#terminal.processPayment(paymentIntent);

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

  /**
   * Cancels the specified intent in some failure cases.
   *
   * @param {string} intentId
   * @returns {object} The intent that has been canceled
   */
  async cancelIntent(intentId) {
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
  }

  /**
   * Takes the responsibility of the payment flow from intent making to
   *     payment collection and processing.
   *
   * @param {number} amount Represents the transaction amount
   */
  pay = async (amount) => {
    const intent = await this.startIntent(amount);

    if (intent?.error) {
      // payButton.removeAttribute("disabled");

      // In this case the intent has been created but should be canceled
      if (intent.error.code == !"amount_too_small") {
        await this.cancelIntent(intent.id);
      }
      throw `Payment failed: ${intent.error.message}`;
    } else {
      const result = await this.collectAndProcess(intent.client_secret);

      if (result?.error && intent?.status !== "succeeded") {
        await this.cancelIntent(intent.id);
        throw `Payment failed: ${result.error}`;
      } else {
        return {
          intent: result,
          success: "success",
        };
        // paymentStatus.value = "Payment success";
        // payButton.removeAttribute("disabled");
      }
    }
  };

  /**
   * Consumes the collect API of the stripe's to make the reader ready for entry.
   *
   * @param {string} clientSecret Represents the intent created secret
   * @returns {object} collectionIntent Represents the payment intent that
   *     was returned by the stripe's terminal collect API
   */
  collectionPayment_ = async (clientSecret) => {
    const collectionIntent = await this.collectPayment(clientSecret);

    if (collectionIntent.error) {
      throw `Payment failed: ${collectionIntent.error.message}`;
    }
    return collectionIntent;
  };

  /**
   * Handles the payment collection and process stages, to make sure that
   *     to give the transaction a second chance if a sudden network issue
   *     happened or the payment method didn't succeed.
   *
   * @param {string} clientSecret Represents the intent created secret
   * @returns {object} processResult Represents the final result of the
   *     transaction
   */
  collectAndProcess = async (clientSecret) => {
    let collectionIntent = await this.collectionPayment_(clientSecret);
    let processResult = await this.processPayment(collectionIntent);

    if (processResult.error) {
      if (processResult.intent?.status === "requires_payment_method") {
        const paymentStatus = document.getElementById("payment-status");
        paymentStatus.value = "Try using another payment method";
        collectionIntent = await this.collectionPayment_(clientSecret);
        paymentStatus.value = "Payment pending...";
        processResult = await this.processPayment(collectionIntent);
      }

      if (processResult.intent?.status === "requires_confirmation") {
        processResult = await this.processPayment(collectionIntent);
        return processResult;
      }
    }
    return processResult;
  };
}
