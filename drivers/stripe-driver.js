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

  /** Represents the api key used to authenticate requests to stripe */
  #apiKey = undefined;
  /** Represents the reader id that is used for making transactions */
  #readerUnderUse = undefined;

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
    this.setReaderUnderUse(readerModel);
    localStorage.setItem(
      this.#LOCAL_STORAGE_READER_UNDER_USE_KEY,
      this.#readerUnderUse
    );
  };

  /**
   * Saves the credentials which are the customer id and the password
   *     that shall be used for making transactions on the account's behalf.
   *
   * @param {Object} credentials Represents the customer id and password
   *     wrapped in an object
   */
  saveAuthenticationDetails = (apiKey) => {
    this.#apiKey = apiKey;
    this.setAuthentication(apiKey);
    localStorage.setItem(this.#LOCAL_STORAGE_API_KEY, this.#apiKey);
  };

  /**
   * Loads any saved values the driver needs from local storage and any
   *     todos the driver should do first.
   */
  load = () => {
    if (localStorage.getItem(this.#LOCAL_STORAGE_API_KEY)) {
      this.#apiKey = localStorage.getItem(this.#LOCAL_STORAGE_API_KEY);
      this.setAuthentication(this.#apiKey);
    }

    if (localStorage.getItem(this.#LOCAL_STORAGE_READER_UNDER_USE_KEY)) {
      this.#readerUnderUse = localStorage.getItem(
        this.#LOCAL_STORAGE_READER_UNDER_USE_KEY
      );
      this.setReaderUnderUse(this.#readerUnderUse);
    }
  };

  /**
   * Returns the api key that is under use.
   *
   * @returns {string} api key
   */
  getAuthenticationUnderUse = () => {
    return this.#apiKey;
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
