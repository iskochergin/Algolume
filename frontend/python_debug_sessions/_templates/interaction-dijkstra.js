function highlightPathToRoot(network, nodeId, parentData) {
    if (!parentData) return;
    let pathNodes = [];
    let pathEdges = [];
    let current = nodeId;
    while (true) {
        pathNodes.push(current);
        let p = parentData[current];
        if (typeof p !== 'number' || p < 0 || p >= parentData.length) break;
        // Only add the edge from the current node to its parent.
        pathEdges.push("edge_" + Math.min(current, p) + "_" + Math.max(current, p));
        current = p;
    }
    network.selectNodes(pathNodes, false);
    network.selectEdges(pathEdges);
}

function renderGraphVisualization() {
    const currentVars = debugLog[currentStep] && debugLog[currentStep].variables;
    const container = document.getElementById('graph-visualization');
    if (!currentVars || !container) {
        if (container) container.innerHTML = '';
        return;
    }

    // Retrieve the weighted adjacency list, parent array, and distances array.
    const adjacency = searchVariableRecursively(currentVars, graphVar);
    let parentData = searchVariableRecursively(currentVars, parentVar);
    const dist = searchVariableRecursively(currentVars, distVar);

    if (!adjacency || adjacency.length > 16) {
        container.innerHTML = '\u00A0 Данные графа не определены или граф слишком большой.';
        return;
    }

    // Ensure parentData has at least as many elements as the graph.
    if (!Array.isArray(parentData)) parentData = [];
    if (parentData.length < adjacency.length) {
        for (let i = parentData.length; i < adjacency.length; i++) {
            parentData.push(-1);
        }
    }

    // For an undirected weighted graph, add each edge only once (if i < neighbor).
    let usedNodes = new Set();
    let edges = [];
    for (let i = 0; i < adjacency.length; i++) {
        const neighbors = adjacency[i];
        if (!Array.isArray(neighbors)) continue;
        for (let nb of neighbors) {
            // Each nb is expected to be [neighbor, weight]
            let neighbor = nb[0];
            let edgeWeight = nb[1];
            if (i < neighbor) {
                usedNodes.add(i);
                usedNodes.add(neighbor);
                edges.push({
                    id: "edge_" + Math.min(i, neighbor) + "_" + Math.max(i, neighbor),
                    from: i,
                    to: neighbor,
                    label: String(edgeWeight)
                });
            }
        }
    }

    // --- Seeded Layout: Compute fixed node positions deterministically ---
    // Here we use a circular layout so that the nodes always appear in the same configuration.
    if (!window.staticGraphPositions) {
        window.staticGraphPositions = {};
        let nodeIds = Array.from(usedNodes).sort((a, b) => a - b);
        const n = nodeIds.length;
        const radius = 200;  // Adjust radius as needed
        const centerX = 0;
        const centerY = 0;
        for (let i = 0; i < n; i++) {
            let angle = (2 * Math.PI * i) / n;
            window.staticGraphPositions[nodeIds[i]] = {
                x: centerX + radius * Math.cos(angle),
                y: centerY + radius * Math.sin(angle)
            };
        }
    }

    // Create nodes only for those IDs that appear in an edge.
    let nodes = [];
    for (let i = 0; i < adjacency.length; i++) {
        if (!usedNodes.has(i)) continue;
        let node = {
            id: i,
            label: String(i),
            title: (dist && dist[i] !== undefined) ? "Weight: " + dist[i] : ""
        };
        // Apply the seeded position and fix the node.
        if (window.staticGraphPositions && window.staticGraphPositions[i]) {
            node.x = window.staticGraphPositions[i].x;
            node.y = window.staticGraphPositions[i].y;
            node.fixed = {x: true, y: true};
        }
        nodes.push(node);
    }

    container.innerHTML = '';
    let data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };

    // Since we have precomputed positions, disable physics so nodes don't move.
    let options = {
        layout: {
            hierarchical: {enabled: false}
        },
        physics: false,
        interaction: {
            hover: true,
            tooltipDelay: 200,
            dragNodes: false,
            selectConnectedEdges: false,
            hoverConnectedEdges: false
        },
        nodes: {
            shape: 'circle',
            size: 20,
            font: {
                size: 18,
                face: 'Arial',
                align: 'center',
                vadjust: 0
            },
            borderWidth: 2,
            shadow: true
        },
        edges: {
            width: 2,
            shadow: true,
            color: {
                color: '#58a6ff',
                highlight: '#2ea043',
                hover: '#2ea043'
            }
        }
    };

    let network;
    try {
        network = new vis.Network(container, data, options);
    } catch (err) {
        console.error("vis-network error:", err);
        if (String(err).includes("Arrays are not supported by deepExtend")) {
            console.log("Encountered 'Arrays are not supported by deepExtend'. Skipping graph rendering.");
            return;
        }
        return;
    }

    // When hovering over a node, highlight the edge from that node to its parent.
    network.on("hoverNode", params => {
        highlightPathToRoot(network, params.node, parentData);
    });
    network.on("blurNode", params => {
        network.unselectAll();
    });
}

(function () {
    const originalDisplayStep = displayStep;
    displayStep = function (step) {
        originalDisplayStep(step);
        renderGraphVisualization();
    };
})();
