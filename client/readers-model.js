/**
 * @fileoverview Includes what readers are available, and which one is connnected.
 */
export const ReadersModel = (function () {
  let readersAvailable_ = undefined;
  let readerConnected_ = undefined;

  function getReadersAvailable() {
    return readersAvailable_;
  }
  function setReadersAvailable(newAvailableReaders) {
    readersAvailable_ = newAvailableReaders;
  }

  function getReaderConnected() {
    return readerConnected_;
  }

  function setReaderConnected(newConnectedReader) {
    readerConnected_ = newConnectedReader;
  }

  return {
    getReadersAvailable,
    setReadersAvailable,
    getReaderConnected,
    setReaderConnected,
  };
})();
