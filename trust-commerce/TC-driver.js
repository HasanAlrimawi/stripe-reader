import { BaseDriver } from "../communicators/base-driver.js";
import { TCConnectionDetails } from "../constants/TC-connection-details.js";
import { TCReadersModel } from "./TC-model.js";

export class TCDriver extends BaseDriver {
  static #tcDriver;

  static getInstance() {
    if (!this.#tcDriver) {
      this.#tcDriver = new this();
    }
    return this.#tcDriver;
  }

  /**
   * Provides ability to check whether the device is ready for transaction
   *     and in what state it is.
   *
   * @param {string} customerId Trust commerce customer id
   * @param {string} password Trust commerce password
   * @returns {object}
   */
  checkDevice = async (customerId, password, deviceName) => {
    return await fetch(`${TCConnectionDetails.TC_API_URL}`, {
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
   *
   * @param {string} customerId Trust commerce customer id
   * @param {string} password Trust commerce password
   * @param {string} deviceName The used reader device model name and
   *     serial number
   * @param {number} amount The amount of the
   * @returns
   */
  makeTransaction = async (customerId, password, deviceName, amount) => {
    return await fetch(`${TCConnectionDetails.TC_API_URL}`, {
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

  checkTransaction = async (
    customerId,
    password,
    deviceName,
    transactionId
  ) => {
    return await fetch(`${TCConnectionDetails.TC_API_URL}`, {
      method: "POST",
      // mode: "no-cors",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `custid=${customerId}&password=${password}&action=transstatus&device_name=${deviceName}&cloudpayid=${transactionId}&long_polling=y&demo=y`,
    })
      .then((res) => {
        return res.text();
      })
      .then((text) => {
        return this.#textToJSON(text);
      });
  };

  pay = async (customerId, password, amount, deviceName) => {
    const deviceCheckResult = await this.checkDevice(
      customerId,
      password,
      deviceName
    );
    if (deviceCheckResult.devicestatus !== "connected") {
      throw deviceCheckResult;
    }
    const transactionResponse = await this.makeTransaction(
      customerId,
      password,
      deviceName,
      amount
    );
    const currentTransactionId = transactionResponse.cloudpayid;
    console.log(transactionResponse.cloudpaystatus === "submitted");

    if (transactionResponse.cloudpaystatus === "submitted") {
      const transactionResult = await this.checkTransaction(
        customerId,
        password,
        deviceName,
        currentTransactionId
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
        const cancelResult = await this.cancelTransaction(
          customerId,
          password,
          deviceName,
          currentTransactionId
        );
        console.log(cancelResult);
        throw cancelResult;
      }
    } else {
      throw transactionResponse;
    }
  };

  cancelTransaction = async (
    customerId,
    password,
    deviceName,
    transactionId
  ) => {
    return await fetch(`${TCConnectionDetails.TC_API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `custid=${customerId}&password=${password}&action=cancel&device_name=${deviceName}&cloudpayid=${transactionId}&demo=y`,
    })
      .then((res) => {
        return res.text();
      })
      .then((text) => {
        return this.#textToJSON(text);
      });
  };

  #textToJSON = (text) => {
    const lines = text.split("\n");
    const result = {};

    lines.forEach((line) => {
      const [key, value] = line.split("=");
      result[key] = value;
    });

    return result;
  };

  mockMakeTransaction = async (customerId, password, deviceName, amount) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          cloudpayid: "123456asd",
          cloudpaystatus: "submitted",
        });
      }, 2000);
    });
  };

  mockCheckTransaction = async (
    customerId,
    password,
    deviceName,
    transactionId
  ) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          transid: "123-1234567890",
          status: "submitted",
          cloudpaystatus: "Transaction accepted",
        });
      }, 2000);
    });
  };

  mockPay = async (amount) => {
    const transactionMakeResponse = await this.mockMakeTransaction(
      TCReadersModel.getAccountCredentials().customerId,
      TCReadersModel.getAccountCredentials().password,
      amount,
      TCConnectionDetails.DEVICE_NAME
    );
    TCConnectionDetails.currentTransactionId =
      transactionMakeResponse.cloudpayid;
    const mockCheckTransactionReponse = await this.mockCheckTransaction(
      TCReadersModel.getAccountCredentials().customerId,
      TCReadersModel.getAccountCredentials().password,
      TCConnectionDetails.DEVICE_NAME,
      TCConnectionDetails.currentTransactionId
    );
    return mockCheckTransactionReponse;
  };
}
