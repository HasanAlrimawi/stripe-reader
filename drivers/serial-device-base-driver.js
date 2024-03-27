export class SerialDeviceBaseDriver {
  constructor(baudRate) {
    this.#baudRate = baudRate;
  }

  #baudRate;
  reader = undefined;

  load() {}
  getReaderChoosingMethod() {}
  getMultipleStepsFormMethod() {}
  pay() {}

  /**
   * Sets the serial port selected by the user, then opens it.
   *
   * @param {SerialPort} reader The serial port selected by user
   *
   * @returns {FunctionalitySuccess | ErrorObject}
   */
  setConnectReaderUnderUse = async (reader) => {
    this.reader = reader;
    return await this.connectReader();
  };

  /**
   * Returns serial port under use.
   *
   * @returns {SerialPort}
   */
  getReaderUnderUse = () => {
    return this.reader;
  };

  /**
   * @typedef {Object} FunctionalitySuccess
   * @property {boolean} success Conveys the success of the functionality
   */

  /**
   * @typedef {Object} ErrorObject
   * @property {boolean} error Conveys failure
   * @property {string} message Includes information about error
   */

  /**
   * @typedef {Object} ReadingSuccess
   * @property {string} success Success message to convey success
   * @property {Uint8Array} value The value that has been retrieved from
   *     serial port
   */

  /**
   * Opens/connects the serial port selected.
   *
   * @returns {FunctionalitySuccess | ErrorObject}
   */
  connectReader = async () => {
    try {
      await this.reader.open({ baudRate: this.#baudRate });
      this.reader.addEventListener("disconnect", (event) => {
        alert(
          `Device of VID ${device.vendorId} and PID ${device.productId} has been disconnected`
        );
        this.reader = undefined;
      });
      return {
        success: true,
      };
    } catch (error) {
      console.log(error);
      return {
        error: true,
        message: `Couldn't open reader ${error}`,
      };
    }
  };

  /**
   * Keeps on reading the serial port until there's nothing to read, or some
   *     fatal error occured.
   *
   * @returns {ReadingSuccess | ErrorObject}
   */
  read = async () => {
    const reader = this.reader.readable.getReader();
    let completeResponse = [];
    while (true) {
      try {
        const { value, done } = await reader.read();
        const arrayValue = Array.from(value);
        if (done) {
          reader.releaseLock();
          console.log("finished reading");
          return {
            success: "Success at reading",
            value: Uint8Array(completeResponse),
          };
        }
        if (value) {
          completeResponse.push(...arrayValue);
        }
      } catch (error) {
        console.error("Error while listening");
        return { error: true, message: error };
      }
    }
  };

  /**
   * Sends/writes the data or command passed through to the connected serial
   *     port.
   *
   * @param {Uint8Array} data Represents the data that sould be sent to the
   *     serial port connected
   */
  write = async (data) => {
    // TODO: Wrap with tryCatch
    try {
      const writer = this.reader.writable.getWriter();
      console.log("started sending to terminal");
      await writer.write(data);
      console.log("finished sending to terminal");
      await writer.releaseLock();
    } catch (error) {
      console.error(error);
    }
  };
}
