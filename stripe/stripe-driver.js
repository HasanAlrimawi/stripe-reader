import { AUTHENTICATION_METHODS } from "../constants/auth-methods-constants.js";
import { READER_SELECTION_METHODS } from "../constants/reader-selection-constants.js";
import { BaseDriver } from "../drivers/base-driver.js";
export class StripeDriver extends BaseDriver {
  static stripeDriverInstance_;

  static getInstance() {
    if (!this.stripeDriverInstance_) {
      this.stripeDriverInstance_ = new this();
    }
    return this.stripeDriverInstance_;
  }

  #apiKey = undefined;
  #readerUnderUse = undefined;

  /** Represents the APIs endpoint URL used */
  #STRIPE_API_URL = "https://api.stripe.com/v1";

  /**
   * Returns what authentication method this driver needs so that the
   *     controller knows what form to show so the
   *     user enters his/her credentials.
   *
   * @returns {string} The authentication method type
   */
  getAuthenticationMethod = () => {
    return AUTHENTICATION_METHODS.KEY;
  };

  /**
   * Returns what reader choosing method this driver supports so that the
   *     controller knows what form to show so the user
   *     can enter or choose his/her reader device.
   *
   * @returns {string} The reader selection method
   */
  getReaderChoosingMethod = () => {
    return READER_SELECTION_METHODS.PICK_FROM_LIST_BY_API;
  };

  /**
   * Returns what reader is under use.
   *
   * @returns {string} reader under use
   */
  getReaderUnderUse = () => {
    return this.#readerUnderUse;
  };

  /**
   * Returns the method this driver uses for making multi steps form
   *
   * @returns {string}
   */
  getMultipleStepsFormMethod = () => {
    return "DEFAULT";
  };

  /**
   * Saves the reader device name and modelNumber to be used for transactions
   *     in the local storage and for this driver's attribute.
   *
   * @param {string} readerModel Represents the reader to be used for
   *     transactions
   */
  saveReader = (readerModel) => {
    this.#readerUnderUse = readerModel;
    localStorage.setItem("STRIPE_READER_LOCAL_STORAGE", this.#readerUnderUse);
  };

  /**
   * Saves the credentials which are the customer id and the password
   *     that shall be used for making transactions on the account's behalf.
   *
   * @param {Object} credentials Represents the customer id and password
   *     wrapped in an object
   */
  saveAuthenticationDetails = (apiKey) => {
    this.#apiKey = apiKey;
    localStorage.setItem("API_KEY", this.#apiKey);
  };

  /**
   * Loads any saved values the driver needs from local storage and any
   *     todos the driver should do first.
   */
  load = () => {
    if (localStorage.getItem("API_KEY")) {
      this.#apiKey = localStorage.getItem("API_KEY");
      console.log(this.#apiKey);
    }

    if (localStorage.getItem("STRIPE_READER_LOCAL_STORAGE")) {
      this.#readerUnderUse = localStorage.getItem(
        "STRIPE_READER_LOCAL_STORAGE"
      );
    }
  };

  /**
   * Returns the api key that is under use.
   *
   * @returns {string} api key
   */
  getAuthenticationUnderUse = () => {
    return this.#apiKey;
  };

  /**
   * Gets the readers that are registered to the stripe terminal
   *     and saves them in the reader model.
   *
   * @returns {object<string, string} The availabe readers registered to terminal
   */
  async getReadersAvailable() {
    return await fetch(`${this.#STRIPE_API_URL}/terminal/readers`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.#apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }).then((res) => {
      return res.json();
    });
  }

  /**
   * Creates payment intent with the specifed amount in cents.
   *
   * @param {string} apiSecretKey
   * @param {string} amount represents the amount of the transaction to take place
   * @returns {object}
   */
  async #startIntent(apiSecretKey, amount) {
    return await fetch(`${this.#STRIPE_API_URL}/payment_intents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `amount=${amount}&currency=usd&payment_method_types[]=card_present`,
      // body: `amount=${amount}&currency=usd&payment_method=pm_card_cvcCheckFail&capture_method=automatic_async&automatic_payment_methods[enabled]=true&automatic_payment_methods[allow_redirects]=never`,
    }).then((res) => {
      return res.json();
    });
  }

  /**
   * Handles the process of the payment
   *
   * @param {string} apiSecretKey
   * @param {string} paymentIntentId Represents the payment intent returned from
   *     the collect payment API
   * @param {string} readerId
   * @returns {object} intent Represents the returned intent from the process
   *     payment if successful, and the error object if it failed
   */
  async #processPayment(apiSecretKey, paymentIntentId, readerId) {
    return await fetch(
      `${
        this.#STRIPE_API_URL
      }/terminal/readers/${readerId}/process_payment_intent`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${apiSecretKey}`,
        },
        body: `payment_intent=${paymentIntentId}`,
      }
    ).then((res) => {
      return res.json();
    });
  }

  /**
   * Cancels the specified intent in some failure cases.
   *
   * @param {string} apiSecretKey
   * @param {string} intentId
   * @returns {object} The intent that has been canceled
   */
  async #cancelIntent(apiSecretKey, intentId) {
    return await fetch(
      `${this.#STRIPE_API_URL}/payment_intents/${intentId}/cancel`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${apiSecretKey}`,
        },
      }
    ).then((res) => {
      return res.json();
    });
  }

  /**
   * Takes the responsibility of the payment flow from intent making to
   *     payment processing and cancelling if needed.
   *
   * @param {string} apiSecretKey
   * @param {number} amount Represents the transaction amount
   * @param {string} readerId
   * @returns {object}
   */
  pay = async (amount) => {
    const intent = await this.#startIntent(this.#apiKey, amount);

    if (intent?.error) {
      // In this case the intent has been created but should be canceled
      if (intent.error.code == !"amount_too_small") {
        await this.#cancelIntent(this.#apiKey, intent.id);
      }
      return { error: intent.error.message.split(".")[0] };
    } else {
      const result = await this.#processPayment(
        this.#apiKey,
        intent.id,
        this.#readerUnderUse
      );

      if (result?.error) {
        await this.#cancelIntent(this.#apiKey, intent.id);

        if (result.error.code === "terminal_reader_timeout") {
          return {
            error:
              "Check internet connectivity on your reader, then try again.",
          };
        }
        return { error: result.error.message.split(".")[0] };
      } else {
        try {
          const transactionResult = await this.#transactionChecker(
            this.#apiKey,
            intent.id,
            this.#readerUnderUse
          );

          if (transactionResult.last_payment_error) {
            return {
              error: transactionResult.last_payment_error.message.split(".")[0],
            };
          }
          return transactionResult.status;
        } catch (error) {
          throw error;
        }
      }
    }
  };

  /**
   * Retrieves the intent defined, to check the payment intent status.
   *
   * @param {string} apiSecretKey
   * @param {string} intentId
   * @returns {object} The intent required
   */
  #retrieveTransaction = async (apiSecretKey, intentId) => {
    return await fetch(`${this.#STRIPE_API_URL}/payment_intents/${intentId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${apiSecretKey}`,
      },
    }).then((res) => {
      return res.json();
    });
  };

  /**
   * Cancels the action the reader is doing at the moment of calling the API
   *     in order to clear the screen and make the reader
   *     ready for transaction.
   *
   * @param {string} apiSecretKey
   * @param {string} readerId
   * @returns {Object}
   */
  #cancelReaderAction = async (apiSecretKey, readerId) => {
    return await fetch(
      `${this.#STRIPE_API_URL}/terminal/readers/${readerId}/cancel_action`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${apiSecretKey}`,
        },
      }
    ).then((res) => {
      return res.json();
    });
  };

  /**
   * Checks the transaction state every 3 second if the cardholder interacted,
   *     and if the transaction is successful, and it gets canceled if the
   *     cardholder didn't interacted for more than 20 seconds.
   *
   * @param {string} apiSecretKey
   * @param {Object} intentId
   * @returns {Promise}
   */
  #transactionChecker = async (apiSecretKey, intentId, readerId) => {
    return new Promise(async (resolve, reject) => {
      let paymentFinished = false;
      let retrievedTransaction = undefined;
      const transactionCheckInterval = setInterval(async () => {
        try {
          retrievedTransaction = await this.#retrieveTransaction(
            apiSecretKey,
            intentId
          );
        } catch (error) {
          clearInterval(transactionCheckInterval);
          paymentFinished = true;
          reject(error);
          return;
        }

        if (retrievedTransaction.last_payment_error) {
          await this.#cancelIntent(apiSecretKey, intentId);
          paymentFinished = true;
        } else if (
          retrievedTransaction?.status === "succeeded" ||
          retrievedTransaction?.status === "canceled"
        ) {
          paymentFinished = true;
        }

        if (paymentFinished) {
          resolve(retrievedTransaction);
          clearInterval(transactionCheckInterval);
        }
      }, 3000);
      // To force promise resolve after 20 seconds, as the cardholder
      // took so much time to interact and insert the card to the reader
      setTimeout(async () => {
        if (!paymentFinished) {
          this.#cancelReaderAction(apiSecretKey, readerId);
          await this.#cancelIntent(apiSecretKey, intentId);
          retrievedTransaction = await this.#retrieveTransaction(
            apiSecretKey,
            intentId
          );
          clearInterval(retrievedTransaction);
          resolve(retrievedTransaction);
        }
      }, 20000);
    });
  };
}
