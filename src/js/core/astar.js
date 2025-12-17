// src/js/core/astar.js
import PriorityQueue from '../utils/priorityQueue.js';
import { haversineDistance } from '../utils/distance.js';

class AStarPathfinder {
    constructor(graph) {
        this.graph = graph;
        this.nodes = graph.nodes;
        this.adjacency = graph.adjacency_list;
        this.edgeMap = new Map();
        if (graph.edges) { for (const edge of graph.edges) { this.edgeMap.set(edge.id, edge); } }
    }

    findPath(startNodeId, endNodeId, options = {}) {
        const strategy = options.strategy || 'time';
        const avoidNodes = new Set(options.avoidNodes || []);
        if (!this.nodes[startNodeId] || !this.nodes[endNodeId]) return null;
        if (avoidNodes.has(startNodeId) || avoidNodes.has(endNodeId)) return null;

        const openSet = new PriorityQueue();
        const closedSet = new Set();
        const cameFrom = {}, gScore = {}, fScore = {};

        gScore[startNodeId] = 0;
        fScore[startNodeId] = this.heuristic(startNodeId, endNodeId, strategy);
        openSet.enqueue(startNodeId, fScore[startNodeId]);
        const visitedNodes = [];

        while (!openSet.isEmpty()) {
            const current = openSet.dequeue();
            if (closedSet.has(current)) continue;
            closedSet.add(current);
            visitedNodes.push(current);

            if (current === endNodeId) {
                return { path: this.reconstructPath(cameFrom, current), visitedNodes, cost: gScore[endNodeId] };
            }

            for (const connection of (this.adjacency[current] || [])) {
                const neighbor = connection.neighbor;
                if (closedSet.has(neighbor) || avoidNodes.has(neighbor)) continue;

                let edge = this.edgeMap.get(connection.edge_id);
                if (!edge && connection.is_transfer) {
                    edge = { id: connection.edge_id, is_transfer_edge: true, time_minutes: 5, distance_km: 0 };
                    this.edgeMap.set(connection.edge_id, edge);
                }
                if (!edge) continue;

                const moveCost = this.calculateCost(edge, strategy);
                const tentativeGScore = (gScore[current] ?? Infinity) + moveCost;

                if (tentativeGScore < (gScore[neighbor] ?? Infinity)) {
                    cameFrom[neighbor] = { node: current, edgeId: connection.edge_id };
                    gScore[neighbor] = tentativeGScore;
                    fScore[neighbor] = tentativeGScore + this.heuristic(neighbor, endNodeId, strategy);
                    openSet.enqueue(neighbor, fScore[neighbor]);
                }
            }
        }
        return null;
    }

    getEdgeData(edgeId) { return this.edgeMap.get(edgeId) || null; }

    calculateCost(edge, strategy) {
        if (!edge) return Infinity;
        let cost = edge.time_minutes || (edge.distance_km * 2) || 1;
        if (edge.is_transfer_edge) { cost += (strategy === 'budget') ? 100 : 5; }
        return cost;
    }

    heuristic(nodeId, goalId, strategy) {
        const startNode = this.nodes[nodeId], endNode = this.nodes[goalId];
        if (!startNode || !endNode) return 0;
        const startLat = startNode.latitude ?? startNode.lat, startLng = startNode.longitude ?? startNode.lng;
        const endLat = endNode.latitude ?? endNode.lat, endLng = endNode.longitude ?? endNode.lng;
        if (startLat == null || startLng == null || endLat == null || endLng == null) return 0;
        return haversineDistance([startLat, startLng], [endLat, endLng]) * 2;
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom[current]) { current = cameFrom[current].node; path.unshift(current); }
        return path;
    }
}

export default AStarPathfinder;