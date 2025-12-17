// Quick debug - check station matching
import fs from 'fs';

const graph = JSON.parse(fs.readFileSync('./data/reliable_metro_graph.json', 'utf8'));
const stations = Object.values(graph.nodes);

const query = "pims hospital";
const queryLower = query.toLowerCase();

console.log(`\nSearching for: "${query}"\n`);

// Check starts with
const startsWithMatches = stations.filter(s => s.name.toLowerCase().startsWith(queryLower));
console.log('Starts with matches:', startsWithMatches.map(s => s.name));

// Check query starts with station
const sortedStations = stations.sort((a, b) => b.name.length - a.name.length);
const queryStartsMatches = sortedStations.filter(s => queryLower.startsWith(s.name.toLowerCase()));
console.log('\nQuery starts with station:', queryStartsMatches.slice(0, 5).map(s => s.name));

// Check which one would be picked
const firstMatch = sortedStations.find(s => queryLower.startsWith(s.name.toLowerCase()));
console.log('\nFirst match:', firstMatch?.name);
