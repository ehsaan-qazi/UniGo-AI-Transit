// scripts/enhance_graph.js
const fs = require('fs');

// Load your existing graph
const graph = JSON.parse(fs.readFileSync('data/reliable_metro_graph.json', 'utf8'));

console.log('🔧 Enhancing graph data...\n');

// 1. Add time_minutes and is_transfer_edge to edges
let edgesFixed = 0;
let transferEdgesAdded = 0;

graph.edges = graph.edges.map(edge => {
  // Calculate time if missing (assuming 30 km/h avg speed)
  if (!edge.time_minutes) {
    edge.time_minutes = Math.ceil((edge.distance_km / 30) * 60);
    edgesFixed++;
  }
  
  // Mark transfer edges (same from/to station)
  if (!edge.hasOwnProperty('is_transfer_edge')) {
    edge.is_transfer_edge = edge.from === edge.to;
    if (edge.is_transfer_edge) {
      edge.transfer_time_minutes = edge.time_minutes || 3;
      transferEdgesAdded++;
    } else {
      edge.transfer_time_minutes = 0;
    }
  }
  
  return edge;
});

console.log(`✅ Added time_minutes to ${edgesFixed} edges`);
console.log(`✅ Marked ${transferEdgesAdded} transfer edges`);

// 2. Build adjacency list for fast neighbor lookup
console.log('\n🔗 Building adjacency list...');
graph.adjacency_list = {};

graph.edges.forEach(edge => {
  if (!graph.adjacency_list[edge.from]) {
    graph.adjacency_list[edge.from] = [];
  }
  
  graph.adjacency_list[edge.from].push({
    neighbor: edge.to,
    edge_id: edge.id,
    route_id: edge.route_id,
    is_transfer: edge.is_transfer_edge
  });
});

const totalAdjacencies = Object.values(graph.adjacency_list).reduce((sum, arr) => sum + arr.length, 0);
console.log(`✅ Created adjacency list: ${Object.keys(graph.adjacency_list).length} nodes, ${totalAdjacencies} connections`);

// 3. Validate transfer edges exist
console.log('\n🔄 Validating transfer stations...');
let transferEdgesCreated = 0;

graph.transfer_stations.forEach(station => {
  station.transfer_pairs.forEach(pair => {
    // Check if transfer edge exists
    const existingEdge = graph.edges.find(e => 
      e.from === station.station_id && 
      e.to === station.station_id &&
      e.route_id === 'TRANSFER' &&
      e.from_route === pair.from &&
      e.to_route === pair.to
    );
    
    if (!existingEdge) {
      // Create missing transfer edge
      const newEdge = {
        id: `transfer_${station.station_id}_${pair.from}_${pair.to}`,
        from: station.station_id,
        to: station.station_id,
        route_id: 'TRANSFER',
        from_route: pair.from,
        to_route: pair.to,
        distance_km: 0,
        time_minutes: pair.time,
        fare_pkr: 0,
        direction: 'transfer',
        is_transfer_edge: true,
        transfer_time_minutes: pair.time
      };
      
      graph.edges.push(newEdge);
      
      // Add to adjacency list
      if (!graph.adjacency_list[station.station_id]) {
        graph.adjacency_list[station.station_id] = [];
      }
      graph.adjacency_list[station.station_id].push({
        neighbor: station.station_id,
        edge_id: newEdge.id,
        route_id: 'TRANSFER',
        is_transfer: true
      });
      
      transferEdgesCreated++;
    }
  });
});

console.log(`✅ Ensured ${transferEdgesCreated} transfer edges exist`);

// 4. Update metadata
graph.metadata.total_edges = graph.edges.length;
graph.metadata.enhanced = true;
graph.metadata.enhanced_date = new Date().toISOString();

// Save enhanced graph
fs.writeFileSync('data/reliable_metro_graph.json', JSON.stringify(graph, null, 2));

console.log('\n✅ Graph enhancement complete!');
console.log(`📊 Final stats:`);
console.log(`   - Nodes: ${graph.metadata.total_stations}`);
console.log(`   - Edges: ${graph.edges.length}`);
console.log(`   - Routes: ${graph.metadata.total_routes}`);
console.log(`   - Transfer Stations: ${graph.transfer_stations.length}`);
console.log('\n💾 Saved to: data/reliable_metro_graph.json');