import { BaseDriver } from "../drivers/base-driver.js";

export class TCDriver extends BaseDriver {
  static #tcDriver;

  static getInstance() {
    if (!this.#tcDriver) {
      this.#tcDriver = new this();
    }
    return this.#tcDriver;
  }

  /** Trust commerce API URL to make transactions */
  #TC_API_URL = "https://drab-puce-ladybug-coat.cyclic.app/tc-proxy";

  /**
   * Provides ability to check whether the device is ready for transaction
   *     and in what state it is.
   *
   * @param {string} customerId Trust commerce customer id
   * @param {string} password Trust commerce password
   * @returns {object}
   */
  #checkDevice = async (customerId, password, deviceName) => {
    return await fetch(`${this.#TC_API_URL}`, {
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
  #makeTransaction = async (customerId, password, deviceName, amount) => {
    return await fetch(`${this.#TC_API_URL}`, {
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
  #checkTransaction = async (customerId, password, deviceName, cloudPayId) => {
    return await fetch(`${this.#TC_API_URL}`, {
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
  pay = async (customerId, password, amount, deviceName) => {
    const deviceCheckResult = await this.#checkDevice(
      customerId,
      password,
      deviceName
    );

    if (deviceCheckResult.devicestatus !== "connected") {
      throw deviceCheckResult;
    }
    const transactionResponse = await this.#makeTransaction(
      customerId,
      password,
      deviceName,
      amount
    );
    const currentcloudPayId = transactionResponse.cloudpayid;

    if (transactionResponse.cloudpaystatus === "submitted") {
      try {
        let transactionResult = await this.#getTransactionFinalState(
          customerId,
          password,
          deviceName,
          currentcloudPayId
        );
        return transactionResult;
      } catch (error) {
        throw error;
      }
    } else {
      throw transactionResponse;
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
  #cancelTransaction = async (customerId, password, deviceName, cloudPayId) => {
    return await fetch(`${this.#TC_API_URL}`, {
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
  #getTransactionFinalState = async (
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
          transactionCheckResult = await this.#checkTransaction(
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
          await this.#cancelTransaction(
            customerId,
            password,
            deviceName,
            cloudPayId
          );
          transactionCheckResult = await this.#checkTransaction(
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
