// Imported modules
import leaflet from "leaflet";

import "leaflet/dist/leaflet.css";
import "./style.css";

import "./leafletWorkaround.ts";

import luck from "./luck.ts";

// Gameplay parameters
const OAKES_CLASSROOM = leaflet.latLng(36.98949379578401, -122.06277128548504);
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;

// Map creation (element with id "map" is defined in index.html)
const map = leaflet.map(document.getElementById("map")!, {
  center: OAKES_CLASSROOM,
  zoom: GAMEPLAY_ZOOM_LEVEL,
  minZoom: GAMEPLAY_ZOOM_LEVEL,
  maxZoom: GAMEPLAY_ZOOM_LEVEL,
  zoomControl: false,
  scrollWheelZoom: false,
});

// Background tile layer
leaflet.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

const playerMarker = leaflet.marker(OAKES_CLASSROOM);
playerMarker.bindTooltip("You are here!");
playerMarker.addTo(map);

// Player points
let playerPoints = 0;
const statusPanel = document.querySelector<HTMLDivElement>("#statusPanel")!;
statusPanel.innerHTML = "Nothing collected yet";

interface Cell {
  i: number;
  j: number;
}

// Add caches to the map by cell numbers
function spawnCache(cell: Cell) {
  const origin = OAKES_CLASSROOM;
  const bounds = leaflet.latLngBounds([
    [origin.lat + cell.i * TILE_DEGREES, origin.lng + cell.j * TILE_DEGREES],
    [
      origin.lat + (cell.i + 1) * TILE_DEGREES,
      origin.lng + (cell.j + 1) * TILE_DEGREES,
    ],
  ]);

  // Cache representation
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  let pointValue = Math.ceil(luck([cell.i, cell.j].toString()) * 100);

  // Cache event handler
  rect.bindPopup(() => {
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML =
      `<div>There is a cache here at "${cell.i},${cell.j}". There are <span id="value">${pointValue}</span> coins to collect.</div>
                <button id="collect">collect</button><button id="deposit">deposit</button>`;
    popupDiv.querySelector<HTMLButtonElement>("#collect")!.addEventListener(
      "click",
      () => {
        if (pointValue > 0) {
          playerPoints++;
          pointValue--;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            pointValue.toString();
        }
        statusPanel.innerHTML = `You have ${playerPoints} points`;
      },
    );
    popupDiv.querySelector<HTMLButtonElement>("#deposit")!.addEventListener(
      "click",
      () => {
        if (playerPoints > 0) {
          playerPoints--;
          pointValue++;
          popupDiv.querySelector<HTMLSpanElement>("#value")!.innerHTML =
            pointValue.toString();
        }
        statusPanel.innerHTML = `You have ${playerPoints} points`;
      },
    );
    return popupDiv;
  });
}

/* for spawning a cache within a neighborhood of the player,
consider adding a player moved event listsener to recalculate
and maintain the caches that will be destroyed/created */
for (let i = -NEIGHBORHOOD_SIZE; i < NEIGHBORHOOD_SIZE; i++) {
  for (let j = -NEIGHBORHOOD_SIZE; j < NEIGHBORHOOD_SIZE; j++) {
    if (luck([i, j].toString()) < CACHE_SPAWN_PROBABILITY) {
      const cell: Cell = { i: i, j: j };
      spawnCache(cell);
    }
  }
}
