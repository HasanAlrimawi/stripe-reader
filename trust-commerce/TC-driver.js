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
  #TC_API_URL = "https://vault.trustcommerce.com/trans/?";

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
      body: `custid=${customerId}&password=${password}&action=transstatus&device_name=${deviceName}&cloudpayid=${cloudPayId}&long_polling=y&demo=y`,
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
   * @param {number} amount Transaction amount on cents
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
    console.log(transactionResponse);
    const currentcloudPayId = transactionResponse.cloudpayid;

    if (transactionResponse.cloudpaystatus === "submitted") {
      const transactionResult = await this.#checkTransaction(
        customerId,
        password,
        deviceName,
        currentcloudPayId
      );
      console.log(transactionResult);

      if (
        transactionResult.cloudpaystatus === "complete" ||
        transactionResult.cloudpaystatus === "cancel"
      ) {
        return transactionResult;
      }
      // transaction will be canceled in case the response status wasn't
      //    complete, since probably the reader disconnected recently or
      //    transaction was canceled by the system due to cardholder
      //    interaction timeout
      else {
        const cancelResult = await this.#cancelTransaction(
          customerId,
          password,
          deviceName,
          currentcloudPayId
        );
        throw cancelResult;
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
