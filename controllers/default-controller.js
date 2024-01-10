import { AuthenticationForms } from "../ui-components/authentication-forms.js";
import { ReaderSelectionForms } from "../ui-components/reader-selection-forms.js";
import { MultipleStepsForms } from "../ui-components/multiple-steps-forms.js";
import { mainView } from "../views/main-view.js";

export class DefaultController {
  constructor(driver) {
    this.driver = driver;
  }

  /**
   * Responsible for loading the driver used and binding the views with their
   *      corresponding functions that are initiated on user's interaction.
   */
  start = () => {
    this.driver.load();
    mainView.addSettings([
      {
        name: "Change credentials",
        callbackFunction: () => {
          return AuthenticationForms[
            this.driver.getAuthenticationMethod()
          ](this.saveAuthentication, this.driver.getAuthenticationUnderUse());
        },
      },
      {
        name: "Change reader",
        callbackFunction: () => {
          return ReaderSelectionForms[
            this.driver.getReaderChoosingMethod()
          ](
            this.saveReader,
            this.driver.getReaderUnderUse(),
            this.getReadersByAPI()
          );
        },
      },
    ]);

    // Checks if the authentication details and the reader to use are all set
    // in order to make transactions, and if not, then multiple-steps form will
    // be displayed
    if (
      this.driver.getReaderUnderUse() &&
      this.driver.getAuthenticationUnderUse()
    ) {
      mainView.renderPayForm(this.pay);
    } else {
      // wraps the forms to be grouped in a multi-step form
      const forms = [
        {
          title: "Account",
          form: AuthenticationForms[
            this.driver.getAuthenticationMethod()
          ](this.saveAuthentication, this.driver.getAuthenticationUnderUse()),
        },
        {
          title: "Reader",
          form: ReaderSelectionForms[
            this.driver.getReaderChoosingMethod()
          ](
            this.saveReader,
            this.driver.getReaderUnderUse(),
            this.getReadersByAPI()
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
   * Saves the authentication details passed through the function by using
   *     the payment gateway's driver saving method of authentication.
   *
   * @param {object} authenticationDetails Represents the authentication details
   *     needed for the payment gateway driver under use
   */
  saveAuthentication = (authenticationDetails) => {
    this.driver.saveAuthenticationDetails(authenticationDetails);
  };

  /**
   * Saves the reader passed through the function by using
   *     the payment gateway's driver saving method of the reader to use.
   *
   * @param {string} reader The reader to use when making transactions
   */
  saveReader = (reader) => {
    this.driver.saveReader(reader);
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

  /**
   * Calls the payment gateway's driver under use method if found to get the
   *     readers registered to the payment gateway account.
   *
   * @returns {function(): object} Holds the readers registered to the account used
   */
  getReadersByAPI = () => {
    try {
      return this.driver?.getReadersAvailable
        ? this.driver?.getReadersAvailable
        : undefined;
    } catch (error) {
      alert(error);
    }
  };
}
