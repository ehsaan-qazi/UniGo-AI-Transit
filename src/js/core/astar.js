// src/js/core/astar.js
// Route-aware A* pathfinding - tracks (node, route) to minimize transfers
import PriorityQueue from '../utils/priorityQueue.js';
import { haversineDistance } from '../utils/distance.js';

class AStarPathfinder {
    constructor(graph) {
        this.graph = graph;
        this.nodes = graph.nodes;
        this.adjacency = graph.adjacency_list;
        this.edgeMap = new Map();
        if (graph.edges) {
            for (const edge of graph.edges) {
                this.edgeMap.set(edge.id, edge);
            }
        }

        this.TRANSFER_PENALTY_TIME = 8;
        this.TRANSFER_PENALTY_BUDGET = 50;
    }

    makeState(nodeId, routeId) {
        return `${nodeId}:${routeId || 'START'}`;
    }

    parseState(state) {
        const idx = state.lastIndexOf(':');
        return {
            nodeId: state.substring(0, idx),
            routeId: state.substring(idx + 1)
        };
    }

    findPath(startNodeId, endNodeId, options = {}) {
        const strategy = options.strategy || 'time';
        const avoidNodes = new Set(options.avoidNodes || []);

        if (!this.nodes[startNodeId] || !this.nodes[endNodeId]) return null;
        if (avoidNodes.has(startNodeId) || avoidNodes.has(endNodeId)) return null;

        const openSet = new PriorityQueue();
        const closedSet = new Set();
        const cameFrom = {};
        const gScore = {};
        const fScore = {};

        const startRoutes = this.nodes[startNodeId].routes_serving || ['default'];
        for (const route of startRoutes) {
            const startState = this.makeState(startNodeId, route);
            gScore[startState] = 0;
            fScore[startState] = this.heuristic(startNodeId, endNodeId);
            openSet.enqueue(startState, fScore[startState]);
        }

        let bestResult = null;

        while (!openSet.isEmpty()) {
            const currentState = openSet.dequeue();
            if (closedSet.has(currentState)) continue;
            closedSet.add(currentState);

            const { nodeId: currentNode, routeId: currentRoute } = this.parseState(currentState);

            if (currentNode === endNodeId) {
                const { path, routeSegments } = this.reconstructPathWithRoutes(cameFrom, currentState);
                const transfers = Math.max(0, routeSegments.length - 1);

                if (!bestResult || transfers < bestResult.transfers ||
                    (transfers === bestResult.transfers && gScore[currentState] < bestResult.cost)) {
                    bestResult = { path, routeSegments, cost: gScore[currentState], transfers };
                }

                if (strategy === 'time') break;
                continue;
            }

            for (const connection of (this.adjacency[currentNode] || [])) {
                const neighborNode = connection.neighbor;
                if (avoidNodes.has(neighborNode)) continue;
                if (connection.is_transfer) continue;

                const connectionRoute = connection.route_id;
                const isSameRoute = (connectionRoute === currentRoute || currentRoute === 'START');
                const neighborState = this.makeState(neighborNode, connectionRoute);

                if (closedSet.has(neighborState)) continue;

                let edge = this.edgeMap.get(connection.edge_id);
                if (!edge) edge = { time_minutes: 2, distance_km: 0.5 };

                let moveCost = edge.time_minutes || (edge.distance_km * 2) || 1;

                if (!isSameRoute) {
                    moveCost += (strategy === 'budget') ? this.TRANSFER_PENALTY_BUDGET : this.TRANSFER_PENALTY_TIME;
                }

                const tentativeG = (gScore[currentState] ?? Infinity) + moveCost;

                if (tentativeG < (gScore[neighborState] ?? Infinity)) {
                    cameFrom[neighborState] = {
                        fromState: currentState,
                        routeId: connectionRoute,
                        routeChange: !isSameRoute
                    };
                    gScore[neighborState] = tentativeG;
                    fScore[neighborState] = tentativeG + this.heuristic(neighborNode, endNodeId);
                    openSet.enqueue(neighborState, fScore[neighborState]);
                }
            }
        }

        return bestResult;
    }

    heuristic(nodeId, goalId) {
        const startNode = this.nodes[nodeId];
        const endNode = this.nodes[goalId];
        if (!startNode || !endNode) return 0;

        const startLat = startNode.latitude ?? startNode.lat;
        const startLng = startNode.longitude ?? startNode.lng;
        const endLat = endNode.latitude ?? endNode.lat;
        const endLng = endNode.longitude ?? endNode.lng;

        if (startLat == null || startLng == null || endLat == null || endLng == null) return 0;
        return haversineDistance([startLat, startLng], [endLat, endLng]) * 2;
    }

    reconstructPathWithRoutes(cameFrom, endState) {
        const states = [];
        let current = endState;
        while (current) {
            states.unshift({ state: current, info: cameFrom[current] });
            current = cameFrom[current]?.fromState;
        }

        const path = [];
        const routeSegments = [];
        let currentSegment = null;
        let prevNodeId = null;

        for (const { state, info } of states) {
            const { nodeId, routeId } = this.parseState(state);

            if (path.length === 0 || path[path.length - 1] !== nodeId) {
                path.push(nodeId);
            }

            // Track route segments
            if (routeId !== 'START') {
                if (!currentSegment || currentSegment.routeId !== routeId) {
                    // Route change - close previous segment at previous node
                    if (currentSegment) {
                        currentSegment.toNode = prevNodeId || nodeId;
                        routeSegments.push(currentSegment);
                    }
                    // New segment STARTS at the transfer point (previous node)
                    // This is where the user boards the new bus
                    const transferPoint = prevNodeId || nodeId;
                    currentSegment = { routeId, fromNode: transferPoint, toNode: nodeId };
                } else {
                    currentSegment.toNode = nodeId;
                }
            }

            prevNodeId = nodeId;
        }

        if (currentSegment) {
            routeSegments.push(currentSegment);
        }

        return { path, routeSegments };
    }

    getEdgeData(edgeId) {
        return this.edgeMap.get(edgeId) || null;
    }
}

export default AStarPathfinder;