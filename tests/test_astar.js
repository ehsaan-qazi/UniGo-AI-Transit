// tests/test_advanced.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AStarPathfinder from '../src/js/core/astar.js';
import IntentParser from '../src/js/nlp/intentParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const graphPath = path.join(__dirname, '../data/reliable_metro_graph.json');
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));
const stationsList = Object.values(graph.nodes).map(n => ({ id: n.id, name: n.name }));

console.log("🚀 Initializing Advanced Systems...");
const pathfinder = new AStarPathfinder(graph);
const parser = new IntentParser(stationsList);

const userQuery1 = "I am lazy and want to save money going to Police Foundation";
console.log(`\n🗣️  User Query: "${userQuery1}"`);
const parsed1 = parser.parse(userQuery1);
console.log(`🤖 Strategy: ${parsed1.strategy} (Should be 'budget')`);
const result1 = pathfinder.findPath("nust", "police_foundation", { strategy: parsed1.strategy });
if (result1) { console.log(`✅ Cost: ${result1.cost} (Should be low if no transfers involved)`); }
else { console.log(`❌ No path found`); }

const userQuery2 = "Go to NUST but avoid Police Foundation there is a protest";
console.log(`\n🗣️  User Query: "${userQuery2}"`);
const parsed2 = parser.parse(userQuery2);
console.log(`🤖 Entities to Avoid: ${parsed2.entities.avoid}`);
const result2 = pathfinder.findPath("nust", "fast_university", { strategy: 'time', avoidNodes: parsed2.entities.avoid });
if (result2) {
    console.log(`✅ Path Found! ${result2.path.join(' -> ')}`);
    console.log(result2.path.includes('police_foundation') ? "❌ FAILED: Path includes blocked station!" : "✅ SUCCESS: Path avoided the blocked station!");
} else { console.log("⚠️  No path found"); }