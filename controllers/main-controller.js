import { mainView } from "../views/main-view.js";
import { AUTHENTICATION_METHODS_FORMS } from "../ui-components/authentication-forms.js";
import { READER_SELECTION_METHODS_FORMS } from "../ui-components/reader-selection-forms.js";
import { PAYMENT_GATEWAYS } from "../constants/payment-gateways-registered.js";
import { MULTIPLE_STEPS_FORM_GENERATION } from "../ui-components/multiple-steps-forms.js";

document.addEventListener("DOMContentLoaded", () => {
  const paymentGatewaysLabels = [];
  PAYMENT_GATEWAYS.forEach((driver) =>
    paymentGatewaysLabels.push(driver.LABEL)
  );
  mainView.listPaymentGateways(paymentGatewaysLabels, showPaymentGateway);
  mainView.listPaymentGatewaysinDropdown(
    paymentGatewaysLabels,
    showPaymentGateway
  );
});

/** Represents the payment gateways driver that is currently active */
let CURRENT_ACTIVE_DRIVER = undefined;

/**
 * Responsible for calling the driver selected.
 *
 * @param {String} (paymentGatewaySelected Represents the label of the driver
 *     selected
 */
const showPaymentGateway = (paymentGatewaySelected) => {
  if (paymentGatewaySelected == CURRENT_ACTIVE_DRIVER?.LABEL) {
    return;
  }

  CURRENT_ACTIVE_DRIVER = PAYMENT_GATEWAYS.filter(
    (gateway) => gateway.LABEL == paymentGatewaySelected
  )[0];

  mainView.clearSettingsMenu();
  mainView.clearPaymentGatewaySpace();
  mainView.updateTitle(CURRENT_ACTIVE_DRIVER.LABEL);

  CURRENT_ACTIVE_DRIVER.DRIVER.load();
  mainView.addSettings([
    {
      name: "Change credentials",
      callbackFunction: () => {
        return AUTHENTICATION_METHODS_FORMS[
          CURRENT_ACTIVE_DRIVER.DRIVER.getAuthenticationMethod()
        ](
          saveAuthentication,
          CURRENT_ACTIVE_DRIVER.DRIVER.getAuthenticationUnderUse()
        );
      },
    },
    {
      name: "Change reader",
      callbackFunction: () => {
        return READER_SELECTION_METHODS_FORMS[
          CURRENT_ACTIVE_DRIVER.DRIVER.getReaderChoosingMethod()
        ](
          saveReader,
          CURRENT_ACTIVE_DRIVER.DRIVER.getReaderUnderUse(),
          getReadersByAPI()
        );
      },
    },
  ]);

  if (
    CURRENT_ACTIVE_DRIVER.DRIVER.getReaderUnderUse() &&
    CURRENT_ACTIVE_DRIVER.DRIVER.getAuthenticationUnderUse()
  ) {
    mainView.renderPayForm(pay);
  } else {
    const multipleStepsForm = MULTIPLE_STEPS_FORM_GENERATION[
      CURRENT_ACTIVE_DRIVER.DRIVER.getMultipleStepsFormMethod()
    ](
      AUTHENTICATION_METHODS_FORMS[
        CURRENT_ACTIVE_DRIVER.DRIVER.getAuthenticationMethod()
      ](
        saveAuthentication,
        CURRENT_ACTIVE_DRIVER.DRIVER.getAuthenticationUnderUse()
      ),
      READER_SELECTION_METHODS_FORMS[
        CURRENT_ACTIVE_DRIVER.DRIVER.getReaderChoosingMethod()
      ](
        saveReader,
        CURRENT_ACTIVE_DRIVER.DRIVER.getReaderUnderUse(),
        getReadersByAPI()
      ),
      () => {
        mainView.renderPayForm(pay);
      }
    );

    mainView.renderMultiStepForm(multipleStepsForm);
  }
};

/**
 * Saves the authentication details passed through the function by using
 *     the payment gateway's driver saving method of authentication.
 *
 * @param {object} authenticationDetails Represents the authentication details
 *     needed for the payment gateway driver under use
 */
const saveAuthentication = (authenticationDetails) => {
  CURRENT_ACTIVE_DRIVER.DRIVER.saveAuthenticationDetails(authenticationDetails);
};

/**
 * Saves the reader passed through the function by using
 *     the payment gateway's driver saving method of the reader to use.
 *
 * @param {string} reader The reader to use when making transactions
 */
const saveReader = (reader) => {
  CURRENT_ACTIVE_DRIVER.DRIVER.saveReader(reader);
};

/**
 * Calls the payment gateway's driver pay method and passes the amount of
 *    transaction.
 *
 * @param {number} amount The amount of the transaction
 * @returns {Object}
 */
const pay = async (amount) => {
  return await CURRENT_ACTIVE_DRIVER.DRIVER.pay(amount);
};

/**
 * Calls the payment gateway's driver under use method if found to get the
 *     readers registered to the payment gateway account.
 *
 * @returns {Promise<object>} Holds the readers registered to the account used
 */
const getReadersByAPI = async () => {
  try {
    return CURRENT_ACTIVE_DRIVER.DRIVER?.getReadersAvailable
      ? await CURRENT_ACTIVE_DRIVER.DRIVER?.getReadersAvailable()
      : undefined;
  } catch (error) {
    alert(error);
  }
};
