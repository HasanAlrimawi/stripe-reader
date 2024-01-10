import {
  AuthenticationMethod,
  MultipleStepsFormSelection,
  ReaderSelectionMethod,
} from "../constants/ui-components-selection.js";
import { BaseDriver } from "./base-driver.js";

export class TCDriver extends BaseDriver {
  constructor() {
    super("https://drab-puce-ladybug-coat.cyclic.app/tc-proxy");
    this.#LOCAL_STORAGE_ACCOUNT_CREDENTIALS_KEY =
      "TC_RETAIL_ACCOUNT_CREDENTIALS";
    this.#LOCAL_STORAGE_READER_UNDER_USE_KEY = "TC_READER";
  }
  static #tcDriver;

  static getInstance() {
    if (!this.#tcDriver) {
      this.#tcDriver = new this();
    }
    return this.#tcDriver;
  }

  #LOCAL_STORAGE_ACCOUNT_CREDENTIALS_KEY;
  #LOCAL_STORAGE_READER_UNDER_USE_KEY;

  /**
   * Returns what authentication method this driver needs so that the
   *     controller knows what form to show so the
   *     user enters his/her credentials.
   *
   * @override
   *
   * @returns {string} The authentication method type
   */
  getAuthenticationMethod = () => {
    return AuthenticationMethod.USERNAME_AND_PASSWORD;
  };

  /**
   * Returns what reader choosing method this driver supports so that the
   *     controller knows what form to show so the user
   *     can enter or choose his/her reader device.
   *
   * @override
   *
   * @returns {string} The reader selection method
   */
  getReaderChoosingMethod = () => {
    return ReaderSelectionMethod.MANUAL_ENTRY;
  };

  /**
   * Returns the method this driver uses for making multi steps form
   *
   * @override
   *
   * @returns {string}
   */
  getMultipleStepsFormMethod = () => {
    return MultipleStepsFormSelection.DEFAULT;
  };

  /**
   * Returns what reader is under use.
   *
   * @override
   *
   * @returns {string} reader under use
   */
  getReaderUnderUse = () => {
    return localStorage.getItem(this.#LOCAL_STORAGE_READER_UNDER_USE_KEY);
  };

  /**
   * Returns the account credentials that are under use.
   *
   * @override
   *
   * @returns {Object} account credentials attribute
   */
  getAuthenticationUnderUse = () => {
    return JSON.parse(
      localStorage.getItem(this.#LOCAL_STORAGE_ACCOUNT_CREDENTIALS_KEY)
    );
  };

  /**
   * Saves the reader device name and modelNumber to be used for transactions
   *     in the local storage and for this driver's attribute.
   *
   * @override
   *
   * @param {string} readerModel Represents the reader to be used for
   *     transactions
   */
  saveReader = (readerModel) => {
    localStorage.setItem(this.#LOCAL_STORAGE_READER_UNDER_USE_KEY, readerModel);
    this.setReaderUnderUse(readerModel);
  };

  /**
   * @typedef {Object} TrustCommerceRetailAccount
   * @property {string} customerId
   * @property {string} password
   */

  /**
   * Saves the credentials which are the customer id and the password
   *     that shall be used for making transactions on the account's behalf.
   *
   * @override
   *
   * @param {TrustCommerceRetailAccount} credentials Represents the customer id and password
   *     wrapped in an object
   */
  saveAuthenticationDetails = (credentials) => {
    localStorage.setItem(
      this.#LOCAL_STORAGE_ACCOUNT_CREDENTIALS_KEY,
      JSON.stringify(credentials)
    );
    this.setAuthentication(credentials);
  };

  /**
   * Loads any saved values the driver needs from local storage and any
   *     todos the driver should do first.
   *
   * @override
   */
  load = () => {
    if (localStorage.getItem(this.#LOCAL_STORAGE_ACCOUNT_CREDENTIALS_KEY)) {
      this.setAuthentication(
        JSON.parse(
          localStorage.getItem(this.#LOCAL_STORAGE_ACCOUNT_CREDENTIALS_KEY)
        )
      );
    }

    if (localStorage.getItem(this.#LOCAL_STORAGE_READER_UNDER_USE_KEY)) {
      this.setReaderUnderUse(
        localStorage.getItem(this.#LOCAL_STORAGE_READER_UNDER_USE_KEY)
      );
    }
  };

  /**
   * Responsible for making payment transaction.
   *
   * @override
   *
   * @param {number} amount The amount of transaction in cents
   * @returns {Promise<object>}
   */
  pay = (amount) => {
    try {
      return this.payAccountBased(amount);
    } catch (error) {
      throw error;
    }
  };
}
