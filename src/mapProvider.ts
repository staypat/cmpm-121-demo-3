import leaflet from "leaflet";

export interface MapProvider {
  addRectangle(
    bounds: leaflet.LatLngBoundsExpression,
    callback: () => HTMLElement,
  ): void;
  addMarker(
    name: string,
    position: leaflet.LatLngExpression,
    tooltip: string,
  ): void;
  updateMarker(name: string, position: leaflet.LatLngExpression): void;
  addTileLayer(url: string, options: leaflet.TileLayerOptions): void;
}

export class LeafletMapProvider implements MapProvider {
  private map: leaflet.Map;
  private markers: Map<string, leaflet.Marker>; // Map to manage markers by name

  constructor(map: leaflet.Map) {
    this.map = map;
    this.markers = new Map(); // Initialize marker storage
  }

  addRectangle(
    bounds: leaflet.LatLngBoundsExpression,
    callback: () => HTMLElement,
  ): void {
    const rect = leaflet.rectangle(bounds).addTo(this.map);
    rect.bindPopup(callback);
  }

  addMarker(
    name: string,
    position: leaflet.LatLngExpression,
    tooltip: string,
  ): void {
    const marker = leaflet.marker(position).addTo(this.map);
    marker.bindTooltip(tooltip);
    this.markers.set(name, marker); // Store marker by its name
  }

  updateMarker(name: string, newPosition: leaflet.LatLngExpression): void {
    const marker = this.markers.get(name); // Retrieve marker by name
    if (marker) {
      marker.setLatLng(newPosition); // Update marker position
    } else {
      console.warn(`Marker with name "${name}" does not exist.`);
    }
  }

  addTileLayer(url: string, options: leaflet.TileLayerOptions): void {
    leaflet.tileLayer(url, options).addTo(this.map);
  }
}
