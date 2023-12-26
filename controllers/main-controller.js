import { mainView } from "../views/main-view.js";
import { AUTHENTICATION_METHODS_FORMS } from "../ui-components/authentication-forms.js";
import { READER_SELECTION_METHODS_FORMS } from "../ui-components/reader-selection-forms.js";

document.addEventListener("DOMContentLoaded", () => {
  mainView.listPaymentGateways(showPaymentGateway);
  mainView.listPaymentGatewaysinDropdown(showPaymentGateway);
});

/**
 * Responsible for calling the driver selected.
 *
 * @param {Driver} driver
 */
const showPaymentGateway = (driver) => {
  driver.load();
  mainView.addSettings([
    {
      name: "Change credentials",
      callbackFunction: () => {
        return AUTHENTICATION_METHODS_FORMS[driver.getAuthenticationMethod()](
          driver.saveAuthenticationDetails,
          driver.getAuthenticationUnderUse()
        );
      },
    },
    {
      name: "Change reader",
      callbackFunction: () => {
        return READER_SELECTION_METHODS_FORMS[driver.getReaderChoosingMethod()](
          driver.saveReader,
          driver.getReaderUnderUse()
        );
      },
    },
  ]);

  if (driver.getReaderUnderUse() && driver.getAuthenticationUnderUse()) {
    mainView.renderPayForm();
  } else {
    mainView.renderMultiStepForm();
  }
};
