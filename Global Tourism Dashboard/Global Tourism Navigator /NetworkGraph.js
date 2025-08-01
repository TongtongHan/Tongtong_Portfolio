// World Heritage Tourism Network

let networkGraph;
let networkData;
let tourismThreshold = 0; // Default minimum tourism filter value

// network graph created when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Style to match the world map look
    styleContainer();
    
    // Load data
    d3.csv('Data/Country_Summary_S1.csv').then(data => {
        // Process data
        processNetworkData(data);
        
        // Create network visualization
        networkGraph = new NetworkGraph(networkData);
        
        // Set up control buttons and filters
        setupNetworkControls();
    });
});

// Apply style 
function styleContainer() {

    d3.select('#network-chart')
        .style('background-color', '#f5f7fa')
        .style('border-radius', '10px')
        .style('padding', '10px')  
        .style('margin', '10px 0'); 
}

// Process data for network visualization
function processNetworkData(data) {
    // Convert string values to numbers
    data.forEach(d => {
        d["Tourism Volume"] = +d["Tourism Volume"];
        d["World Heritage Sites"] = +d["World Heritage Sites"];
        d["Cultural Heritage Sites"] = +d["Cultural Heritage Sites"];
        d["Natural Heritage Sites"] = +d["Natural Heritage Sites"];
        d["Mixed Heritage Sites"] = +d["Mixed Heritage Sites"];
    });
    
    // Calculate heritage site density (sites per million tourists)
    data.forEach(d => {
        // Avoid division by zero
        const tourismInMillions = d["Tourism Volume"] > 0 ? d["Tourism Volume"] / 1000000 : 0.1;
        d.heritageDensity = d["World Heritage Sites"] / tourismInMillions;
    });
    
    // Create nodes from countries
    const nodes = data.map(d => ({
        id: d.Country,
        region: d.Region,
        tourism: d["Tourism Volume"],
        heritage: d["World Heritage Sites"],
        heritageDensity: d.heritageDensity,
        cultural: d["Cultural Heritage Sites"],
        natural: d["Natural Heritage Sites"],
        mixed: d["Mixed Heritage Sites"],
        isRegionNode: false // Regular country node
    }));
    
    // Get unique regions
    const regions = Array.from(new Set(nodes.map(d => d.region)));
    
    
    // Use only country nodes
    const allNodes = [...nodes];
    
    // Create links between countries based on similar tourism/heritage ratios
    const links = createCorrelationBasedLinks(nodes);
    
    
    // Store data
    networkData = {
        nodes: allNodes,
        links: links
    };
}

// Create links between countries within the same region
function createCorrelationBasedLinks(nodes) {
    const links = [];
    
    // First calculate tourism to heritage ratio for each node
    nodes.forEach(node => {
        node.tourismHeritageRatio = node.heritage > 0 ? node.tourism / node.heritage : 0;
    });
    
    // Group nodes by region
    const regionGroups = {};
    nodes.forEach(node => {
        if (!regionGroups[node.region]) regionGroups[node.region] = [];
        regionGroups[node.region].push(node);
    });
    
    // Process each region
    Object.values(regionGroups).forEach(regionNodes => {
        const regionSize = regionNodes.length;
        
        // Ensure every country is connected to at least 2-3 others in the same region
        //  base network ensuring connectivity
        for (let i = 0; i < regionNodes.length; i++) {
            const country = regionNodes[i];
            
            // Calculate similarities with all other countries in the region
            const similarities = [];
            for (let j = 0; j < regionNodes.length; j++) {
                if (i === j) continue; // Skip self
                
                const otherCountry = regionNodes[j];
                
                const ratio1 = country.tourismHeritageRatio;
                const ratio2 = otherCountry.tourismHeritageRatio;
                
                // Handle zero ratios
                if (ratio1 === 0 || ratio2 === 0) {
                    similarities.push({
                        country: otherCountry,
                        similarity: 0.1 // small baseline similarity
                    });
                    continue;
                }
                
                // Calculate similarity: smaller ratio divided by larger ratio
                const minRatio = Math.min(ratio1, ratio2);
                const maxRatio = Math.max(ratio1, ratio2);
                const similarity = minRatio / maxRatio;
                
                similarities.push({
                    country: otherCountry,
                    similarity: similarity
                });
            }
            
            // Sort by similarity (highest first)
            similarities.sort((a, b) => b.similarity - a.similarity);
            
            // Connect to top 2-3 most similar countries
            // For smaller regions, connect to fewer countries to avoid overcrowding
            const connectionsNeeded = Math.min(
                Math.max(2, Math.ceil(regionSize / 8)),
                similarities.length
            );
            
            for (let k = 0; k < connectionsNeeded; k++) {
                const target = similarities[k].country;
                
                // Check link 
                const linkExists = links.some(link => 
                    (link.source === country.id && link.target === target.id) || 
                    (link.source === target.id && link.target === country.id)
                );
                
                if (!linkExists) {
                    links.push({
                        source: country.id,
                        target: target.id,
                        value: similarities[k].similarity * 2, // Scale up for visibility
                        similarity: similarities[k].similarity,
                        region: country.region
                    });
                }
            }
        }
        
        // Add a few additional high-similarity links for regions with many countries
        // This highlights similarities for similar countries
        if (regionSize > 8) {
            // Calculate all pairwise similarities
            const additionalSimilarities = [];
            for (let i = 0; i < regionNodes.length; i++) {
                for (let j = i + 1; j < regionNodes.length; j++) {
                    const country1 = regionNodes[i];
                    const country2 = regionNodes[j];
                    
                    const ratio1 = country1.tourismHeritageRatio;
                    const ratio2 = country2.tourismHeritageRatio;
                    
                    // Skip if either country has zero ratio
                    if (ratio1 === 0 || ratio2 === 0) continue;
                    
                    // Calculate similarity
                    const minRatio = Math.min(ratio1, ratio2);
                    const maxRatio = Math.max(ratio1, ratio2);
                    const similarity = minRatio / maxRatio;
                    
                    // Only high similarities
                    if (similarity > 0.8) {
                        // Check link
                        const linkExists = links.some(link => 
                            (link.source === country1.id && link.target === country2.id) || 
                            (link.source === country2.id && link.target === country1.id)
                        );
                        
                        if (!linkExists) {
                            additionalSimilarities.push({
                                country1,
                                country2,
                                similarity
                            });
                        }
                    }
                }
            }
            
            // Sort and add top high-similarity links
            additionalSimilarities.sort((a, b) => b.similarity - a.similarity);
            
            // Add a proportion based on region size
            const additionalLinks = Math.min(Math.floor(regionSize / 2), additionalSimilarities.length);
            
            additionalSimilarities.slice(0, additionalLinks).forEach(item => {
                links.push({
                    source: item.country1.id,
                    target: item.country2.id,
                    value: item.similarity * 3, 
                    similarity: item.similarity,
                    region: item.country1.region,
                    isHighSimilarity: true
                });
            });
        }
    });
    
    return links;
}

// Network Graph Class Setup
class NetworkGraph {
    constructor(data) {
        this.data = data;
        this.width = document.getElementById('network-chart').clientWidth;
        this.height = document.getElementById('network-chart').clientHeight;
        
        // Node sizing and coloring scales
        this.setupScales();
        
        // Create SVG
        this.createSvg();
        
        // Initialize force simulation
        this.initializeSimulation();
        
        // Render the graph
        this.render();
    }
    
    setupScales() {
        // Calculate tourists per heritage site ratio for non-region nodes
        this.data.nodes.forEach(node => {
            if (!node.isRegionNode) {
                // Avoid division by zero
                node.touristsPerSite = node.heritage > 0 ? node.tourism / node.heritage : 0;
            }
        });
        
        // Size scale based on tourists per heritage site ratio
        const maxRatio = d3.max(this.data.nodes.filter(d => !d.isRegionNode), d => d.touristsPerSite);
        this.sizeScale = d3.scaleSqrt()
            .domain([0, maxRatio])
            .range([5, 30]); 
        
        // Define the region and define the region colors
        this.regionColorScale = d3.scaleOrdinal()
            .domain(["Europe", "Asia", "Africa", "Latin America", "Arab States"])
            .range(["#45abf5", "#ea4e34", "#8b56f5", "#f5a21d", "#59a14f"]);
    }
    
    createSvg() {
        // Adjust dimensions to expand the visualization
        const visualizationWidth = this.width * 0.7; 
        
        this.svg = d3.select('#network-chart')
            .append('svg')
            .attr('width', this.width)
            .attr('height', this.height)
            .attr('viewBox', `0 0 ${this.width} ${this.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
            
        // Create a group for all graph elements with more space from left edge
        this.graphGroup = this.svg.append('g')
            .attr('transform', `translate(${visualizationWidth * 0.05}, 0)`); 
    }
    
    initializeSimulation() {
        // Force Simulation Setup
        this.simulation = d3.forceSimulation(this.data.nodes)
            .force('link', d3.forceLink(this.data.links)
                .id(d => d.id)
                .distance(60))  // Increased distance between linked nodes
            .force('charge', d3.forceManyBody().strength(-200))  // Increased repulsion
            .force('center', d3.forceCenter(this.width * 0.35, this.height / 2))
            .force('collision', d3.forceCollide().radius(d => this.sizeScale(d.touristsPerSite) + 10))  
            // Add clustering force by region
            .force('cluster', this.forceCluster());
    }
    
    // Custom force for clustering nodes by region
    forceCluster() {
        const nodes = this.data.nodes;
        const regions = Array.from(new Set(nodes.map(d => d.region)));
        const regionCenters = {};
        
        // Define region dimension
        const width = this.width * 0.7;
        const height = this.height;
        
        // Set region position 
        regionCenters["Europe"] = { x: width * 0.45, y: height * 0.35 };
        regionCenters["Asia"] = { x: width * 0.55, y: height * 0.4 };
        regionCenters["Africa"] = { x: width * 0.4, y: height * 0.5 };  
        regionCenters["Latin America"] = { x: width * 0.3, y: height * 0.5 };  
        regionCenters["Arab States"] = { x: width * 0.5, y: height * 0.45 };
        
        // Default positions 
        regions.forEach(region => {
            if (!regionCenters[region]) {
                const centerX = width / 2;
                const centerY = height / 2;
                const radius = Math.min(width, height) * 0.25;
                const angle = Math.random() * 2 * Math.PI;
                regionCenters[region] = {
                    x: centerX + radius * Math.cos(angle),
                    y: centerY + radius * Math.sin(angle)
                };
            }
        });
        
        return function(alpha) {
            // Apply force to move nodes toward their region's center
            nodes.forEach(node => {
                const center = regionCenters[node.region];
                if (center) {
                    node.vx = (node.vx || 0) + (center.x - node.x) * alpha * 0.2;  
                    node.vy = (node.vy || 0) + (center.y - node.y) * alpha * 0.2; 
                }
            });
        };
    }
    
    ticked() {
        // Update link positions
        this.links
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
            
        // Update node positions and boundary 
        this.nodes
            .attr('cx', d => {
                const radius = this.sizeScale(d.touristsPerSite);
                // central positions 
                const padding = 30;  
                const minX = padding + radius;
                const maxX = (this.width * 0.6) - radius - padding;
                
                d.x = Math.max(minX, Math.min(maxX, d.x));
                return d.x;
            })
            .attr('cy', d => {
                const radius = this.sizeScale(d.touristsPerSite);
                // central positions 
                const padding = 30;  
                const minY = padding + radius;
                const maxY = this.height - radius - padding;
                
                d.y = Math.max(minY, Math.min(maxY, d.y));
                return d.y;
            });
            
        // country label positions update
        this.countryLabels
            .attr('x', d => d.x)
            .attr('y', d => d.y);
    }
    
    filterByRegion(region) {
        // If a specific region is selected, highlight it and zoom to it
        if (region) {
            // Hide nodes not in the selected region
            this.nodes.style('opacity', d => d.region === region ? 1 : 0);
            
            // Hide links not connecting nodes in the selected region
            this.links.style('opacity', d => {
                const sourceRegion = typeof d.source === 'object' ? d.source.region : this.getNodeRegion(d.source);
                const targetRegion = typeof d.target === 'object' ? d.target.region : this.getNodeRegion(d.target);
                if (sourceRegion === region && targetRegion === region) {
                    // Maintain the original opacity for links in the selected region
                    return d.isHighSimilarity ? 0.7 : Math.min(0.3 + d.similarity * 0.4, 0.6);
                } else {
                    return 0;
                }
            });
            
            // Only show labels for the selected region
            this.countryLabels.style('opacity', d => d.region === region ? 1 : 0);
            
            // Reposition nodes more centrally when a region is filtered
            this.recenterRegion(region);
        } else {
            // Show all nodes and links
            this.nodes.style('opacity', 1);
            this.links.style('opacity', d => d.isHighSimilarity ? 0.7 : Math.min(0.3 + d.similarity * 0.4, 0.6));
            
            // Show all labels
            this.countryLabels.style('opacity', 1);
        }
    }
    
    // Recenter nodes when a region is selected
    recenterRegion(region) {
        // Stronger force toward center for active nodes
        this.simulation.force('charge', d3.forceManyBody().strength(-300));  
        this.simulation.force('collision', d3.forceCollide().radius(d => this.sizeScale(d.touristsPerSite) + 15));  
        
        // Heat up the simulation to allow nodes to reorganize
        this.simulation.alpha(0.5).restart();
    }
    
    render() {
        const self = this;
        
        // Create links
        this.links = this.graphGroup.append('g')
            .attr('class', 'links')
            .selectAll('line')
            .data(this.data.links)
            .enter()
            .append('line')
            .attr('stroke', d => d.isHighSimilarity ? '#666' : '#999') 
            .attr('stroke-opacity', d => d.isHighSimilarity ? 0.7 : Math.min(0.3 + d.similarity * 0.4, 0.6)) 
            .attr('stroke-width', d => d.isHighSimilarity ? 2 : (d.similarity * 1.2)) 
            
        // Create nodes
        this.nodes = this.graphGroup.append('g')
            .attr('class', 'nodes')
            .selectAll('circle')
            .data(this.data.nodes)
            .enter()
            .append('circle')
            .attr('r', d => this.sizeScale(d.touristsPerSite))
            .attr('fill', d => this.regionColorScale(d.region))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1.5)
            .attr('stroke-opacity', 1)
            .call(this.dragBehavior())
            .on('mouseover', function(event, d) {
                self.showTooltip(event, d);
                d3.select(this)
                    .attr('stroke', '#333')
                    .attr('stroke-width', 2)
                    .attr('stroke-opacity', 1);
            })
            .on('mouseout', function(event, d) {
                self.hideTooltip();
                d3.select(this)
                    .attr('stroke', '#fff')
                    .attr('stroke-width', 1.5)
                    .attr('stroke-opacity', 1);
            });
            
        // Create country labels 
        this.countryLabels = this.graphGroup.append('g')
            .attr('class', 'country-labels')
            .selectAll('text')
            .data(this.data.nodes.filter(d => !d.isRegionNode)) // Show all country nodes
            .enter()
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '-0.8em') 
            .text(d => d.id)
            .attr('font-size', '9px') 
            .attr('font-weight', 'normal')
            .attr('fill', '#333')
            .style('pointer-events', 'none') 
            .style('text-shadow', '0 0 2px white, 0 0 2px white, 0 0 2px white, 0 0 2px white') 
            .style('opacity', 0.85); 
            
        
    
        this.labels = this.graphGroup.selectAll('.country-labels text');
            
        // Create legend 
        this.createLegend();
            
        // Update positions on tick
        this.simulation.on('tick', () => this.ticked());
        
        // Run simulation for initial layout
        for (let i = 0; i < 100; i++) {
            this.simulation.tick();
        }
        // Update initial positions
        this.ticked();
    }
    
    dragBehavior() {
        return d3.drag()
            .on('start', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0.3).restart();
                d.fx = d.x;
                d.fy = d.y;
            })
            .on('drag', (event, d) => {
                d.fx = event.x;
                d.fy = event.y;
            })
            .on('end', (event, d) => {
                if (!event.active) this.simulation.alphaTarget(0);
                d.fx = null;
                d.fy = null;
            });
    }
    
    showTooltip(event, d) {
        // Create tooltip 
        let tooltip = d3.select('body').select('.network-tooltip');
        
        if (tooltip.empty()) {
            tooltip = d3.select('body').append('div')
                .attr('class', 'network-tooltip')
                .style('position', 'absolute')
                .style('background', 'white')
                .style('border', '1px solid #ccc')
                .style('border-radius', '5px')
                .style('padding', '10px')
                .style('box-shadow', '0 2px 4px rgba(0,0,0,0.2)')
                .style('pointer-events', 'none')
                .style('opacity', 0);
        }
        
        // Format tooltip content for country nodes 
        let content = `
            <strong>${d.id}</strong> <span class="region-tag" style="background-color:${this.regionColorScale(d.region)}">${d.region}</span><br>
            Tourism: ${this.formatNumber(d.tourism)} visitors<br>
            Heritage Sites: ${d.heritage} total sites<br>
            <strong>Tourists per Heritage Site: ${this.formatLargeNumber(d.touristsPerSite)}</strong>
        `;
        
        // Set tooltip content and position
        tooltip.html(content)
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 10) + 'px')
            .transition()
            .duration(200)
            .style('opacity', 0.9);
    }
    
    hideTooltip() {
        d3.select('.network-tooltip')
            .transition()
            .duration(500)
            .style('opacity', 0);
    }
    
    // Get region for a node by ID
    getNodeRegion(nodeId) {
        const node = this.data.nodes.find(n => n.id === nodeId);
        return node ? node.region : null;
    }
    
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        } else {
            return num.toString();
        }
    }
    
    formatLargeNumber(num) {
        if (num === 0 || !num) return 'N/A';
        
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + ' million';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + ' thousand';
        } else {
            return num.toFixed(0);
        }
    }
    
    // Create legend for the network graph
    createLegend() {
        // Define legend dimensions and positioning
        const legendWidth = this.width * 0.3; 
        const legendMargin = { top: 10, right: 5, bottom: 10, left: 5 }; 
        const legendPadding = 10; 
        const legendItemHeight = 22; 
        const legendItemSpacing = 3; 
        
        // Get unique regions
        const regions = Array.from(new Set(this.data.nodes.map(d => d.region)));
        
        // Create a legend container 
        const legend = this.svg.append('g')
            .attr('class', 'network-legend')
            .attr('transform', `translate(${this.width * 0.7}, ${legendMargin.top})`); 
        
        // Set background
        legend.append('rect')
            .attr('width', legendWidth)
            .attr('height', this.height - legendMargin.top - legendMargin.bottom)
            .attr('rx', 8)
            .attr('ry', 8)
            .attr('fill', '#f5f7fa')
            .attr('stroke', '#e1e5eb')
            .attr('stroke-width', 1)
            .attr('opacity', 0.95);
        
        // Add title for the legend
        legend.append('text')
            .attr('x', legendPadding)
            .attr('y', legendPadding + 20) 
            .attr('font-size', '16px') 
            .attr('font-weight', 'bold')
            .attr('fill', '#2e7d32')
            .text('Network Instructions');
        
        // Add subtitle for Regional Clusters
        legend.append('text')
            .attr('x', legendPadding)
            .attr('y', legendPadding + 45) 
            .attr('font-size', '14px') 
            .attr('font-weight', 'bold')
            .text('Regional Clusters');
        
        // Add region color items
        const regionItems = legend.selectAll('.region-legend-item')
            .data(regions)
            .enter()
            .append('g')
            .attr('class', 'region-legend-item')
            .attr('transform', (d, i) => `translate(${legendPadding}, ${i * (legendItemHeight + legendItemSpacing) + legendPadding + 55})`); // Adjusted spacing
        
        // Add colored circles for each region
        regionItems.append('circle')
            .attr('r', 6) 
            .attr('fill', d => this.regionColorScale(d))
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
        
        // Add region labels
        regionItems.append('text')
            .attr('x', 15) 
            .attr('y', 4) 
            .attr('font-size', '12px') 
            .text(d => d);
        
        // Add line
        const dividerY1 = regions.length * (legendItemHeight + legendItemSpacing) + legendPadding + 65; 
        legend.append('line')
            .attr('x1', legendPadding)
            .attr('y1', dividerY1)
            .attr('x2', legendWidth - legendPadding)
            .attr('y2', dividerY1)
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1);
            
        // Add title for tourism volume display
        legend.append('text')
            .attr('x', legendPadding)
            .attr('y', dividerY1 + 25) 
            .attr('font-size', '14px') 
            .attr('font-weight', 'bold')
            .text('Tourism Efficiency');
            
        // Description of tourism volume
        legend.append('text')
            .attr('x', legendPadding)
            .attr('y', dividerY1 + 45) 
            .attr('font-size', '12px') 
            .attr('fill', '#555')
            .style('max-width', `${legendWidth - legendPadding * 2}px`)
            .text('Node size indicates tourism efficiency:');
            
        legend.append('text')
            .attr('x', legendPadding)
            .attr('y', dividerY1 + 60) 
            .attr('font-size', '12px') 
            .attr('fill', '#555')
            .style('max-width', `${legendWidth - legendPadding * 2}px`)
            .text('tourists per heritage site ratio.');
        
        // Add size legend items
        const sizeItems = legend.append('g')
            .attr('class', 'size-legend')
            .attr('transform', `translate(${legendPadding}, ${dividerY1 + 70})`); // Adjusted spacing
        
        // Large circle - many tourists per heritage site
        sizeItems.append('circle')
            .attr('r', 12) 
            .attr('cx', 12) 
            .attr('cy', 12) 
            .attr('fill', '#45abf5')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
            
        sizeItems.append('text')
            .attr('x', 30) 
            .attr('y', 16) 
            .attr('font-size', '12px') 
            .text('Large: Many tourists per site');
        
        // Small circle - few tourists per heritage site
        sizeItems.append('circle')
            .attr('r', 6) 
            .attr('cx', 12) 
            .attr('cy', 40) 
            .attr('fill', '#45abf5')
            .attr('stroke', '#fff')
            .attr('stroke-width', 1);
            
        sizeItems.append('text')
            .attr('x', 30) 
            .attr('y', 44) 
            .attr('font-size', '12px') 
            .text('Small: Few tourists per site');
        
        // Add line
        const dividerY2 = dividerY1 + 120; 
        legend.append('line')
            .attr('x1', legendPadding)
            .attr('y1', dividerY2)
            .attr('x2', legendWidth - legendPadding)
            .attr('y2', dividerY2)
            .attr('stroke', '#ccc')
            .attr('stroke-width', 1);
        
        // Add instructions section
        legend.append('text')
            .attr('x', legendPadding)
            .attr('y', dividerY2 + 25) 
            .attr('font-size', '14px') 
            .attr('font-weight', 'bold')
            .text('How to Explore');
        
        const instructions = [
            "- Click region buttons to filter",
            "- Hover over nodes for details",
            "- Drag nodes to reposition"
        ];
        
        instructions.forEach((text, i) => {
            legend.append('text')
                .attr('x', legendPadding)
                .attr('y', dividerY2 + 45 + i * 20) 
                .attr('font-size', '12px') 
                .attr('fill', '#555')
                .text(text);
        });
    }
}

// Set up network controls
function setupNetworkControls() {
    // Create region filter buttons 
    createRegionButtons();
}

// Create region filter buttons
function createRegionButtons() {
    const regions = ["Europe", "Asia", "Africa", "Latin America", "Arab States"];
    
    // Create a container for the filter buttons 
    const controlsContainer = d3.select('#network-controls')
        .style('background-color', '#e9e9e9')
        .style('border-radius', '8px')
        .style('padding', '10px')
        .style('margin-bottom', '15px')
        .style('display', 'flex')
        .style('justify-content', 'center')
        .style('gap', '10px');
    
    // Add All Regions button 
    controlsContainer.append('button')
        .attr('id', 'show-all-regions')
        .attr('class', 'region-button active')
        .style('padding', '8px 15px')
        .style('border-radius', '20px')
        .style('background-color', '#87CEFA')
        .style('border', 'none')
        .style('color', '#333')
        .style('cursor', 'pointer')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('All Regions')
        .on('click', function() {
            d3.selectAll('.region-button').classed('active', false);
            d3.select(this).classed('active', true);
            networkGraph.filterByRegion(null);
        });
    
    // Color map 
    const regionColors = {
        "Europe": "#45abf5",
        "Asia": "#ea4e34",
        "Africa": "#8b56f5", 
        "Latin America": "#f5a21d",
        "Arab States": "#59a14f"
    };
    
    // Add a button for each region 
    regions.forEach(region => {
        const color = regionColors[region];
        
        controlsContainer.append('button')
            .attr('class', 'region-button')
            .style('padding', '8px 15px')
            .style('border-radius', '20px')
            .style('background-color', color)
            .style('border', 'none')
            .style('color', 'white')
            .style('cursor', 'pointer')
            .style('font-size', '14px')
            .text(region)
            .on('click', function() {
                d3.selectAll('.region-button').classed('active', false);
                d3.select(this).classed('active', true);
                networkGraph.filterByRegion(region);
            });
    });
    
    // Add CSS for active button state
    const style = document.createElement('style');
    style.textContent = `
        .region-button.active {
            box-shadow: 0 0 0 2px #333;
            transform: scale(1.05);
            transition: all 0.2s ease;
        }
    `;
    document.head.appendChild(style);
}

// Handle window resize
window.addEventListener('resize', function() {
    if (networkGraph) {
        // Store current region selection
        const activeButton = document.querySelector('.region-button.active');
        const selectedRegion = activeButton && activeButton.id !== 'show-all-regions' ? activeButton.textContent : null;

        // Redraw the graph 
        d3.select('#network-chart svg').remove();
        
        networkGraph.width = document.getElementById('network-chart').clientWidth;
        networkGraph.height = document.getElementById('network-chart').clientHeight;
        
        // Adjust dimensions 
        const visualizationWidth = networkGraph.width * 0.7;
        
        // Recreate SVG
        networkGraph.svg = d3.select('#network-chart')
            .append('svg')
            .attr('width', networkGraph.width)
            .attr('height', networkGraph.height)
            .attr('viewBox', `0 0 ${networkGraph.width} ${networkGraph.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet');
            
        // Create a new graph group
        networkGraph.graphGroup = networkGraph.svg.append('g')
            .attr('transform', `translate(${visualizationWidth * 0.05}, 0)`);
            
        // Reinitialize simulation 
        networkGraph.initializeSimulation();
        
        // Render
        networkGraph.render();
        
        // Restore region selection 
        if (selectedRegion) {
            setTimeout(() => {
                networkGraph.filterByRegion(selectedRegion);
                // Update button states
                d3.selectAll('.region-button').classed('active', false);
                d3.selectAll('.region-button').filter(function() {
                    return this.textContent === selectedRegion;
                }).classed('active', true);
                
            
                if (selectedRegion) {
                    networkGraph.recenterRegion(selectedRegion);
                }
            }, 200);  
        }
    }
}); 