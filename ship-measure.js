import { loadGoogleMaps } from "./google-maps.js";
import { createForm } from "./create-form.js";

const container = document.querySelector(".ship-measure");

await loadGoogleMaps({
  // Use the 'v' parameter to indicate the version to use (weekly, beta, alpha, etc.).
  // Add other bootstrap parameters as needed, using camel case.
});

const shipsArr = [];

// Append google maps to the introduction section
const { Map, Infowindow } = await google.maps.importLibrary("maps");
const { AdvancedMarkerElement } = await google.maps.importLibrary("marker");

const mapContainer = document.createElement("div");

mapContainer.classList.add("map-container");
//   .classList.add('map-container');

const map = new Map(mapContainer, {
  mapId: "f6ae3fd51a819e4d",
  center: { lat: 53.4674569, lng: 9.9828425 },
  zoom: 16,
  scaleControl: true,
  gestureHandling: "none",
  zoomControl: false,
});

container.appendChild(mapContainer);

const shipForm = createForm();
container.appendChild(shipForm);

shipForm.addEventListener("submit", (event) => {
  event.preventDefault();

  const shipNameInput = document.querySelector(".ship-name-input").value;
  const shipLengthInput = document.querySelector(".ship-length-input").value;
  const shipWidthInput = document.querySelector(".ship-width-input").value;
  const shipColorInput = document.querySelector(".ship-color-input").value;

  createShip(shipNameInput, shipLengthInput, shipWidthInput, shipColorInput);

  shipForm.reset();
});

function createShip(
  shipNameInput,
  shipLengthInput,
  shipWidthInput,
  shipColorInput
) {
  const conversionFactor = 144 / 100; // 144px corresponds to 100m

  // replace space with non-breaking space
  shipNameInput = shipNameInput.replace(/ /g, "\u00a0");

  const shipLengthInPx = shipLengthInput * conversionFactor;
  const shipWidthInPx = shipWidthInput * conversionFactor;

  const ship = document.createElement("div");
  ship.classList.add("ship");
  ship.textContent = shipNameInput;
  ship.style.width = `${shipWidthInPx}px`;
  ship.style.height = `${shipLengthInPx}px`;
  ship.style.backgroundColor = shipColorInput;

  const marker = new google.maps.marker.AdvancedMarkerElement({
    map,
    position: { lat: 53.4674569, lng: 9.9828425 },
    gmpDraggable: true,
    content: ship,
  });
}
