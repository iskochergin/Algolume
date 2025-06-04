function highlightPathToRoot(network, nodeId, parentData) {
    if (!parentData) return;
    let pathNodes = [];
    let pathEdges = [];
    let current = nodeId;
    while (true) {
        pathNodes.push(current);
        let p = parentData[current];
        if (typeof p !== 'number' || p < 0 || p >= parentData.length) break;
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

    const adjacency = searchVariableRecursively(currentVars, graphVar);
    let parentData = searchVariableRecursively(currentVars, parentVar);
    if (!adjacency || adjacency.length > 16) {
        container.innerHTML = '\u00A0 Данные графа не определены или граф слишком большой.';
        return;
    }

    // If parentData is missing or too short, fill with -1
    if (!Array.isArray(parentData)) parentData = [];
    if (parentData.length < adjacency.length) {
        for (let i = parentData.length; i < adjacency.length; i++) {
            parentData.push(-1);
        }
    }

    // For an undirected graph, only create an edge for i < nb
    let usedNodes = new Set();
    let edges = [];
    for (let i = 0; i < adjacency.length; i++) {
        const neighbors = adjacency[i];
        if (!Array.isArray(neighbors)) continue;
        for (let nb of neighbors) {
            if (i < nb) {
                usedNodes.add(i);
                usedNodes.add(nb);
                edges.push({
                    id: "edge_" + i + "_" + nb,
                    from: i,
                    to: nb
                    // No arrow => simple line
                });
            }
        }
    }

    // Create node objects only for used IDs
    let nodes = [];
    for (let i = 0; i < adjacency.length; i++) {
        if (!usedNodes.has(i)) continue; // skip isolated nodes
        nodes.push({
            id: i,
            label: "" + String(i),
            // title: `Node ${i}`
        });
    }

    container.innerHTML = '';
    let data = {
        nodes: new vis.DataSet(nodes),
        edges: new vis.DataSet(edges)
    };

    // Force-based layout with bigger circle size & centered text
    let options = {
        layout: {
            hierarchical: { enabled: false }
        },
        physics: {
            enabled: true,
            solver: 'barnesHut',
            barnesHut: {
                gravitationalConstant: -2000,
                centralGravity: 0.3,
                springLength: 100,
                springConstant: 0.04,
                damping: 0.09,
                avoidOverlap: 0.5
            }
        },
        interaction: {
            hover: true,
            tooltipDelay: 200,
            dragNodes: true,
            selectConnectedEdges: false,
            hoverConnectedEdges: false,
        },
        nodes: {
            shape: 'circle',
            // Increase the node size so two-digit labels fit comfortably
            size: 20,
            font: {
                // Slightly larger font
                size: 18,
                face: 'Arial',
                // Align center ensures text is horizontally centered
                align: 'center',
                // If you want to tweak vertical alignment, you can adjust vadjust
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

    // If you have a parent array and want to highlight the path to root:
    network.on("hoverNode", params => {
        highlightPathToRoot(network, params.node, parentData);
    });
    network.on("blurNode", params => {
        network.unselectAll();
    });
}

(function() {
    const originalDisplayStep = displayStep;
    displayStep = function(step) {
        originalDisplayStep(step);
        renderGraphVisualization();
    };
})();
