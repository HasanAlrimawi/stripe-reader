import { BaseDriver } from "../drivers/base-driver.js";
export class StripeDriver extends BaseDriver {
  static stripeDriverInstance_;

  static getInstance() {
    if (!this.stripeDriverInstance_) {
      this.stripeDriverInstance_ = new this();
    }
    return this.stripeDriverInstance_;
  }

  /** Represents the APIs endpoint URL used */
  #STRIPE_API_URL = "https://api.stripe.com/v1";

  /**
   * Gets the readers that are registered to the stripe terminal
   *     and saves them in the reader model.
   *
   * @param {string} apiSecretKey
   * @returns {object<string, string} The availabe readers registered to terminal
   */
  async getReadersAvailable(apiSecretKey) {
    return await fetch(`${this.#STRIPE_API_URL}/terminal/readers`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }).then((res) => {
      return res.json();
    });
  }

  /**
   * Creates payment intent with the specifed amount in cents.
   *
   * @param {string} apiSecretKey
   * @param {string} amount represents the amount of the transaction to take place
   * @returns {object}
   */
  async #startIntent(apiSecretKey, amount) {
    return await fetch(`${this.#STRIPE_API_URL}/payment_intents`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `amount=${amount}&currency=usd&payment_method_types[]=card_present`,
      // body: `amount=${amount}&currency=usd&payment_method=pm_card_cvcCheckFail&capture_method=automatic_async&automatic_payment_methods[enabled]=true&automatic_payment_methods[allow_redirects]=never`,
    }).then((res) => {
      return res.json();
    });
  }

  /**
   * Handles the process of the payment
   *
   * @param {string} apiSecretKey
   * @param {string} paymentIntentId Represents the payment intent returned from
   *     the collect payment API
   * @param {string} readerId
   * @returns {object} intent Represents the returned intent from the process
   *     payment if successful, and the error object if it failed
   */
  async #processPayment(apiSecretKey, paymentIntentId, readerId) {
    return await fetch(
      `${
        this.#STRIPE_API_URL
      }/terminal/readers/${readerId}/process_payment_intent`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${apiSecretKey}`,
        },
        body: `payment_intent=${paymentIntentId}`,
      }
    ).then((res) => {
      return res.json();
    });
  }

  /**
   * Cancels the specified intent in some failure cases.
   *
   * @param {string} apiSecretKey
   * @param {string} intentId
   * @returns {object} The intent that has been canceled
   */
  async cancelIntent(apiSecretKey, intentId) {
    return await fetch(
      `${this.#STRIPE_API_URL}/payment_intents/${intentId}/cancel`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${apiSecretKey}`,
        },
      }
    ).then((res) => {
      return res.json();
    });
  }

  /**
   * Takes the responsibility of the payment flow from intent making to
   *     payment processing and cancelling if needed.
   *
   * @param {string} apiSecretKey
   * @param {number} amount Represents the transaction amount
   * @param {string} readerId
   * @returns {object}
   */
  pay = async (apiSecretKey, amount, readerId) => {
    const intent = await this.#startIntent(apiSecretKey, amount);

    if (intent?.error) {
      // In this case the intent has been created but should be canceled
      if (intent.error.code == !"amount_too_small") {
        await this.cancelIntent(apiSecretKey, intent.id);
      }
      throw `Payment failed: ${intent.error.message}`;
    } else {
      const result = await this.#processPayment(
        apiSecretKey,
        intent.id,
        readerId
      );

      if (result?.error) {
        await this.cancelIntent(apiSecretKey, intent.id);
        throw `Payment failed: ${result.error.message}`;
      } else {
        return {
          intent: result,
          success: "success",
        };
      }
    }
  };

  /**
   * Retrieves the intent defined, to check the payment intent status.
   *
   * @param {string} apiSecretKey
   * @param {string} intentId
   * @returns {object} The intent required
   */
  retrieveTransaction = async (apiSecretKey, intentId) => {
    return await fetch(`${this.#STRIPE_API_URL}/payment_intents/${intentId}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Bearer ${apiSecretKey}`,
      },
    }).then((res) => {
      return res.json();
    });
  };
}
