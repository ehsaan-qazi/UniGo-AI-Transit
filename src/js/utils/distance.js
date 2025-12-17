// src/js/utils/distance.js

// Radius of the Earth in km
const R = 6371; 

function toRad(value) {
    return (value * Math.PI) / 180;
}

/**
 * Calculates distance between two points in KM
 * @param {Array} coord1 - [lat, lng]
 * @param {Array} coord2 - [lat, lng]
 */
export function haversineDistance(coord1, coord2) {
    const dLat = toRad(coord2[0] - coord1[0]);
    const dLon = toRad(coord2[1] - coord1[1]);
    const lat1 = toRad(coord1[0]);
    const lat2 = toRad(coord2[0]);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    
    return R * c;
}