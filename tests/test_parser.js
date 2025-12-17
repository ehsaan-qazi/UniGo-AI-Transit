// tests/test_parser.js
import fs from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import IntentParser from '../src/js/nlp/intentParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const graphPath = path.join(__dirname, '../data/reliable_metro_graph.json');
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
const stations = Object.values(graph.nodes).map(n => ({ id: n.id, name: n.name }));
const parser = new IntentParser(stations);

console.log("🧪 Testing IntentParser\n");

const tests = [
    "NUST to PIMS",
    "NUST to PIMS Hospital",
    "nust to pims",
    "Faizabad to F-9 Park",
    "cheap route from NUST to PIMS",
    "fast route NUST to Faizabad",
    "NUST to PIMS avoid Police Foundation"
];

tests.forEach(test => {
    const result = parser.parse(test);
    console.log(`Input: "${test}"`);
    console.log(`  Source: ${result.source} (${result.sourceName})`);
    console.log(`  Dest:   ${result.destination} (${result.destinationName})`);
    console.log(`  Strategy: ${result.strategy}`);
    console.log(`  Avoid: ${result.entities.avoid.join(', ') || 'none'}`);
    console.log('');
});
