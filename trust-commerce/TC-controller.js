import { TCConnectionDetails } from "../constants/TC-connection-details.js";
import { BaseController } from "../controllers/base-controller.js";
import { TCReadersModel } from "./TC-model.js";
import { TCReaderView } from "./TC-view.js";

export class TCController extends BaseController {
  static tcControllerInstance_;

  static getInstance() {
    if (!this.stripeControllerInstance_) {
      this.stripeControllerInstance_ = new this();
    }
    return this.stripeControllerInstance_;
  }

  renderView = () => {
    this.onStart();

    TCReaderView.addPresetsButtons();

    document
      .getElementById("add-reader-button")
      .addEventListener("click", () => {
        document
          .getElementById("device-space")
          .insertAdjacentElement(
            "beforeend",
            TCReaderView.defineReaderDeviceCard(this.saveDeviceDetails)
          );
      });

    document
      .getElementById("set-account-credentials-button")
      .addEventListener("click", () => {
        document
          .getElementById("device-space")
          .insertAdjacentElement(
            "beforeend",
            TCReaderView.accountCredentialsCard(this.saveAccountCredentials)
          );
      });

    document.getElementById("pay-btn").addEventListener("click", this.pay);
    document
      .getElementById("payment-form-buttons")
      .insertAdjacentElement("beforeend", TCReaderView.createCheckButton());
    document
      .getElementById("check-pay")
      .addEventListener("click", this.mockCheckTransaction);
  };

  saveAccountCredentials = (event) => {
    event.preventDefault();
    const customerId = document.getElementById("customer-id").value;
    const password = document.getElementById("password").value;
    localStorage.setItem(
      TCConnectionDetails.TC_ACCOUNT_LOCAL_STORAGE,
      JSON.stringify({
        customerId: customerId,
        password: password,
      })
    );
    TCReadersModel.setAccountCredentials({
      customerId: customerId,
      password: password,
    });
  };

  saveDeviceDetails = (event) => {
    event.preventDefault();
    const deviceName = document.getElementById("device-name").value;
    const deviceSerialNumber = document.getElementById("serial-number").value;
    localStorage.setItem(
      TCConnectionDetails.TC_READER_SAVED_LOCAL_STORAGE,
      JSON.stringify({
        deviceName: deviceName,
        deviceSerialNumber: deviceSerialNumber,
      })
    );
    TCReadersModel.setReaderUsed({
      deviceName: deviceName,
      deviceSerialNumber: deviceSerialNumber,
    });
  };

  onStart = () => {
    // To use the device that is already added and saved in the local storage.
    if (
      localStorage.getItem(
        TCConnectionDetails.TC_READER_SAVED_LOCAL_STORAGE
      ) !== null
    ) {
      TCReadersModel.setReaderUsed(
        JSON.parse(
          localStorage.getItem(
            TCConnectionDetails.TC_READER_SAVED_LOCAL_STORAGE
          )
        )
      );
    }

    // To use the account credentials that are already added and saved in the local storage.
    if (
      localStorage.getItem(TCConnectionDetails.TC_ACCOUNT_LOCAL_STORAGE) !==
      null
    ) {
      TCReadersModel.setAccountCredentials(
        JSON.parse(
          localStorage.getItem(TCConnectionDetails.TC_ACCOUNT_LOCAL_STORAGE)
        )
      );
    }
  };

  pay = async () => {
    const paymentStatus = document.getElementById("payment-status");
    // if there isn't a defined reader for transaction or account credentials
    //     not specified then payment can't be done
    if (
      TCReadersModel.getAccountCredentials() === undefined ||
      TCReadersModel.getReaderUsed() === undefined
    ) {
      paymentStatus.value =
        "Make sure to set account credentials and device details.";
      console.log("LEFT");
      return;
    }
    const amount = document.getElementById("payment-amount").value;

    if (isNaN(amount) || !amount) {
      paymentStatus.value = "Make sure to enter a numeric amount";
      return;
    }

    paymentStatus.value = "pending...";

    if (TCConnectionDetails.DEMO_APP) {
      const transactionMakeResponse = await communicatorTc.mockMakeTransaction(
        TCReadersModel.getAccountCredentials().customerId,
        TCReadersModel.getAccountCredentials().password,
        amount,
        TCConnectionDetails.DEVICE_NAME
      );
      TCConnectionDetails.currentTransactionId =
        transactionMakeResponse.cloudpayid;
      paymentStatus.value = `Transaction: ${transactionMakeResponse.cloudpaystatus}`;
    } else {
      const deviceCheckResponse = await communicatorTc.checkDevice(
        customerId,
        password
      );
      if (deviceCheckResponse.devicestatus === "connected") {
        // make the transaction.https://docs.trustcommerce.com/1777da137/p/61c588-creating-a-cp-transaction-request
        const transactionResponse = await communicatorTc.makeTransaction(
          TCReadersModel.getAccountCredentials().customerId,
          TCReadersModel.getAccountCredentials().password,
          amount,
          TCConnectionDetails.DEVICE_NAME
        );
        TCConnectionDetails.currentTransactionId =
          transactionResponse.cloudpayid;
        if (transactionResponse.cloudpaystatus === "submitted") {
          TCConnectionDetails.currentTransactionId =
            transactionResponse.cloudpayid;
        } else if (transactionResponse.cloudpaystatus?.error) {
          paymentStatus.value = "error occurred";
          //handle failure of the transaction request
        } else {
          paymentStatus.value =
            "Device isn't connected to cloud payment services.";
        }
      }
    }
  };

  mockCheckTransaction = async () => {
    const paymentStatus = document.getElementById("payment-status");
    if (TCConnectionDetails.currentTransactionId.length === 0) {
      paymentStatus.value = "No transaction made to check its status.";
    }
    paymentStatus.value = "pending...";
    const mockCheckTransactionReponse =
      await communicatorTc.mockCheckTransaction(
        TCReadersModel.getAccountCredentials().customerId,
        TCReadersModel.getAccountCredentials().password,
        TCConnectionDetails.DEVICE_NAME,
        TCConnectionDetails.currentTransactionId
      );
    paymentStatus.value = mockCheckTransactionReponse.cloudpaystatus;
  };

  checkTransactionResult = async () => {
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
  };

  destroy = () => {
    document.getElementById("add-reader-button").remove();
    document.getElementById("set-account-credentials-button").remove();
    document.getElementById("title").textContent = "Peripherals";
  };
}
