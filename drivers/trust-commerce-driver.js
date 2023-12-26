import { BaseDriver } from "./base-driver.js";

export class TCDriver extends BaseDriver {
  constructor() {
    super("https://drab-puce-ladybug-coat.cyclic.app/tc-proxy");
  }
  static #tcDriver;

  static getInstance() {
    if (!this.#tcDriver) {
      this.#tcDriver = new this();
    }
    return this.#tcDriver;
  }

  /** Represents the account credentials used to authenticate requests made
   *     to Trust commerce
   */
  #accountCredentials = undefined;
  /** Represents the reader model and serial number that is used for
   *     making transactions
   */
  #readerUnderUse = undefined;

  #LOCAL_STORAGE_ACCOUNT_CREDENTIALS_KEY = "TC_RETAIL_ACCOUNT_CREDENTIALS";
  #LOCAL_STORAGE_READER_UNDER_USE_KEY = "TC_READER";

  /**
   * Returns what authentication method this driver needs so that the
   *     controller knows what form to show so the
   *     user enters his/her credentials.
   *
   * @returns {string} The authentication method type
   */
  getAuthenticationMethod = () => {
    return "USER_AND_PASSWORD";
  };

  /**
   * Returns what reader choosing method this driver supports so that the
   *     controller knows what form to show so the user
   *     can enter or choose his/her reader device.
   *
   * @returns {string} The reader selection method
   */
  getReaderChoosingMethod = () => {
    return "MANUAL_ENTRY";
  };

  /**
   * Returns what reader is under use.
   *
   * @returns {string} reader under use
   */
  getReaderUnderUse = () => {
    return this.#readerUnderUse;
  };

  /**
   * Returns the method this driver uses for making multi steps form
   *
   * @returns {string}
   */
  getMultipleStepsFormMethod = () => {
    return "DEFAULT";
  };

  /**
   * Saves the reader device name and modelNumber to be used for transactions
   *     in the local storage and for this driver's attribute.
   *
   * @param {string} readerModel Represents the reader to be used for
   *     transactions
   */
  saveReader = (readerModel) => {
    this.#readerUnderUse = readerModel;
    localStorage.setItem(
      this.#LOCAL_STORAGE_READER_UNDER_USE_KEY,
      this.#readerUnderUse
    );
    this.setReaderUnderUse(this.#readerUnderUse);
  };

  /**
   * Saves the credentials which are the customer id and the password
   *     that shall be used for making transactions on the account's behalf.
   *
   * @param {Object} credentials Represents the customer id and password
   *     wrapped in an object
   */
  saveAuthenticationDetails = (customerId, password) => {
    this.#accountCredentials = { customerId: customerId, password: password };
    localStorage.setItem(
      this.#LOCAL_STORAGE_ACCOUNT_CREDENTIALS_KEY,
      JSON.stringify(this.#accountCredentials)
    );
    this.setAuthentication(this.#accountCredentials);
  };

  /**
   * Loads any saved values the driver needs from local storage and any
   *     todos the driver should do first.
   */
  load = () => {
    if (localStorage.getItem(this.#LOCAL_STORAGE_ACCOUNT_CREDENTIALS_KEY)) {
      this.#accountCredentials = JSON.parse(
        localStorage.getItem(this.#LOCAL_STORAGE_ACCOUNT_CREDENTIALS_KEY)
      );
      this.setAuthentication(this.#accountCredentials);
    }

    if (localStorage.getItem(this.#LOCAL_STORAGE_READER_UNDER_USE_KEY)) {
      this.#readerUnderUse = localStorage.getItem(
        this.#LOCAL_STORAGE_READER_UNDER_USE_KEY
      );
      this.setReaderUnderUse(this.#readerUnderUse);
    }
  };

  /**
   * Returns the account credentials that are under use.
   *
   * @returns {Object} account credentials attribute
   */
  getAuthenticationUnderUse = () => {
    return this.#accountCredentials;
  };

  pay = async (amount) => {
    try {
      return await this.payAccountBased(amount);
    } catch (error) {
      throw error;
    }
  };
}
