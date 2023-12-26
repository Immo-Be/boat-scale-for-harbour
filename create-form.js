export function createForm() {
  // add form here to add new ship
  const shipForm = document.createElement('form');
  shipForm.classList.add('ship-form');

  const shipNameInput = document.createElement('input');
  shipNameInput.classList.add('ship-name-input');
  shipNameInput.setAttribute('type', 'text');
  shipNameInput.setAttribute('name', 'ship-name');
  shipNameInput.setAttribute('placeholder', 'Ship Name');

  const shipLengthInput = document.createElement('input');
  shipLengthInput.classList.add('ship-length-input');
  shipLengthInput.setAttribute('type', 'number');
  shipLengthInput.setAttribute('name', 'ship-length');
  shipLengthInput.setAttribute('placeholder', 'Ship Length');

  const shipWidthInput = document.createElement('input');
  shipWidthInput.classList.add('ship-width-input');
  shipWidthInput.setAttribute('type', 'number');
  shipWidthInput.setAttribute('name', 'ship-width');
  shipWidthInput.setAttribute('placeholder', 'Ship Width');

  const shipColorInput = document.createElement('input');
  shipColorInput.classList.add('ship-color-input');
  shipColorInput.setAttribute('type', 'text');
  shipColorInput.setAttribute('name', 'ship-color');
  shipColorInput.setAttribute('placeholder', 'Ship Color');

  const shipSubmitButton = document.createElement('button');
  shipSubmitButton.classList.add('ship-submit-button');
  shipSubmitButton.setAttribute('type', 'submit');
  shipSubmitButton.textContent = 'Add Ship';

  shipForm.appendChild(shipNameInput);
  shipForm.appendChild(shipLengthInput);
  shipForm.appendChild(shipWidthInput);
  shipForm.appendChild(shipColorInput);
  shipForm.appendChild(shipSubmitButton);

  return shipForm;
}
