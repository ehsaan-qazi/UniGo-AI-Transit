// src/js/core/astar.js
// Route-aware A* pathfinding with via/include support
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

        // Transfer penalty (time in minutes)
        this.TRANSFER_PENALTY = 5;
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

    /**
     * Find optimal path with constraints
     * @param {string} startNodeId - Starting station ID
     * @param {string} endNodeId - Destination station ID
     * @param {Object} options - Options including avoidNodes and viaNodes
     */
    findPath(startNodeId, endNodeId, options = {}) {
        const avoidNodes = new Set(options.avoidNodes || []);
        const viaNodes = options.viaNodes || [];

        if (!this.nodes[startNodeId] || !this.nodes[endNodeId]) return null;
        if (avoidNodes.has(startNodeId) || avoidNodes.has(endNodeId)) return null;

        // If we have via/include nodes, chain multiple paths
        if (viaNodes.length > 0) {
            return this.findPathThroughVia(startNodeId, endNodeId, viaNodes, avoidNodes);
        }

        // Direct path finding
        return this.findDirectPath(startNodeId, endNodeId, avoidNodes);
    }

    /**
     * Find path that passes through specified via nodes in order
     */
    findPathThroughVia(startNodeId, endNodeId, viaNodes, avoidNodes) {
        // Build waypoints: start -> via1 -> via2 -> ... -> end
        const waypoints = [startNodeId, ...viaNodes, endNodeId];

        let fullPath = [];
        let fullSegments = [];
        let totalCost = 0;
        let totalTransfers = 0;

        // Find path between each pair of consecutive waypoints
        for (let i = 0; i < waypoints.length - 1; i++) {
            const segmentResult = this.findDirectPath(waypoints[i], waypoints[i + 1], avoidNodes);

            if (!segmentResult) {
                // No path found for this segment
                console.warn(`No path found from ${waypoints[i]} to ${waypoints[i + 1]}`);
                return null;
            }

            // Merge paths (avoid duplicating the connection point)
            if (i === 0) {
                fullPath = [...segmentResult.path];
            } else {
                // Skip first node of segment (it's the same as last node of previous segment)
                fullPath.push(...segmentResult.path.slice(1));
            }

            // Merge route segments
            if (i === 0) {
                fullSegments = [...segmentResult.routeSegments];
            } else {
                // Check if we can merge with previous segment (same route)
                const lastSegment = fullSegments[fullSegments.length - 1];
                const firstNewSegment = segmentResult.routeSegments[0];

                if (lastSegment && firstNewSegment && lastSegment.routeId === firstNewSegment.routeId) {
                    // Extend the last segment
                    lastSegment.toNode = firstNewSegment.toNode;
                    fullSegments.push(...segmentResult.routeSegments.slice(1));
                } else {
                    fullSegments.push(...segmentResult.routeSegments);
                }
            }

            totalCost += segmentResult.cost;
            totalTransfers += segmentResult.transfers;
        }

        // Calculate total distance from path
        let totalDistance = 0;
        for (let i = 0; i < fullPath.length - 1; i++) {
            const from = this.nodes[fullPath[i]];
            const to = this.nodes[fullPath[i + 1]];
            if (from && to) {
                totalDistance += haversineDistance(
                    [from.latitude, from.longitude],
                    [to.latitude, to.longitude]
                );
            }
        }

        return {
            path: fullPath,
            routeSegments: fullSegments,
            cost: totalCost,
            distance: totalDistance,
            transfers: Math.max(0, fullSegments.length - 1),
            viaNodes: viaNodes
        };
    }

    /**
     * Find direct path between two nodes (no via constraints)
     */
    findDirectPath(startNodeId, endNodeId, avoidNodes) {
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

        while (!openSet.isEmpty()) {
            const currentState = openSet.dequeue();
            if (closedSet.has(currentState)) continue;
            closedSet.add(currentState);

            const { nodeId: currentNode, routeId: currentRoute } = this.parseState(currentState);

            if (currentNode === endNodeId) {
                const { path, routeSegments } = this.reconstructPathWithRoutes(cameFrom, currentState);
                const transfers = Math.max(0, routeSegments.length - 1);

                // Calculate total distance
                let totalDistance = 0;
                for (let i = 0; i < path.length - 1; i++) {
                    const from = this.nodes[path[i]];
                    const to = this.nodes[path[i + 1]];
                    if (from && to) {
                        totalDistance += haversineDistance(
                            [from.latitude, from.longitude],
                            [to.latitude, to.longitude]
                        );
                    }
                }

                return { path, routeSegments, cost: gScore[currentState], distance: totalDistance, transfers };
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

                // Add transfer penalty when switching routes
                if (!isSameRoute) {
                    moveCost += this.TRANSFER_PENALTY;
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

        return null;
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

            if (routeId !== 'START') {
                if (!currentSegment || currentSegment.routeId !== routeId) {
                    if (currentSegment) {
                        currentSegment.toNode = prevNodeId || nodeId;
                        routeSegments.push(currentSegment);
                    }
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