/**
 * @fileoverview Includes what readers are available, and which one is connnected.
 */
export const TCReadersModel = (function () {
  let readerConnected_ = undefined;

  let accountCredentials_ = undefined;

  function getReaderUsed() {
    return readerConnected_;
  }

  function setReaderUsed(newConnectedReader) {
    readerConnected_ = newConnectedReader;
  }

  function setAccountCredentials(credentials) {
    accountCredentials_ = credentials;
  }

  function getAccountCredentials() {
    return accountCredentials_;
  }

  return {
    setReaderUsed,
    getReaderUsed,
    getAccountCredentials,
    setAccountCredentials,
  };
})();
