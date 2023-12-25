const multipleStepsForms = (function () {
  let formStepsNum = 0;

  const createMultiStepForm = (
    credentialsForm,
    readerSelectionForm,
    renderPayForm
  ) => {
    formStepsNum = 0;
    // Create elements
    const h1 = document.createElement("h1");
    const progressBar = document.createElement("div");
    const progress = document.createElement("div");
    const progressSteps = [];
    // Setting up elements' attributes
    h1.textContent = "Setting up ...";
    h1.classList.add("text-center");

    progressBar.classList.add("progress-bar");

    progress.id = "progress";
    progress.classList.add("progress");
    progressBar.appendChild(progress);

    const stepTitles = ["Account", "Reader", "Finished"];
    stepTitles.forEach((title, index) => {
      const step = document.createElement("div");
      index === 0
        ? step.classList.add("progress-step-active", "progress-step")
        : step.classList.add("progress-step");
      step.setAttribute("data-title", title);
      progressSteps.push(step);
      progressBar.appendChild(step);
    });

    // Form Step 1
    const formStep1 = document.createElement("div");
    formStep1.classList.add("form-step", "form-step-active");
    formStep1.appendChild(credentialsForm);
    credentialsForm.addEventListener("submit", (e) => {
      formStepsNum++;
      updateFormSteps();
      updateProgressbar();
    });

    // Form Step 2
    const formStep2 = document.createElement("div");
    formStep2.classList.add("form-step");
    formStep2.appendChild(readerSelectionForm);
    const prevButton2 = document.createElement("input");
    prevButton2.classList.add("button", "button-previous");
    prevButton2.value = "Previous";
    readerSelectionForm.lastElementChild.insertBefore(
      prevButton2,
      readerSelectionForm.lastElementChild.lastElementChild
    );
    readerSelectionForm.addEventListener("submit", (e) => {
      formStepsNum++;
      updateFormSteps();
      updateProgressbar();
    });

    const formStep3 = document.createElement("form");
    formStep3.classList.add("form-step");

    const inputGroup3 = document.createElement("div");
    inputGroup3.classList.add("input-group");
    formStep3.appendChild(inputGroup3);

    const saveLabel = document.createElement("label");
    saveLabel.classList.add("subtitle");
    saveLabel.textContent = "Entries Saved! You can use the app";
    inputGroup3.appendChild(saveLabel);

    const buttonsGroup3 = document.createElement("div");
    buttonsGroup3.classList.add("buttons-group");
    formStep3.appendChild(buttonsGroup3);

    const prevButton3 = document.createElement("input");
    prevButton3.classList.add("button", "button-previous");
    prevButton3.value = "Previous";
    buttonsGroup3.appendChild(prevButton3);

    const nextButton3 = document.createElement("input");
    nextButton3.type = "submit";
    nextButton3.classList.add("button", "button-next");
    nextButton3.value = "Use app";
    buttonsGroup3.appendChild(nextButton3);

    formStep3.addEventListener("submit", (e) => {
      e.preventDefault();
      formStepsNum++;
      updateProgressbar();
      formStepsNum = 0;
      form.remove();
      renderPayForm();
    });

    const elements = [h1, progressBar, formStep1, formStep2, formStep3];

    const form = document.createElement("div");
    form.classList.add("form");
    elements.forEach((element) => {
      form.appendChild(element);
    });

    //------------------------------------
    const previousButtons = [prevButton2, prevButton3];
    for (const btn of previousButtons) {
      btn.addEventListener("click", () => {
        formStepsNum--;
        updateFormSteps();
        updateProgressbar();
      });
    }
    //---------------------------------------

    return form;
  };

  /**
   * Responsible for updating the progress bar of the multi-step form.
   */
  const updateProgressbar = () => {
    const progressSteps = document.getElementsByClassName("progress-step");
    const progress = document.getElementById("progress");

    [...progressSteps].forEach((progressStep, index) => {
      if (index < formStepsNum + 1) {
        progressStep.classList.add("progress-step-active");
      } else {
        progressStep.classList.remove("progress-step-active");
      }
    });
    const progressActive = document.getElementsByClassName(
      "progress-step-active"
    );

    progress.style.width =
      ((progressActive.length - 1) / (progressSteps.length - 1)) * 100 + "%";
  };

  /**
   * Responsible for viewing the needed step of the multi-step form.
   */
  const updateFormSteps = () => {
    const formSteps = document.getElementsByClassName("form-step");
    [...formSteps].forEach((formStep) => {
      if (formStep.classList.contains("form-step-active")) {
        formStep.classList.remove("form-step-active");
      }
    });
    formSteps[formStepsNum].classList.add("form-step-active");
  };

  return {
    createMultiStepForm,
  };
})();

export const multipleStepsFormGeneration = {
  DEFAULT: multipleStepsForms.createMultiStepForm,
};
