import { AUTHENTICATION_METHODS_FORMS } from "../ui-components/authentication-forms.js";
import { READER_SELECTION_METHODS_FORMS } from "../ui-components/reader-selection-forms.js";
import { MULTIPLE_STEPS_FORM_GENERATION } from "../ui-components/multiple-steps-forms.js";
import { mainView } from "../views/main-view.js";

export class BaseController {
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
          return AUTHENTICATION_METHODS_FORMS[
            this.driver.getAuthenticationMethod()
          ](this.#saveAuthentication, this.driver.getAuthenticationUnderUse());
        },
      },
      {
        name: "Change reader",
        callbackFunction: () => {
          return READER_SELECTION_METHODS_FORMS[
            this.driver.getReaderChoosingMethod()
          ](
            this.#saveReader,
            this.driver.getReaderUnderUse(),
            this.#getReadersByAPI()
          );
        },
      },
    ]);

    // Checks if the authentication details and the reader to use are all set
    // in order to make transactions, and if not, then multiple steps form will
    // be displayed
    if (
      this.driver.getReaderUnderUse() &&
      this.driver.getAuthenticationUnderUse()
    ) {
      mainView.renderPayForm(this.#pay);
    } else {
      const multipleStepsForm = MULTIPLE_STEPS_FORM_GENERATION[
        this.driver.getMultipleStepsFormMethod()
      ](
        AUTHENTICATION_METHODS_FORMS[this.driver.getAuthenticationMethod()](
          this.#saveAuthentication,
          this.driver.getAuthenticationUnderUse()
        ),
        READER_SELECTION_METHODS_FORMS[this.driver.getReaderChoosingMethod()](
          this.#saveReader,
          this.driver.getReaderUnderUse(),
          this.#getReadersByAPI()
        ),
        () => {
          mainView.renderPayForm(this.#pay);
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
  #saveAuthentication = (authenticationDetails) => {
    this.driver.saveAuthenticationDetails(authenticationDetails);
  };

  /**
   * Saves the reader passed through the function by using
   *     the payment gateway's driver saving method of the reader to use.
   *
   * @param {string} reader The reader to use when making transactions
   */
  #saveReader = (reader) => {
    this.driver.saveReader(reader);
  };

  /**
   * Calls the payment gateway's driver pay method and passes the amount of
   *    transaction.
   *
   * @param {number} amount The amount of the transaction
   * @returns {Object}
   */
  #pay = async (amount) => {
    return await this.driver.pay(amount);
  };

  /**
   * Calls the payment gateway's driver under use method if found to get the
   *     readers registered to the payment gateway account.
   *
   * @returns {function(): object} Holds the readers registered to the account used
   */
  #getReadersByAPI = () => {
    try {
      return this.driver?.getReadersAvailable
        ? this.driver?.getReadersAvailable
        : undefined;
    } catch (error) {
      alert(error);
    }
  };
}
