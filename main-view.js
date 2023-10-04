const stripeReaderView = (function () {
  const addReader = function (themeUsed) {
    return `
        <div class="vertical-wrapper">
            <label>SIMULATOR</label>
            <custom-button value="Connect"></custom-button>
        </div>`;
  };

  return {
    addReader,
    
  }
})();
