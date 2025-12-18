// tests/test_astar.js - Route-aware pathfinding tests
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import AStarPathfinder from '../src/js/core/astar.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const graphPath = path.join(__dirname, '../data/reliable_metro_graph.json');
const graph = JSON.parse(fs.readFileSync(graphPath, 'utf8'));

console.log("🚀 Route-Aware A* Pathfinding Tests\n");
console.log("=".repeat(50));

const pathfinder = new AStarPathfinder(graph);

// Test 1: NUST to PIMS (should minimize transfers)
console.log("\n📍 Test 1: NUST → PIMS (Time Strategy)");
const result1 = pathfinder.findPath("nust", "pims", { strategy: 'time' });
if (result1) {
    console.log(`   Path: ${result1.path.length} stops`);
    console.log(`   Transfers: ${result1.transfers}`);
    console.log(`   Cost: ${Math.round(result1.cost)} minutes`);
    console.log(`   Route segments (from A*):`);
    result1.routeSegments.forEach((seg, i) => {
        console.log(`     ${i + 1}. ${seg.routeId}: ${graph.nodes[seg.fromNode]?.name} → ${graph.nodes[seg.toNode]?.name}`);
    });
    console.log(result1.transfers <= 3 ? "   ✅ PASS: Reasonable transfers" : "   ❌ FAIL: Too many transfers");
} else {
    console.log("   ❌ No path found");
}

// Test 2: NUST to PIMS with budget strategy
console.log("\n📍 Test 2: NUST → PIMS (Budget Strategy - Minimize Transfers)");
const result2 = pathfinder.findPath("nust", "pims", { strategy: 'budget' });
if (result2) {
    console.log(`   Path: ${result2.path.length} stops`);
    console.log(`   Transfers: ${result2.transfers}`);
    console.log(`   Cost: ${Math.round(result2.cost)} (with penalties)`);
    console.log(`   Route segments:`);
    result2.routeSegments.forEach((seg, i) => {
        console.log(`     ${i + 1}. ${seg.routeId}: ${graph.nodes[seg.fromNode]?.name} → ${graph.nodes[seg.toNode]?.name}`);
    });
    console.log(result2.transfers <= 1 ? "   ✅ PASS: Minimal transfers" : "   ⚠️  Could be fewer transfers");
} else {
    console.log("   ❌ No path found");
}

// Test 3: Direct route test
console.log("\n📍 Test 3: NUST → Police Foundation (Direct Route)");
const result3 = pathfinder.findPath("nust", "police_foundation", { strategy: 'time' });
if (result3) {
    console.log(`   Path: ${result3.path.length} stops, Transfers: ${result3.transfers}`);
    result3.routeSegments.forEach((seg, i) => {
        console.log(`     ${i + 1}. ${seg.routeId}: ${graph.nodes[seg.fromNode]?.name} → ${graph.nodes[seg.toNode]?.name}`);
    });
    console.log(result3.transfers === 0 ? "   ✅ PASS: Direct route" : "   ❌ FAIL: Unnecessary transfer");
} else {
    console.log("   ❌ No path found");
}

// Test 4: Avoid constraint
console.log("\n📍 Test 4: NUST → FAST (Avoiding Police Foundation)");
const result4 = pathfinder.findPath("nust", "fast_university", { strategy: 'time', avoidNodes: ['police_foundation'] });
if (result4) {
    console.log(`   Path: ${result4.path.length} stops, Transfers: ${result4.transfers}`);
    const avoided = !result4.path.includes('police_foundation');
    console.log(avoided ? "   ✅ PASS: Avoided blocked station" : "   ❌ FAIL: Path includes blocked station");
} else {
    console.log("   ⚠️  No alternative path found");
}

console.log("\n" + "=".repeat(50));
console.log("✅ All tests complete");