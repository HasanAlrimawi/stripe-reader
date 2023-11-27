/**
 * @fileoverview Includes what readers are available, and which one is connnected.
 */
export const stripeReadersModel = (function () {
  let readersList_ = undefined;
  let readerConnected_ = undefined;

  function getReadersList() {
    return readersList_;
  }
  function setReadersList(newListReaders) {
    readersList_ = newListReaders;
  }

  function getReaderUsed() {
    return readerConnected_;
  }

  function setReaderUsed(newConnectedReader) {
    readerConnected_ = newConnectedReader;
  }

  return {
    getReadersList,
    setReadersList,
    getReaderUsed,
    setReaderUsed,
  };
})();
