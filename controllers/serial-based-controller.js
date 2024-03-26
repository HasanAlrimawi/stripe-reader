import { ReaderSelectionForms } from "../ui-components/reader-selection-forms.js";
import { MultipleStepsForms } from "../ui-components/multiple-steps-forms.js";
import { mainView } from "../views/main-view.js";

export class SerialBasedController {
  constructor(driver) {
    this.driver = driver;
  }

  /**
   * Responsible for loading the driver used and binding the views with their
   *      corresponding functions that are initiated on user's interaction.
   */
  start = () => {
    mainView.addSettings([
      {
        name: "Change reader",
        callbackFunction: () => {
          return ReaderSelectionForms[this.driver.getReaderChoosingMethod()](
            this.setConnectReaderUnderUse,
            this.driver.getReaderUnderUse()
          );
        },
      },
    ]);

    // Checks if the authentication details and the reader to use are all set
    // in order to make transactions, and if not, then multiple-steps form will
    // be displayed
    if (this.driver.getReaderUnderUse()) {
      mainView.renderPayForm(this.pay);
    } else {
      // wraps the forms to be grouped in a multi-step form
      const forms = [
        {
          title: "Connect reader",
          form: ReaderSelectionForms[this.driver.getReaderChoosingMethod()](
            this.setConnectReaderUnderUse,
            this.driver.getReaderUnderUse()
          ),
        },
      ];
      const multipleStepsForm = MultipleStepsForms[
        this.driver.getMultipleStepsFormMethod()
      ](forms, () => {
        mainView.renderPayForm(this.pay);
      });

      mainView.renderMultiStepForm(multipleStepsForm);
    }
  };

  /**
   * Saves the reader passed through the function by using
   *     the payment gateway's driver saving method of the reader to use.
   *
   * @param {string} reader The reader to use when making transactions
   */
  setConnectReaderUnderUse = async (reader) => {
    return await this.driver.setConnectReaderUnderUse(reader);
  };

  /**
   * @typedef {Object} payErrorResult
   * @property {string} error
   */

  /**
   * @typedef {Object} payNormalResult
   * @property {string} status
   * @property {number} amount
   */

  /**
   * Calls the payment gateway's driver pay method and passes the amount of
   *    transaction.
   *
   * @param {number} amount The amount of the transaction
   * @returns {payNormalResult | payErrorResult}
   */
  pay = async (amount) => {
    return await this.driver.pay(amount);
  };
}
