import { BaseDriver } from "./base-driver.js";
export class StripeDriver extends BaseDriver {
  constructor() {
    super("https://api.stripe.com/v1");
  }
  static stripeDriverInstance_;

  static getInstance() {
    if (!this.stripeDriverInstance_) {
      this.stripeDriverInstance_ = new this();
    }
    return this.stripeDriverInstance_;
  }

  #LOCAL_STORAGE_API_KEY = "STRIPE_API_KEY";
  #LOCAL_STORAGE_READER_UNDER_USE_KEY = "STRIPE_READER_UNDER_USE";

  /**
   * Returns what authentication method this driver needs so that the
   *     controller knows what form to show so the
   *     user enters his/her credentials.
   *
   * @returns {string} The authentication method type
   */
  getAuthenticationMethod = () => {
    return "KEY";
  };

  /**
   * Returns what reader choosing method this driver supports so that the
   *     controller knows what form to show so the user
   *     can enter or choose his/her reader device.
   *
   * @returns {string} The reader selection method
   */
  getReaderChoosingMethod = () => {
    return "PICK_FROM_LIST_BY_API";
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
   * Returns what reader is under use.
   *
   * @returns {string} reader under use
   */
  getReaderUnderUse = () => {
    return localStorage.getItem(this.#LOCAL_STORAGE_READER_UNDER_USE_KEY);
  };

  /**
   * Returns the api key that is under use.
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

  getReadersAvailable = async () => {
    return await this.getReadersAvailableKeyBased();
  };

  pay = async (amount) => {
    try {
      return await this.payBasedOnKey(amount);
    } catch (error) {
      throw error;
    }
  };
}
