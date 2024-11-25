import leaflet, { Map } from "leaflet";

export const updateInventoryPanel = (
  playerCoins: { cell: { i: number; j: number }; serialNumber: number }[],
  TILE_DEGREES: number,
  map: Map,
  GAMEPLAY_ZOOM_LEVEL: number,
) => {
  const inventoryPanel = document.querySelector<HTMLDivElement>(
    "#inventoryPanel",
  )!;
  inventoryPanel.innerHTML = `Inventory: ${
    playerCoins
      .map((coin) =>
        `<div><span class="coin-link" data-i="${coin.cell.i}" data-j="${coin.cell.j}">Coin {i: ${coin.cell.i}, j: ${coin.cell.j}, serial: ${coin.serialNumber}}</span></div>`
      )
      .join("")
  }`;

  const coinLinks = inventoryPanel.querySelectorAll(".coin-link");
  coinLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const i = Number(link.getAttribute("data-i"));
      const j = Number(link.getAttribute("data-j"));
      const latLng = leaflet.latLng(i * TILE_DEGREES, j * TILE_DEGREES);
      map.setView(latLng, GAMEPLAY_ZOOM_LEVEL);
    });
  });
};
