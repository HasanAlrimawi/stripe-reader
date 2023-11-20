import { BaseDriver } from "../communicators/base-driver.js";
import { TCConnectionDetails } from "../constants/TC-connection-details.js";

export class TCDriver extends BaseDriver {
  static #tcDriver;

  static getInstance() {
    if (!this.#tcDriver) {
      this.#tcDriver = new this();
    }
    return this.#tcDriver;
  }

  checkDevice = async (customerId, password) => {
    return await fetch(`${TCConnectionDetails.TC_API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `custid=${customerId}&password=${password}&action=devicestatus&device_name=${TCConnectionDetails.DEVICE_NAME}`,
    }).then((res) => {
      return res.json();
    });
  };

  makeTransaction = async (customerId, password, deviceName, amount) => {
    return await fetch(`${TCConnectionDetails.TC_API_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `custid=${customerId}&password=${password}&action=sale&device_name=${deviceName}&amount=${amount}`,
    }).then((res) => {
      return res.json();
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
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `custid=${customerId}&password=${password}&action=transstatus&
      device_name=${deviceName}&
      cloudpayid=${transactionId}&
      long_polling=y`,
    }).then((res) => {
      return res.json();
    });
  };
  // TODO constants related to driver should be here, only include the amount to the pay method
  pay = async (amount) => {
    const transactionResponse = await this.makeTransaction(
      TCReadersModel.getAccountCredentials().customerId,
      TCReadersModel.getAccountCredentials().password,
      amount,
      TCConnectionDetails.DEVICE_NAME
    );
    TCConnectionDetails.currentTransactionId = transactionResponse.cloudpayid;
    if (transactionResponse.cloudpaystatus === "submitted") {
      TCConnectionDetails.currentTransactionId = transactionResponse.cloudpayid;
      const transactionResult = await communicatorTc.checkTransaction(
        customerId,
        password,
        TCConnectionDetails.DEVICE_NAME,
        TCConnectionDetails.currentTransactionId
      );
      if (transactionResult.status === "approved") {
        //done
      } else {
        //address faulty/failed transaction.
      }
    } else if (transactionResponse.cloudpaystatus?.error) {
    //   paymentStatus.value = "error occurred";
      //handle failure of the transaction request
    } else {
    //   paymentStatus.value = "Device isn't connected to cloud payment services.";
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
      body: `custid=${customerId}&password=${password}&action=transstatus&
        device_name=${deviceName}&
        cloudpayid=${transactionId}`,
    }).then((res) => {
      return res.json();
    });
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
}
