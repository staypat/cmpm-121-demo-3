// Imported modules
import leaflet from "leaflet";

import "leaflet/dist/leaflet.css";
import "./style.css";

import "./leafletWorkaround.ts";

import luck from "./luck.ts";

import { Board } from "./board.ts";
import { Cell } from "./board.ts";

// Gameplay parameters
const OAKES_CLASSROOM = leaflet.latLng(36.98949379578401, -122.06277128548504);
const GAMEPLAY_ZOOM_LEVEL = 19;
const TILE_DEGREES = 1e-4;
const NEIGHBORHOOD_SIZE = 8;
const CACHE_SPAWN_PROBABILITY = 0.1;

// Board instance
const board = new Board(TILE_DEGREES, NEIGHBORHOOD_SIZE);

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

// Inventory UI
const inventoryPanel = document.querySelector<HTMLDivElement>(
  "#inventoryPanel",
)!;
inventoryPanel.innerHTML = "Inventory:<br>Nothing collected yet";

// Player's collected coins
const playerCoins: Coin[] = [];

// Coin interface
interface Coin {
  readonly i: number;
  readonly j: number;
  readonly serialNumber: number;
}

function generateCoins(cell: Cell, count: number): Coin[] {
  return Array.from({ length: count }, (_, index) => ({
    i: cell.i,
    j: cell.j,
    serialNumber: index,
  }));
}

// Add caches to the map by cell numbers
function spawnCache(cell: Cell) {
  const bounds = board.getCellBounds(cell);

  // Cache representation
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  // Coin representation
  const pointValue = Math.ceil(luck([cell.i, cell.j].toString()) * 100);
  const coins = generateCoins(cell, pointValue);

  // Cache event handler
  rect.bindPopup(() => {
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML =
      `<div>There is a cache here at "${cell.i},${cell.j}".<br><br> There are <span id="value">${coins.length}</span> coins to collect.<br><br>`;

    const coinList = document.createElement("div");
    updateCoinList();

    // Collect coin functionality
    function updateCoinList() {
      coinList.innerHTML = "";
      coins.forEach((coin) => {
        const coinDiv = document.createElement("div");
        const collectButtonId = `collect-${coin.serialNumber}`;
        coinDiv.innerHTML =
          `Coin {i: ${coin.i}, j: ${coin.j}, serial: ${coin.serialNumber}} <button id="${collectButtonId}">collect</button>`;
        coinList.appendChild(coinDiv);

        coinDiv.querySelector<HTMLButtonElement>(`#${collectButtonId}`)!
          .addEventListener("click", function () {
            const coinIndex = coins.findIndex((c) =>
              c.serialNumber === coin.serialNumber
            );
            if (coinIndex !== -1) {
              playerCoins.push(coin);
              console.log(
                `Collected Coin: {i: ${coin.i}, j: ${coin.j}, serial: ${coin.serialNumber}}`,
              );
              coins.splice(coinIndex, 1);
              updatePopupValue();
              updateInventoryPanel();
              this.disabled = true;
            }
          });
      });
    }

    popupDiv.appendChild(coinList);

    function updatePopupValue() {
      document.querySelector<HTMLSpanElement>("#value")!.innerHTML = coins
        .length.toString();
    }

    function updateInventoryPanel() {
      inventoryPanel.innerHTML = `Inventory: ${
        playerCoins.map((coin) =>
          `<div>Coin {i: ${coin.i}, j: ${coin.j}, serial: ${coin.serialNumber}}</div>`
        ).join("")
      }`;
    }

    // Deposit coin functionality
    const depositButton = document.createElement("button");
    depositButton.innerHTML = "Deposit";
    depositButton.addEventListener("click", function () {
      if (playerCoins.length != 0) {
        const depositCoin = playerCoins.pop();
        coins.push(depositCoin!);
        updatePopupValue();
        updateInventoryPanel();
        updateCoinList();
      }
    });
    popupDiv.appendChild(depositButton);

    return popupDiv;
  });
}

/* for spawning a cache within a neighborhood of the player,
consider adding a player moved event listsener to recalculate
and maintain the caches that will be destroyed/created */
const cellsToCheck = board.getCellsNearPoint(OAKES_CLASSROOM);
cellsToCheck.forEach((cell) => {
  if (luck([cell.i, cell.j].toString()) < CACHE_SPAWN_PROBABILITY) {
    spawnCache(cell);
  }
});
