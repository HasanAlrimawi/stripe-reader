import {
  AuthenticationMethod,
  MultipleStepsFormSelection,
  ReaderSelectionMethod,
} from "../constants/ui-components-selection.js";
import { BaseDriver } from "./base-driver.js";

export class StripeDriver extends BaseDriver {
  constructor() {
    super("https://api.stripe.com/v1");
    this.#LOCAL_STORAGE_API_KEY = "STRIPE_API_KEY";
    this.#LOCAL_STORAGE_READER_UNDER_USE_KEY = "STRIPE_READER_UNDER_USE";
  }
  static #stripeDriverInstance;

  static getInstance() {
    if (!this.#stripeDriverInstance) {
      this.#stripeDriverInstance = new this();
    }
    return this.#stripeDriverInstance;
  }

  #LOCAL_STORAGE_API_KEY;
  #LOCAL_STORAGE_READER_UNDER_USE_KEY;

  /**
   * Returns what authentication method this driver needs so that the
   *     controller knows what form to show so the
   *     user enters his/her credentials.
   * @override
   *
   * @returns {string} The authentication method type
   */
  getAuthenticationMethod = () => {
    return AuthenticationMethod.API_KEY;
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
    return ReaderSelectionMethod.PICK_FROM_LIST_BY_API;
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
   * Returns the api key that is under use.
   *
   * @override
   *
   * @returns {string} api key
   */
  getAuthenticationUnderUse = () => {
    return localStorage.getItem(this.#LOCAL_STORAGE_API_KEY);
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
    this.setReaderUnderUse(readerModel);
    localStorage.setItem(this.#LOCAL_STORAGE_READER_UNDER_USE_KEY, readerModel);
  };

  /**
   * Saves the credentials which are the customer id and the password
   *     that shall be used for making transactions on the account's behalf.
   *
   * @override
   *
   * @param {Object} credentials Represents the customer id and password
   *     wrapped in an object
   */
  saveAuthenticationDetails = (apiKey) => {
    this.setAuthentication(apiKey);
    localStorage.setItem(this.#LOCAL_STORAGE_API_KEY, apiKey);
  };

  /**
   * Loads any saved values the driver needs from local storage and any
   *     todos the driver should do first.
   *
   * @override
   */
  load = () => {
    if (localStorage.getItem(this.#LOCAL_STORAGE_API_KEY)) {
      this.setAuthentication(localStorage.getItem(this.#LOCAL_STORAGE_API_KEY));
    }

    if (localStorage.getItem(this.#LOCAL_STORAGE_READER_UNDER_USE_KEY)) {
      this.setReaderUnderUse(
        localStorage.getItem(this.#LOCAL_STORAGE_READER_UNDER_USE_KEY)
      );
    }
  };

  /**
   * @override
   *
   */
  getReadersAvailable = async () => {
    return await this.getReadersAvailableKeyBased();
  };

  /**
   * Responsible for making payment transaction.
   *
   * @override
   *
   * @param {number} amount The amount of transaction in cents
   * @returns object
   */
  pay = async (amount) => {
    try {
      return await this.payBasedOnKey(amount);
    } catch (error) {
      throw error;
    }
  };
}
