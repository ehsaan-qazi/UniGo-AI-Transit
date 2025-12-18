// Test constraint parsing
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Dynamic imports for ES modules
const IntentParser = (await import('../src/js/nlp/intentParser.js')).default;
const AStarPathfinder = (await import('../src/js/core/astar.js')).default;

const graph = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/reliable_metro_graph.json'), 'utf8'));
const stations = Object.values(graph.nodes).map(n => ({ id: n.id, name: n.name }));
const parser = new IntentParser(stations);
const pathfinder = new AStarPathfinder(graph);

// Test query
const query = "n5 to comsats avoid faizabad";
console.log(`Query: "${query}"\n`);

const parsed = parser.parse(query);
console.log('Parsed result:');
console.log('  Source:', parsed.source, '-', parsed.sourceName);
console.log('  Destination:', parsed.destination, '-', parsed.destinationName);
console.log('  Constraints:', JSON.stringify(parsed.constraints));

// Test pathfinding with and without constraints
console.log('\n=== Without constraints ===');
const result1 = pathfinder.findPath(parsed.source, parsed.destination, {});
if (result1) {
    console.log('Path:', result1.path.length, 'stops');
    console.log('Goes through faizabad?', result1.path.includes('faizabad'));
    result1.routeSegments.forEach(seg => {
        const from = graph.nodes[seg.fromNode]?.name || seg.fromNode;
        const to = graph.nodes[seg.toNode]?.name || seg.toNode;
        console.log(`  ${seg.routeId}: ${from} → ${to}`);
    });
}

console.log('\n=== With avoid constraint ===');
console.log('Avoiding nodes:', parsed.constraints.avoid);
const result2 = pathfinder.findPath(parsed.source, parsed.destination, {
    avoidNodes: parsed.constraints.avoid
});
if (result2) {
    console.log('Path:', result2.path.length, 'stops');
    console.log('Goes through faizabad?', result2.path.includes('faizabad'));
    result2.routeSegments.forEach(seg => {
        const from = graph.nodes[seg.fromNode]?.name || seg.fromNode;
        const to = graph.nodes[seg.toNode]?.name || seg.toNode;
        console.log(`  ${seg.routeId}: ${from} → ${to}`);
    });
} else {
    console.log('No route found when avoiding faizabad');
}
