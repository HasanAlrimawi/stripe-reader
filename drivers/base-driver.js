export class BaseDriver {
  constructor(url) {
    this.#baseUrl = url;
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

  setAuthentication(newAuthentication) {
    this.#authentication = newAuthentication;
  }

  setReaderUnderUse(newReaderUnderUse) {
    this.#readerUnderUse = newReaderUnderUse;
  }

  /**
   * Gets the readers that are registered to the stripe terminal
   *     and saves them in the reader model.
   *
   * @returns {object<string, string} The availabe readers registered to terminal
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
   * @param {string} apiSecretKey
   * @param {string} amount represents the amount of the transaction to take place
   * @returns {object}
   */
  async #startIntentKeyBased(apiSecretKey, amount) {
    return await fetch(`${this.#baseUrl}/payment_intents`, {
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
  async #processPaymentKeyBased(apiSecretKey, paymentIntentId, readerId) {
    return await fetch(
      `${this.#baseUrl}/terminal/readers/${readerId}/process_payment_intent`,
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
  async #cancelIntentKeyBased(apiSecretKey, intentId) {
    return await fetch(`${this.#baseUrl}/payment_intents/${intentId}/cancel`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${apiSecretKey}`,
      },
    }).then((res) => {
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
  payBasedOnKey = async (amount) => {
    const intent = await this.#startIntentKeyBased(
      this.#authentication,
      amount
    );

    if (intent?.error) {
      // In this case the intent has been created but should be canceled
      if (intent.error.code == !"amount_too_small") {
        await this.#cancelIntentKeyBased(this.#authentication, intent.id);
      }
      return { error: intent.error.message.split(".")[0] };
    } else {
      const result = await this.#processPaymentKeyBased(
        this.#authentication,
        intent.id,
        this.#readerUnderUse
      );

      if (result?.error) {
        await this.#cancelIntentKeyBased(this.#authentication, intent.id);

        if (result.error.code === "terminal_reader_timeout") {
          return {
            error:
              "Check internet connectivity on your reader, then try again.",
          };
        }
        return { error: result.error.message.split(".")[0] };
      } else {
        try {
          const transactionResult = await this.#transactionCheckerKeyBased(
            this.#authentication,
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
  #retrieveTransactionKeyBased = async (apiSecretKey, intentId) => {
    return await fetch(`${this.#baseUrl}/payment_intents/${intentId}`, {
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
  #cancelReaderActionKeyBased = async (apiSecretKey, readerId) => {
    return await fetch(
      `${this.#baseUrl}/terminal/readers/${readerId}/cancel_action`,
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
  #transactionCheckerKeyBased = async (apiSecretKey, intentId, readerId) => {
    return new Promise(async (resolve, reject) => {
      let paymentFinished = false;
      let retrievedTransaction = undefined;
      const transactionCheckInterval = setInterval(async () => {
        try {
          retrievedTransaction = await this.#retrieveTransactionKeyBased(
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
          await this.#cancelIntentKeyBased(apiSecretKey, intentId);
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
          this.#cancelReaderActionKeyBased(apiSecretKey, readerId);
          await this.#cancelIntentKeyBased(apiSecretKey, intentId);
          retrievedTransaction = await this.#retrieveTransactionKeyBased(
            apiSecretKey,
            intentId
          );
          clearInterval(retrievedTransaction);
          resolve(retrievedTransaction);
        }
      }, 20000);
    });
  };



  /**
   * Provides ability to check whether the device is ready for transaction
   *     and in what state it is.
   *
   * @param {string} customerId Trust commerce customer id
   * @param {string} password Trust commerce password
   * @returns {object}
   */
  #checkDeviceAccountBased = async (customerId, password, deviceName) => {
    return await fetch(`${this.#baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `custid=${customerId}&password=${password}&action=devicestatus&device_name=${deviceName}&demo=y`,
    })
      .then((res) => {
        return res.text();
      })
      .then((text) => {
        return this.#textToJSON(text);
      });
  };

  /**
   * Makes a cloud payment request to trust commerce in order to get the device
   *     to receive customer's card to collect his/her card details.
   *
   * @param {number} customerId Trust commerce customer id
   * @param {string} password Trust commerce password
   * @param {string} deviceName The used reader device model name and
   *     serial number
   * @param {number} amount The amount of the transaction in cents
   * @returns {object}
   */
  #makeTransactionAccountBased = async (customerId, password, deviceName, amount) => {
    return await fetch(`${this.#baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `custid=${customerId}&password=${password}&action=sale&device_name=${deviceName}&amount=${amount}&demo=y`,
    })
      .then((res) => {
        return res.text();
      })
      .then((text) => {
        return this.#textToJSON(text);
      });
  };

  /**
   * Checks the requested transaction state whether it's completed or canceled
   *     or other state.
   *
   * @param {number} customerId
   * @param {string} password
   * @param {string} deviceName
   * @param {string} cloudPayId
   * @returns {Object}
   */
  #checkTransactionAccountBased = async (customerId, password, deviceName, cloudPayId) => {
    return await fetch(`${this.#baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `custid=${customerId}&password=${password}&action=transstatus&device_name=${deviceName}&cloudpayid=${cloudPayId}&demo=y`,
      // body: `custid=${customerId}&password=${password}&action=transstatus&device_name=${deviceName}&cloudpayid=${cloudPayId}&long_polling=y&demo=y`,
    })
      .then((res) => {
        return res.text();
      })
      .then((text) => {
        return this.#textToJSON(text);
      });
  };

  /**
   * Wraps the flow of making Trust Commerce transaction from beginning to end.
   *
   * Responsible for checking the device's availability, then makes transaction
   *     request and checks for its result, then cancels if not successful.
   *     throws the response of any of the first three steps if
   *     conveyed failure, only returns response when successfully made or
   *     customer canceled the transaction himself.
   *
   * @param {number} customerId
   * @param {string} password
   * @param {number} amount Transaction amount in cents
   * @param {string} deviceName
   * @returns {Object}
   */
  payAccountBased = async (amount) => {
    const deviceCheckResult = await this.#checkDeviceAccountBased(
      this.#authentication.customerId,
      this.#authentication.password,
      this.#readerUnderUse
    );

    if (deviceCheckResult?.message) {
      return { error: deviceCheckResult.message };
    }

    if (deviceCheckResult?.devicestatus !== "connected") {
      return { error: deviceCheckResult.description }; // can be returned as object containing error msg not just deviceCheckResult
    }

    const transactionResponse = await this.#makeTransactionAccountBased(
      this.#authentication.customerId,
      this.#authentication.password,
      this.#readerUnderUse,
      amount
    );
    const currentcloudPayId = transactionResponse.cloudpayid;

    if (transactionResponse.cloudpaystatus === "submitted") {
      try {
        let transactionResult = await this.#getTransactionFinalStateAccountBased(
          this.#authentication.customerId,
          this.#authentication.password,
          this.#readerUnderUse,
          currentcloudPayId
        );
        return transactionResult.cloudpaystatus;
      } catch (error) {
        throw error;
      }
    } else {
      if (transactionResponse.message) {
        return { error: transactionResponse.message };
      }
      return transactionResponse;
    }
  };

  /**
   * Cancels Trust Commerce transaction that was requested before.
   *
   * @param {number} customerId
   * @param {string} password
   * @param {string} deviceName
   * @param {string} cloudPayId
   * @returns {Object}
   */
  #cancelTransactionAccountBased = async (customerId, password, deviceName, cloudPayId) => {
    return await fetch(`${this.#baseUrl}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `custid=${customerId}&password=${password}&action=cancel&device_name=${deviceName}&cloudpayid=${cloudPayId}&demo=y`,
    })
      .then((res) => {
        return res.text();
      })
      .then((text) => {
        return this.#textToJSON(text);
      });
  };

  /**
   * Checks the transaction state every 3 second if the cardholder interacted,
   *     and if the transaction is successful, and it gets canceled if the
   *     cardholder didn't interacted for more than 20 seconds.
   *
   * @param {number} customerId
   * @param {string} password
   * @param {number} amount Transaction amount in cents
   * @param {string} deviceName
   * @returns {Object}
   */
  #getTransactionFinalStateAccountBased = async (
    customerId,
    password,
    deviceName,
    cloudPayId
  ) => {
    return new Promise(async (resolve, reject) => {
      let paymentFinished = false;
      let transactionCheckResult = undefined;
      const transactionCheckInterval = setInterval(async () => {
        try {
          transactionCheckResult = await this.#checkTransactionAccountBased(
            customerId,
            password,
            deviceName,
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
          await this.#cancelTransactionAccountBased(
            customerId,
            password,
            deviceName,
            cloudPayId
          );
          transactionCheckResult = await this.#checkTransactionAccountBased(
            customerId,
            password,
            deviceName,
            cloudPayId
          );
          clearInterval(transactionCheckResult);
          resolve(transactionCheckResult);
        }
      }, 20000);
    });
  };

  /**
   * Converts text based key=value pairs to json objects.
   *
   * @param {string} text
   * @returns {Object} JSON version of the key/value pairs of the text passed
   */
  #textToJSON = (text) => {
    const lines = text.split("\n");
    const result = {};

    lines.forEach((line) => {
      const [key, value] = line.split("=");
      result[key] = value;
    });

    return result;
  };
}
