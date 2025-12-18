// tests/debug_n5_comsats.js - Debug specific spaghetti route
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AStarPathfinder from '../src/js/core/astar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const graph = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/reliable_metro_graph.json'), 'utf8'));

const pf = new AStarPathfinder(graph);

// Find actual node IDs for N-5 and COMSATS
console.log('=== Finding N-5 and COMSATS node IDs ===');
const n5Nodes = Object.entries(graph.nodes).filter(([id, node]) =>
    node.name.toLowerCase().includes('n-5') || node.name.toLowerCase().includes('national highway')
);
console.log('N-5 related nodes:', n5Nodes.map(([id, n]) => `${id}: "${n.name}"`));

const comsatsNodes = Object.entries(graph.nodes).filter(([id, node]) =>
    node.name.toLowerCase().includes('comsats')
);
console.log('COMSATS nodes:', comsatsNodes.map(([id, n]) => `${id}: "${n.name}"`));

// Test the actual route user searched
// Based on IntentParser, "N-5 (National Highway)" likely matches "national_highway_authority"
const fromId = n5Nodes.length > 0 ? n5Nodes[0][0] : null;
const toId = comsatsNodes.length > 0 ? comsatsNodes[0][0] : null;

if (fromId && toId) {
    console.log(`\n=== Route: ${fromId} to ${toId} ===`);

    const result = pf.findPath(fromId, toId, { strategy: 'time' });

    if (result) {
        console.log(`Path: ${result.path.length} nodes, ${result.transfers} transfers`);
        console.log('');

        let prevLat = null, prevLng = null;
        let spaghetti = false;

        result.path.forEach((id, i) => {
            const node = graph.nodes[id];
            const lat = node?.latitude;
            const lng = node?.longitude;

            let direction = '';
            if (prevLat !== null && lat && lng) {
                const latDiff = lat - prevLat;
                const lngDiff = lng - prevLng;

                // Determine direction
                if (Math.abs(latDiff) > 0.01 || Math.abs(lngDiff) > 0.01) {
                    const dir = [];
                    if (latDiff > 0.005) dir.push('↑N');
                    if (latDiff < -0.005) dir.push('↓S');
                    if (lngDiff > 0.005) dir.push('→E');
                    if (lngDiff < -0.005) dir.push('←W');
                    direction = ` [${dir.join('')}]`;

                    // Check if direction reverses (spaghetti indicator)
                    if (i > 1) {
                        const prevDir = result.path[i - 1];
                        // Large jump
                        if (Math.abs(latDiff) > 0.02 || Math.abs(lngDiff) > 0.02) {
                            direction += ' ⚠️ LARGE';
                            spaghetti = true;
                        }
                    }
                }
            }

            console.log(`${i}: ${node?.name || id} (${lat?.toFixed(4)}, ${lng?.toFixed(4)})${direction}`);

            prevLat = lat;
            prevLng = lng;
        });

        if (spaghetti) {
            console.log('\n⚠️ This route has large coordinate jumps causing spaghetti appearance');
        }

        // Show route segments
        console.log('\n=== Route Segments ===');
        result.routeSegments?.forEach((seg, i) => {
            const from = graph.nodes[seg.fromNode]?.name || seg.fromNode;
            const to = graph.nodes[seg.toNode]?.name || seg.toNode;
            console.log(`${i + 1}. ${seg.routeId}: ${from} → ${to}`);
        });
    } else {
        console.log('No path found!');
    }
} else {
    console.log('Could not find N-5 or COMSATS nodes');
}
