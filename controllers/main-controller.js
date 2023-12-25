import { multipleStepsFormGeneration } from "../ui-components/multiple-steps-forms.js";
import { currentActiveDriver } from "../constants/payment-gateways.js";
import { mainView } from "../views/main-view.js";
import { authMethods } from "../ui-components/auth-methods.js";
import { readerChoosingMethods } from "../ui-components/reader-selection-methods.js";

document.addEventListener("DOMContentLoaded", () => {
  mainView.listPaymentGateways(showPaymentGateway);
  mainView.listPaymentGatewaysinDropdown(showPaymentGateway);
  document
    .getElementById("theme-icon")
    .addEventListener("click", mainView.changeTheme);
});

/**
 * Calls the wanted device's starting function that renders its view.
 *
 * @param {Controller} deviceController
 */
const showPaymentGateway = (driver) => {
  document.getElementById("payment-gateway-space").innerHTML = "";
  driver.load();
  mainView.addSettings([
    {
      name: "Change credentials",
      callbackFunction: () => {
        return authMethods[driver.getAuthenticationMethod()](
          driver.saveAuthenticationDetails,
          driver.getAuthenticationUnderUse()
        );
      },
    },
    {
      name: "Change reader",
      callbackFunction: () => {
        return readerChoosingMethods[driver.getReaderChoosingMethod()](
          driver.saveReader,
          driver.getReaderUnderUse()
        );
      },
    },
  ]);

  if (driver.getReaderUnderUse() && driver.getAuthenticationUnderUse()) {
    renderPayForm(pay);
  } else {
    document
      .getElementById("payment-gateway-space")
      .insertAdjacentElement(
        "beforeend",
        multipleStepsFormGeneration[driver.getMultipleStepsFormMethod()](
          authMethods[driver.getAuthenticationMethod()](
            driver.saveAuthenticationDetails,
            driver.getAuthenticationUnderUse()
          ),
          readerChoosingMethods[driver.getReaderChoosingMethod()](
            driver.saveReader,
            driver.getReaderUnderUse()
          ),
          renderPayForm
        )
      );
  }
};

const renderPayForm = () => {
  document
    .getElementById("payment-gateway-space")
    .insertAdjacentElement("beforeend", mainView.payForm(pay));
};

const pay = async () => {
  const paymentStatus = document.getElementById("payment-status");
  const payButton = document.getElementById("pay-btn");
  const amount = document.getElementById("payment-amount").value;
  payButton.setAttribute("disabled", true);
  const amountAndPresetsCheck = checkPresetsAndAmount(amount);

  if (amountAndPresetsCheck?.error) {
    paymentStatus.value = amountAndPresetsCheck.error;
    payButton.removeAttribute("disabled");
    return;
  }
  paymentStatus.value = "pending...";
  let message = "Transaction Unsuccessful";

  try {
    const transactionResponse = await currentActiveDriver.DRIVER.pay(amount);
    payButton.removeAttribute("disabled");
    if (transactionResponse?.error) {
      message = `Transaction failure\nCause: ${transactionResponse.error}.`;
    } else {
      console.log(transactionResponse);
      message = `Transaction is ${transactionResponse}`;
    }
  } catch (faultyTransaction) {
    payButton.removeAttribute("disabled");

    if (faultyTransaction == "TypeError: Failed to fetch") {
      paymentStatus.value =
        "Make sure you're connected to internet then try again.";
      return;
    }
    message = faultyTransaction;
  }
  paymentStatus.value = message;
};

/**
 * Checks if there is a defined reader for transaction or account credentials
 *     not specified or if the amount entered isn't numeric then payment
 *     can't be done and returns error
 *
 * @param {number} amount
 * @returns {Object} An object with error attribute if violation found
 */
const checkPresetsAndAmount = (amount) => {
  if (isNaN(amount) || !amount) {
    return {
      error: "Make sure to enter a numeric amount",
    };
  }
  return;
};
