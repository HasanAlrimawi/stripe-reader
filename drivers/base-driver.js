export class BaseDriver {
  constructor(url) {
    this.#baseUrl = url;
    this.#authentication = undefined;
    this.#readerUnderUse = undefined;
  }

  #baseUrl;
  #authentication;
  #readerUnderUse;

  load() {}
  getAuthenticationMethod() {}
  getReaderChoosingMethod() {}
  getReaderUnderUse() {}
  getMultipleStepsFormMethod() {}
  saveReader() {}
  saveAuthenticationDetails() {}
  getAuthenticationUnderUse() {}
  pay() {}

  /**
   * Sets the authentication details to be used.
   *
   * @param {object} newAuthentication
   */
  setAuthentication(newAuthentication) {
    this.#authentication = newAuthentication;
  }

  /**
   * Sets the reader id or model number to be used for making transactions.
   *
   * @param {string} newReaderUnderUse
   */
  setReaderUnderUse(newReaderUnderUse) {
    this.#readerUnderUse = newReaderUnderUse;
  }

  /**
   * Gets the readers that are registered to the stripe terminal
   *     and saves them in the reader model.
   *
   * @returns {Promise<object>} Prmoise resolving to the availabe readers
   *     registered to your stripe account
   */
  async getReadersAvailableKeyBased() {
    return await fetch(`${this.#baseUrl}/terminal/readers`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.#authentication}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }).then((res) => {
      return res.json();
    });
  }

  /**
   * Creates payment intent with the specifed amount in cents.
   *
   * @param {string} amount represents the amount of the transaction to take place
   * @returns {Promise<object>}
   */
  async startIntentKeyBased(amount) {
    return await fetch(`${this.#baseUrl}/payment_intents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.#authentication}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `amount=${amount}&currency=usd&payment_method_types[]=card_present`,
    }).then((res) => {
      return res.json();
    });
  }

  /**
   * Handles the process of the payment
   *
   * @param {string} paymentIntentId Represents the payment intent returned from
   *     the collect payment API
   * @returns {Prmoise<object>} Prmoise resolving to intent Represents the
   *     returned intent from the process payment if successful, and the
   *     error object if it failed
   */
  async processPaymentKeyBased(paymentIntentId) {
    return await fetch(
      `${this.#baseUrl}/terminal/readers/${
        this.#readerUnderUse
      }/process_payment_intent`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${this.#authentication}`,
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
   * @param {string} intentId
   * @returns {Prmoise<object>} Promise resolving to the intent that has
   *     been canceled
   */
  async cancelIntentKeyBased(intentId) {
    return await fetch(`${this.#baseUrl}/payment_intents/${intentId}/cancel`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${this.#authentication}`,
      },
    }).then((res) => {
      return res.json();
    });
  }

  /**
   * @typedef {Object} payErrorResult
   * @property {string} error
   */

  /**
   * @typedef {Object} payNormalResult
   * @property {string} status Conveys the result of payment
   * @property {number} amount The amount of payment in dollars
   */

  /**
   * Takes the responsibility of the payment flow from intent making to
   *     payment processing and cancelling if needed.
   *
   * @param {number} amount Represents the transaction amount
   * @returns {Promise<payNormalResult | payErrorResult>} A promise resolving
   *     to payment normal flow or payment error occurred
   */
  async payBasedOnKey(amount) {
    const intent = await this.startIntentKeyBased(amount);

    if (intent?.error) {
      // In this case the intent has been created but should be canceled
      if (intent.error.code == !"amount_too_small") {
        await this.cancelIntentKeyBased(intent.id);
      }
      return { error: intent.error.message.split(".")[0] };
    } else {
      const result = await this.processPaymentKeyBased(intent.id);

      if (result?.error) {
        await this.cancelIntentKeyBased(intent.id);

        if (result.error.code === "terminal_reader_timeout") {
          return {
            error:
              "Check internet connectivity on your reader, then try again.",
          };
        }
        return { error: result.error.message.split(".")[0] };
      } else {
        try {
          const transactionResult =
            await this.#getTransactionFinalStateKeyBased(intent.id);

          if (transactionResult.last_payment_error) {
            return {
              error: transactionResult.last_payment_error.message.split(".")[0],
            };
          }
          return { status: transactionResult.status, amount: amount / 100 };
        } catch (error) {
          throw error;
        }
      }
    }
  }

  /**
   * Retrieves the intent defined, to check the payment intent status.
   *
   * @param {string} intentId
   * @returns {Promise<object>} Promise resolving to the intent required
   */
  async retrieveTransactionKeyBased(intentId) {
    return await fetch(`${this.#baseUrl}/payment_intents/${intentId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${this.#authentication}`,
      },
    }).then((res) => {
      return res.json();
    });
  }

  /**
   * Cancels the action the reader is doing at the moment of calling the API
   *     in order to clear the screen and make the reader
   *     ready for transaction.
   *
   * @returns {Promise<Object>}
   */
  async cancelReaderActionKeyBased() {
    return await fetch(
      `${this.#baseUrl}/terminal/readers/${this.#readerUnderUse}/cancel_action`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${this.#authentication}`,
        },
      }
    ).then((res) => {
      return res.json();
    });
  }

  /**
   * Checks the transaction state every 3 second if the cardholder interacted,
   *     and if the transaction is successful, and it gets canceled if the
   *     cardholder didn't interacted for more than 20 seconds.
   *
   * @param {Object} intentId
   * @returns {Promise<object>}
   */
  async #getTransactionFinalStateKeyBased(intentId) {
    return new Promise(async (resolve, reject) => {
      let paymentFinished = false;
      let retrievedTransaction = undefined;
      const transactionCheckInterval = setInterval(async () => {
        try {
          retrievedTransaction = await this.retrieveTransactionKeyBased(
            intentId
          );
        } catch (error) {
          clearInterval(transactionCheckInterval);
          paymentFinished = true;
          reject(error);
          return;
        }

        if (retrievedTransaction.last_payment_error) {
          await this.cancelIntentKeyBased(intentId);
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
          this.cancelReaderActionKeyBased();
          await this.cancelIntentKeyBased(intentId);
          retrievedTransaction = await this.retrieveTransactionKeyBased(
            intentId
          );
          clearInterval(retrievedTransaction);
          resolve(retrievedTransaction);
        }
      }, 20000);
    });
  }

  /**
   * Provides ability to check whether the device is ready for transaction
   *     and in what state it is.
   *
   * @returns {Promise<object>}
   */
  async checkDeviceAccountBased() {
    return await fetch(`${this.#baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `custid=${this.#authentication.customerId}&password=${
        this.#authentication.password
      }&action=devicestatus&device_name=${this.#readerUnderUse}&demo=y`,
    })
      .then((res) => {
        return res.text();
      })
      .then((text) => {
        return this.textToJSON(text);
      });
  }

  /**
   * Makes a cloud payment request to trust commerce in order to get the device
   *     to receive customer's card to collect his/her card details.
   *
   * @param {number} amount The amount of the transaction in cents
   * @returns {Promise<object>}
   */
  async makeTransactionAccountBased(amount) {
    return await fetch(`${this.#baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `custid=${this.#authentication.customerId}&password=${
        this.#authentication.password
      }&action=sale&device_name=${
        this.#readerUnderUse
      }&amount=${amount}&demo=y`,
    })
      .then((res) => {
        return res.text();
      })
      .then((text) => {
        return this.textToJSON(text);
      });
  }

  /**
   * Checks the requested transaction state whether it's completed or canceled
   *     or other state.
   *
   * @param {string} cloudPayId
   * @returns {Promise<Object>}
   */
  async checkTransactionAccountBased(cloudPayId) {
    return await fetch(`${this.#baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `custid=${this.#authentication.customerId}&password=${
        this.#authentication.password
      }&action=transstatus&device_name=${
        this.#readerUnderUse
      }&cloudpayid=${cloudPayId}&demo=y`,
    })
      .then((res) => {
        return res.text();
      })
      .then((text) => {
        return this.textToJSON(text);
      });
  }

  /**
   * Wraps the flow of making Trust Commerce transaction from beginning to end.
   *
   * Responsible for checking the device's availability, then makes transaction
   *     request and checks for its result, then cancels if not successful.
   *     throws the response of any of the first three steps if
   *     conveyed failure, only returns response when successfully made or
   *     customer canceled the transaction himself.
   *
   * @param {number} amount Transaction amount in cents
   * @returns {Promise<payNormalResult | payErrorResult>} payment normal flow or payment error occurred
   */
  async payAccountBased(amount) {
    const deviceCheckResult = await this.checkDeviceAccountBased();

    if (deviceCheckResult?.message) {
      return { error: deviceCheckResult.message };
    }

    if (deviceCheckResult?.devicestatus !== "connected") {
      return { error: deviceCheckResult.description };
    }

    const transactionResponse = await this.makeTransactionAccountBased(amount);
    const currentcloudPayId = transactionResponse.cloudpayid;

    if (transactionResponse.cloudpaystatus === "submitted") {
      try {
        let transactionResult =
          await this.#getTransactionFinalStateAccountBased(currentcloudPayId);
        return {
          status: transactionResult.cloudpaystatus,
          amount: amount / 100,
        };
      } catch (error) {
        throw error;
      }
    } else {
      if (transactionResponse.message) {
        return { error: transactionResponse.message };
      }
      return transactionResponse;
    }
  }

  /**
   * Cancels Trust Commerce transaction that was requested before.
   *
   * @param {string} cloudPayId
   * @returns {Promise<Object>}
   */
  async cancelTransactionAccountBased(cloudPayId) {
    return await fetch(`${this.#baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `custid=${this.#authentication.customerId}&password=${
        this.#authentication.password
      }&action=cancel&device_name=${
        this.#readerUnderUse
      }&cloudpayid=${cloudPayId}&demo=y`,
    })
      .then((res) => {
        return res.text();
      })
      .then((text) => {
        return this.textToJSON(text);
      });
  }

  /**
   * Checks the transaction state every 3 second if the cardholder interacted,
   *     and if the transaction is successful, and it gets canceled if the
   *     cardholder didn't interacted for more than 20 seconds.
   *
   * @param {string} cloudPayId
   * @returns {Promise<Object>}
   */
  async #getTransactionFinalStateAccountBased(cloudPayId) {
    return new Promise(async (resolve, reject) => {
      let paymentFinished = false;
      let transactionCheckResult = undefined;
      const transactionCheckInterval = setInterval(async () => {
        try {
          transactionCheckResult = await this.checkTransactionAccountBased(
            cloudPayId
          );
        } catch (error) {
          clearInterval(transactionCheckInterval);
          paymentFinished = true;
          reject(error);
          return;
        }

        if (
          transactionCheckResult.cloudpaystatus === "complete" ||
          transactionCheckResult.cloudpaystatus === "cancel"
        ) {
          paymentFinished = true;
        }

        if (paymentFinished) {
          resolve(transactionCheckResult);
          clearInterval(transactionCheckInterval);
        }
      }, 3000);
      // To force promise resolve after 20 seconds, as the cardholder
      // took so much time to interact and insert the card to the reader
      setTimeout(async () => {
        if (!paymentFinished) {
          await this.cancelTransactionAccountBased(cloudPayId);
          transactionCheckResult = await this.checkTransactionAccountBased(
            cloudPayId
          );
          clearInterval(transactionCheckResult);
          resolve(transactionCheckResult);
        }
      }, 20000);
    });
  }

  /**
   * Converts text based key=value pairs to json objects.
   *
   * @param {string} text
   * @returns {Object} JSON version of the key/value pairs of the text passed
   */
  textToJSON = (text) => {
    const lines = text.split("\n");
    const result = {};

    lines.forEach((line) => {
      const [key, value] = line.split("=");
      result[key] = value;
    });

    return result;
  };
}
