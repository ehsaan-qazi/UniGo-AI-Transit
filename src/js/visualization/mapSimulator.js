// src/js/visualization/mapSimulator.js

export default class MapSimulator {
    constructor(mapId) {
        // Initialize Leaflet Map centered on Islamabad
        this.map = L.map(mapId).setView([33.6844, 73.0479], 12);
        
        // Add OpenStreetMap tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(this.map);

        this.layers = {
            markers: L.layerGroup().addTo(this.map),
            path: L.layerGroup().addTo(this.map)
        };
    }

    // Plot all stations on the map
    plotStations(nodes) {
        Object.values(nodes).forEach(node => {
            L.circleMarker([node.latitude, node.longitude], {
                radius: 6,
                fillColor: node.is_transfer_point ? '#FF0000' : '#3388ff',
                color: '#fff',
                weight: 1,
                fillOpacity: 0.8
            }).addTo(this.layers.markers)
            .bindPopup(`<b>${node.name}</b>`);
        });
    }

    // Draw the calculated route
    drawRoute(pathIds, nodes) {
        // Clear previous route
        this.layers.path.clearLayers();

        const latlngs = pathIds.map(id => [nodes[id].latitude, nodes[id].longitude]);

        // Draw Polyline
        const polyline = L.polyline(latlngs, {
            color: 'green',
            weight: 5,
            opacity: 0.7,
            dashArray: '10, 10' // Dashed line for effect
        }).addTo(this.layers.path);

        // Zoom to fit route
        this.map.fitBounds(polyline.getBounds());

        return polyline;
    }
}