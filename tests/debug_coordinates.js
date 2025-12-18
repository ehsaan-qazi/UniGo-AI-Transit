// tests/debug_coordinates.js - Find nodes with bad coordinates
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AStarPathfinder from '../src/js/core/astar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const graph = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/reliable_metro_graph.json'), 'utf8'));

const pf = new AStarPathfinder(graph);

// Test routes
const testRoutes = [
    { from: 'nust', to: 'pims', name: 'NUST to PIMS' },
    { from: 'n_5_national_highway', to: 'comsats_university', name: 'N-5 to COMSATS' },
    { from: 'saddar', to: 'faizabad_interchange', name: 'Saddar to Faizabad' }
];

console.log('=== Coordinate Analysis ===\n');

// First, find the actual node IDs
console.log('Available nodes containing "n_5" or "national":',
    Object.keys(graph.nodes).filter(id => id.includes('n_5') || id.includes('national')).slice(0, 10));
console.log('Available nodes containing "comsats":',
    Object.keys(graph.nodes).filter(id => id.includes('comsats')).slice(0, 5));
console.log('Available nodes containing "saddar":',
    Object.keys(graph.nodes).filter(id => id.includes('saddar')).slice(0, 5));
console.log('');

// Analyze a working route
const result = pf.findPath('nust', 'pims', { strategy: 'time' });

if (result) {
    console.log('=== NUST to PIMS Path Coordinates ===');
    console.log(`Path: ${result.path.length} nodes\n`);

    let prevLat = null, prevLng = null;
    let issues = [];

    result.path.forEach((id, i) => {
        const node = graph.nodes[id];
        if (!node) {
            console.log(`${i}: ${id} - NODE NOT FOUND!`);
            issues.push({ index: i, id, issue: 'not found' });
            return;
        }

        const lat = node.latitude;
        const lng = node.longitude;

        // Check for obvious coordinate issues
        const warnings = [];

        // Check if coordinates are in Islamabad region (roughly 33.5-33.8 lat, 72.8-73.2 lng)
        if (lat < 33.4 || lat > 33.9) warnings.push('lat out of Islamabad range');
        if (lng < 72.7 || lng > 73.3) warnings.push('lng out of Islamabad range');

        // Check for large jumps from previous node
        if (prevLat !== null) {
            const latDiff = Math.abs(lat - prevLat);
            const lngDiff = Math.abs(lng - prevLng);
            if (latDiff > 0.05 || lngDiff > 0.05) {
                warnings.push(`LARGE JUMP: Δlat=${latDiff.toFixed(4)}, Δlng=${lngDiff.toFixed(4)}`);
                issues.push({ index: i, id, issue: 'large jump', prevId: result.path[i - 1] });
            }
        }

        const warningStr = warnings.length > 0 ? ` ⚠️ ${warnings.join(', ')}` : '';
        console.log(`${i}: ${id} (${lat?.toFixed(4)}, ${lng?.toFixed(4)})${warningStr}`);

        prevLat = lat;
        prevLng = lng;
    });

    console.log(`\n=== Summary ===`);
    console.log(`Total issues found: ${issues.length}`);
    issues.forEach(issue => {
        console.log(`  - Node ${issue.index}: ${issue.id} - ${issue.issue}`);
    });
}
