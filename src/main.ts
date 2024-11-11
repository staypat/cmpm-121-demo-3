// Imported modules
import leaflet from "leaflet";

import "leaflet/dist/leaflet.css";
import "./style.css";

import "./leafletWorkaround.ts";

import luck from "./luck.ts";

import { Board } from "./board.ts";
import { Cell } from "./board.ts";

// Gameplay parameters
const OAKES_CLASSROOM = leaflet.latLng(36.9895, -122.0628);
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
  readonly cell: Cell;
  readonly serialNumber: number;
}

// Memento interface
interface Memento {
  toMemento(): string;
  fromMemento(memento: string): void;
}
// Cache interface
interface Cache extends Memento {
  coins: Coin[];
}

function createCache(_cell: Cell, coins: Coin[]): Cache {
  return {
    coins,
    toMemento() {
      return JSON.stringify(this.coins);
    },
    fromMemento(memento: string) {
      this.coins = JSON.parse(memento);
    },
  };
}

// Initialize map to store mementos
const cacheMementos: Map<string, string> = new Map();

function generateCoins(cell: Cell, count: number): Coin[] {
  return Array.from({ length: count }, (_, index) => ({
    cell,
    serialNumber: index,
  }));
}

// Add caches to the map by cell numbers
function spawnCache(cell: Cell) {
  const bounds = board.getCellBounds(cell);
  const cacheKey = `${cell.i}-${cell.j}`;
  let cache: Cache;

  if (cacheMementos.has(cacheKey)) {
    cache = createCache(cell, []);
    cache.fromMemento(cacheMementos.get(cacheKey)!);
  } else {
    const coins = generateCoins(
      cell,
      Math.ceil(luck([cell.i, cell.j].toString()) * 100),
    );
    cache = createCache(cell, coins);
    cacheMementos.set(cacheKey, cache.toMemento());
  }

  // Cache visual representation
  const rect = leaflet.rectangle(bounds);
  rect.addTo(map);

  // Cache event handler
  rect.bindPopup(() => {
    const popupDiv = document.createElement("div");
    popupDiv.innerHTML =
      `<div>There is a cache here at "${cell.i},${cell.j}".<br><br> There are <span id="value">${cache.coins.length}</span> coins to collect.<br><br>`;

    const coinList = document.createElement("div");
    updateCoinList();

    // Collect coin functionality
    function updateCoinList() {
      coinList.innerHTML = "";
      cache.coins.forEach((coin) => {
        const coinDiv = document.createElement("div");
        const collectButtonId = `collect-${coin.serialNumber}`;
        coinDiv.innerHTML =
          `Coin {i: ${coin.cell.i}, j: ${coin.cell.j}, serial: ${coin.serialNumber}} <button id="${collectButtonId}">collect</button>`;
        coinList.appendChild(coinDiv);

        coinDiv.querySelector<HTMLButtonElement>(`#${collectButtonId}`)!
          .addEventListener("click", function () {
            const coinIndex = cache.coins.findIndex((c) =>
              c.serialNumber === coin.serialNumber
            );
            if (coinIndex !== -1) {
              playerCoins.push(coin);
              cache.coins.splice(coinIndex, 1);
              updatePopupValue();
              updateInventoryPanel();
              this.disabled = true;
              cacheMementos.set(cacheKey, cache.toMemento());
            }
          });
      });
    }

    popupDiv.appendChild(coinList);

    function updatePopupValue() {
      document.querySelector<HTMLSpanElement>("#value")!.innerHTML = cache.coins
        .length.toString();
    }

    function updateInventoryPanel() {
      inventoryPanel.innerHTML = `Inventory: ${
        playerCoins.map((coin) =>
          `<div>Coin {i: ${coin.cell.i}, j: ${coin.cell.j}, serial: ${coin.serialNumber}}</div>`
        ).join("")
      }`;
    }

    // Deposit coin functionality
    const depositButton = document.createElement("button");
    depositButton.innerHTML = "Deposit";
    depositButton.addEventListener("click", function () {
      if (playerCoins.length != 0) {
        const depositCoin = playerCoins.pop();
        cache.coins.push(depositCoin!);
        updatePopupValue();
        updateInventoryPanel();
        updateCoinList();
        cacheMementos.set(cacheKey, cache.toMemento());
      }
    });
    popupDiv.appendChild(depositButton);

    return popupDiv;
  });
}

// Initial player position
let playerPosition: Cell = board.getCellForPoint(OAKES_CLASSROOM);

// Function to update the player marker
function updatePlayerMarker() {
  const newLatLng = leaflet.latLng(
    playerPosition.i * TILE_DEGREES,
    playerPosition.j * TILE_DEGREES,
  );
  playerMarker.setLatLng(newLatLng);
  map.setView(newLatLng, GAMEPLAY_ZOOM_LEVEL);
}

// Function to update visible caches
function updateVisibleCaches() {
  const nearbyCells = board.getCellsNearPoint(
    leaflet.latLng(
      playerPosition.i * TILE_DEGREES,
      playerPosition.j * TILE_DEGREES,
    ),
  );

  // Remove existing cache layers
  map.eachLayer((layer: leaflet.Layer) => {
    if (layer instanceof leaflet.Rectangle) {
      map.removeLayer(layer);
    }
  });

  // Display or update caches based on player position
  nearbyCells.forEach((cell) => {
    if (luck([cell.i, cell.j].toString()) < CACHE_SPAWN_PROBABILITY) {
      spawnCache(cell);
    }
  });
}

// Function to move player
function movePlayer(direction: "up" | "down" | "left" | "right") {
  switch (direction) {
    case "up":
      playerPosition = { i: playerPosition.i + 1, j: playerPosition.j };
      break;
    case "down":
      playerPosition = { i: playerPosition.i - 1, j: playerPosition.j };
      break;
    case "left":
      playerPosition = { i: playerPosition.i, j: playerPosition.j - 1 };
      break;
    case "right":
      playerPosition = { i: playerPosition.i, j: playerPosition.j + 1 };
      break;
  }
  updatePlayerMarker();
  updateVisibleCaches();
}

// Add event listeners to buttons
document.getElementById("north")!.addEventListener(
  "click",
  () => movePlayer("up"),
);
document.getElementById("south")!.addEventListener(
  "click",
  () => movePlayer("down"),
);
document.getElementById("west")!.addEventListener(
  "click",
  () => movePlayer("left"),
);
document.getElementById("east")!.addEventListener(
  "click",
  () => movePlayer("right"),
);
updatePlayerMarker();
updateVisibleCaches();
