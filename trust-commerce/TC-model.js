import { TCConnectionDetails } from "../constants/TC-connection-details.js";

/**
 * @fileoverview Includes what readers are available, and which one is connnected.
 */
export const TCReadersModel = (function () {
  let readerUsed_ = undefined;

  /**
   * Represents AccountCredentials object.
   * @typedef {Object} AccountCredentials
   * @property {number} customerId
   * @property {string} password
   */

  let accountCredentials_ = undefined;

  function getReaderUsed() {
    return readerUsed_;
  }

  /**
   * Sets the new defined reader name to be used in transaction and stores
   *     it in the local storage.
   *
   * @param {string} newReaderToUse
   */
  function setReaderUsed(newReaderToUse) {
    readerUsed_ = newReaderToUse;
    localStorage.setItem(
      TCConnectionDetails.TC_READER_SAVED_LOCAL_STORAGE_KEY,
      newReaderToUse
    );
  }

  /**
   * Sets the new defined account credentials to be used in transaction
   *     and stores them in the local storage.
   *
   * @param {Object} credentials Represents the account credentials
   */
  function setAccountCredentials(credentials) {
    accountCredentials_ = credentials;
    localStorage.setItem(
      TCConnectionDetails.TC_ACCOUNT_LOCAL_STORAGE_KEY,
      JSON.stringify(credentials)
    );
  }

  function getAccountCredentials() {
    return accountCredentials_;
  }

  /**
   * Loads the reader device and account credentials to be used from local
   *     storage.
   */
  function loadConfigFromLocalStorage() {
    // To use the device that is already added and saved in the local storage.
    if (
      localStorage.getItem(
        TCConnectionDetails.TC_READER_SAVED_LOCAL_STORAGE_KEY
      ) !== null
    ) {
      setReaderUsed(
        localStorage.getItem(
          TCConnectionDetails.TC_READER_SAVED_LOCAL_STORAGE_KEY
        )
      );
    }
    // To use the account credentials that are already added and saved in the local storage.
    if (
      localStorage.getItem(TCConnectionDetails.TC_ACCOUNT_LOCAL_STORAGE_KEY) !==
      null
    ) {
      accountCredentials_ = JSON.parse(
        localStorage.getItem(TCConnectionDetails.TC_ACCOUNT_LOCAL_STORAGE_KEY)
      );
    }
  }

  return {
    setReaderUsed,
    getReaderUsed,
    getAccountCredentials,
    setAccountCredentials,
    loadConfigFromLocalStorage,
  };
})();
