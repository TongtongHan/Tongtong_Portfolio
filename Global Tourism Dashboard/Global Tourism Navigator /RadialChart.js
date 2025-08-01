// Radial Stacked Bar Chart for Regional Tourism Data
document.addEventListener('DOMContentLoaded', function() {
    // Chart dimensions
    const width = 750;
    const height = 750;
    const innerRadius = 60;  
    const outerRadius = 260;  
    const legendRadius = 60;  
    
    // Create SVG container 
    const svg = d3.select('#radial-chart')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', [-width / 2, -height / 2, width, height])
        .attr('style', 'max-width: 100%; height: auto; font: 10px sans-serif;');
    
    // Load and process data
    d3.csv('Data/cluster_regaion.csv').then(function(data) {
        // Parse numeric values
        data.forEach(d => {
            d['Visitor Trip 2023'] = +d['Visitor Trip 2023'];
            d['Expenditure 2023'] = +d['Expenditure 2023'];
            d['Visitor Trip 2024'] = +d['Visitor Trip 2024'];
            d['Expenditure 2024'] = +d['Expenditure 2024'];
            d['Visitor Growth Rate'] = +d['Visitor Growth Rate'].replace('%', '');
        });
        
        // Set initial data type (visitor trips or expenditure)
        let currentType = 'Visitor Trip';
        let currentRegion = null;
        
        // Create visualization 
        createVisualization(data);
        
        // Display Sydney by default
        if (data.length > 0) {
            const defaultRegion = {
                region: data[0].Region,
                '2023': data[0][`${currentType} 2023`],
                '2024': data[0][`${currentType} 2024`],
                growthRate: data[0]['Visitor Growth Rate'],
                category: data[0]['City Category']
            };
            
            // Display details 
            setTimeout(() => {
                updateDetailsPanel(defaultRegion);
                currentRegion = defaultRegion;
                
                 
                d3.select('#no-region-message').style('display', 'none');
            }, 100);
        }
        
        // Event listeners for buttons
        d3.select("#visitor-btn").on("click", function() {
            d3.select("#visitor-btn").classed("active", true);
            d3.select("#expenditure-btn").classed("active", false);
            currentType = "Visitor Trip";
            updateVisualization();
            
            // Update the details panel for the current region or default to first region
            if (currentRegion) {
                // Update the region data with the new data type
                const regionIndex = data.findIndex(d => d.Region === currentRegion.region);
                if (regionIndex >= 0) {
                    currentRegion = {
                        region: data[regionIndex].Region,
                        '2023': data[regionIndex][`${currentType} 2023`],
                        '2024': data[regionIndex][`${currentType} 2024`],
                        growthRate: data[regionIndex]['Visitor Growth Rate'],
                        category: data[regionIndex]['City Category']
                    };
                    updateDetailsPanel(currentRegion);
                }
            } else if (data.length > 0) {
                // Use the first region as default
                const defaultRegion = {
                    region: data[0].Region,
                    '2023': data[0][`${currentType} 2023`],
                    '2024': data[0][`${currentType} 2024`],
                    growthRate: data[0]['Visitor Growth Rate'],
                    category: data[0]['City Category']
                };
                updateDetailsPanel(defaultRegion);
                currentRegion = defaultRegion;
            }
        });
        
        // For button click, update the visualization and details panel
        d3.select("#expenditure-btn").on("click", function() {
            d3.select("#visitor-btn").classed("active", false);
            d3.select("#expenditure-btn").classed("active", true);
            currentType = "Expenditure";
            updateVisualization();
            
            // Update the details panel for the current region or default to first region
            if (currentRegion) {
                // Update the region data with the new data type
                const regionIndex = data.findIndex(d => d.Region === currentRegion.region);
                if (regionIndex >= 0) {
                    currentRegion = {
                        region: data[regionIndex].Region,
                        '2023': data[regionIndex][`${currentType} 2023`],
                        '2024': data[regionIndex][`${currentType} 2024`],
                        growthRate: data[regionIndex]['Visitor Growth Rate'],
                        category: data[regionIndex]['City Category']
                    };
                    updateDetailsPanel(currentRegion);
                }
            } else if (data.length > 0) {
                // Use the first region as default
                const defaultRegion = {
                    region: data[0].Region,
                    '2023': data[0][`${currentType} 2023`],
                    '2024': data[0][`${currentType} 2024`],
                    growthRate: data[0]['Visitor Growth Rate'],
                    category: data[0]['City Category']
                };
                updateDetailsPanel(defaultRegion);
                currentRegion = defaultRegion;
            }
        });
        
        // Function to create and update the visualization
        function createVisualization(data) {
            // Parse data
            const regions = [...new Set(data.map(d => d.Region))];
            const years = [...new Set(data.map(d => d.Year))];
            
            // Calculate the bar width 
            const barWidth = (Math.PI * 2) / regions.length * 0.8;
            
            // Clear previous chart elements
            svg.selectAll('.chart-elements').remove();
            
            // Create a container for all chart elements
            const chartGroup = svg.append('g')
                .attr('class', 'chart-elements');
            
            // Create data structure for stacked bars
            const processedData = data.map(d => ({
                region: d.Region,
                '2023': d[`${currentType} 2023`],
                '2024': d[`${currentType} 2024`],
                total: d[`${currentType} 2023`] + d[`${currentType} 2024`],
                growthRate: d['Visitor Growth Rate'],
                category: d['City Category']
            }));
            
            // Sort by total (descending)
            processedData.sort((a, b) => b.total - a.total);
            
            // Prepare data for stacking
            const stackData = processedData.map(d => ({
                region: d.region,
                '2023': d['2023'],
                '2024': d['2024'],
                growthRate: d.growthRate,
                category: d.category
            }));
            
            // Define stack generator
            const stack = d3.stack()
                .keys(['2023', '2024']);
                
            // Generate stacked data
            const series = stack(stackData);
            
            // Set up scales
            const x = d3.scaleBand()
                .domain(processedData.map(d => d.region))
                .range([0, 2 * Math.PI])
                .align(0);
                
            // Radial scale for values
            const y = d3.scaleRadial()
                .domain([0, d3.max(series[series.length - 1], d => d[1])])
                .range([innerRadius, outerRadius]);
                
            // Color scale for years 
            const color = d3.scaleOrdinal()
                .domain(['2023', '2024'])
                .range(["#FF8A65", "#1976D2"]);  //  orange and blue
                
            // Function to create arcs
            const arc = d3.arc()
                .innerRadius(d => y(d[0]))
                .outerRadius(d => y(d[1]))
                .startAngle(d => x(d.data.region))
                .endAngle(d => x(d.data.region) + x.bandwidth())
                .padAngle(0.005)  
                .padRadius(innerRadius);
            
            // Create a group for each series (year)
            const yearGroups = chartGroup.selectAll('.series')
                .data(series)
                .join('g')
                .attr('class', d => `series series-${d.key}`)
                .attr('fill', d => color(d.key));
                
            // Create paths for each region in each series
            yearGroups.selectAll('path')
                .data(d => d)
                .join('path')
                .attr('d', arc)
                .attr('opacity', 0.9)
                .attr('stroke', '#fff')
                .attr('stroke-width', 0.5)
                .attr('cursor', 'pointer')
                .on('mouseover', function(event, d) {
                    // Highlight the hovered segment
                    d3.select(this)
                        .attr('opacity', 1)
                        .attr('stroke-width', 1.5);
                    
                    // Update the details panel
                    updateDetailsPanel(d.data);
                    currentRegion = d.data;
                })
                .on('mouseout', function() {
                    // Reset the segment appearance
                    d3.select(this)
                        .attr('opacity', 0.9)
                        .attr('stroke-width', 0.5);
                });
            
            // Add outer edge region labels for reference
            chartGroup.append('g')
                .attr('class', 'outer-labels')
                .selectAll('g')
                .data(processedData)
                .join('g')
                .attr('transform', d => `
                    rotate(${((x(d.region) + x.bandwidth() / 2) * 180 / Math.PI - 90)})
                    translate(${outerRadius + 10},0)
                `)
                .append('text')
                .attr('transform', d => {
                    const angle = (x(d.region) + x.bandwidth() / 2);
                    return angle > Math.PI && angle < 2 * Math.PI ? 'rotate(180)' : '';
                })
                .attr('alignment-baseline', 'middle')
                .attr('font-size', '12px')
                .attr('font-weight', 'bold')
                .attr('fill', '#999')
                .style('opacity', 0.9)
                .text(d => {
                    const words = d.region.split(' ');
                    const firstWord = words[0];
                    
                    // If first word is longer than 5 characters, display only the first word
                    // Otherwise display the full region name
                    return firstWord.length > 5 ? firstWord : d.region;
                });
            
            // Add radial grid lines
            const yTicks = y.ticks(5);
            
            // Add circles for the grid
            chartGroup.append('g')
                .selectAll('circle')
                .data(yTicks)
                .join('circle')
                .attr('fill', 'none')
                .attr('stroke', '#ddd')
                .attr('stroke-dasharray', '1,2')
                .attr('r', y);
            
            // Add labels for the grid lines
            chartGroup.append('g')
                .selectAll('text')
                .data(yTicks)
                .join('text')
                .attr('text-anchor', 'middle')
                .attr('x', 0)
                .attr('y', d => -y(d))
                .attr('dy', '0.35em')
                .attr('font-size', '8px')
                .attr('fill', '#666')
                .text(d => d3.format(',')(d));
                
            // Add y-axis title
            chartGroup.append('text')
                .attr('text-anchor', 'start')
                .attr('x', -width/2 + 20)
                .attr('y', -height/2 + 20)
                .attr('font-size', '20px')
                .attr('font-weight', 'bold')
                .attr('fill', '#FFB823')
                .text(currentType === 'Visitor Trip' ? 'Visitor Trips (thousands)' : 'Expenditure ($M)');
            
            // Add legend in the inner circle
            const legend = chartGroup.append('g')
                .attr('class', 'legend');
            
            // Add background circle for legend 
            legend.append('circle')
                .attr('r', innerRadius * 0.7)
                .attr('fill', 'white')
                .attr('opacity', 0.6)
                .attr('stroke', '#eee')
                .attr('stroke-width', 1);
            
            
            // Legend items in a horizontal layout
            const legendItems = legend.selectAll('.legend-item')
                .data(['2023', '2024'])
                .join('g')
                .attr('class', 'legend-item')
                .attr('transform', (d, i) => `translate(-15, ${i * 28 - 10})`);
            
            legendItems.append('rect')
                .attr('width', 20)
                .attr('height', 20)
                .attr('rx', 2)
                .attr('fill', d => color(d));
            
            legendItems.append('text')
                .attr('x', 30)
                .attr('y', 15)
                .attr('font-size', '12px')
                .text(d => d);
        }
        
        // Function to update visualization when data type changes
        function updateVisualization() {
            createVisualization(data);
        }
        
        // Function to update the details panel
        function updateDetailsPanel(regionData) {
            if (!regionData) {
                return;
            }
            
            // Hide the no-data message
            d3.select('#no-region-message').style('display', 'none');
            
            // Show the details content for the region panel
            d3.select('#region-details-panel .details-content').style('display', 'block');
            
            // Update region name
            d3.select('#region-name').text(regionData.region);
            
            // Update data type label
            d3.select('#data-type-label').text(currentType.toUpperCase());
            
            // Update unit
            d3.select('#data-unit').text(currentType === 'Expenditure' ? 'expenditure ($M)' : 'visitors (thousands)');
            
            // Make sure numeric values
            const value2023 = +regionData['2023'] || 0;
            const value2024 = +regionData['2024'] || 0;
            const totalValue = value2023 + value2024;
            
            // Update values with formatting
            const format = d3.format(',');
            d3.select('#data-value').text(format(totalValue));
            d3.select('#growth-rate').text((regionData.growthRate || 0) + '%');
            d3.select('#city-category').text(regionData.category || 'N/A');
            
        }
    });
});