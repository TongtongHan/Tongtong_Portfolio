// Sunburst Chart Implementation
document.addEventListener('DOMContentLoaded', function() {
    // Load the data
    d3.json('Data/S3_Expendature.json').then(function(data) {
        createSunburstChart(data);
    });

    function createSunburstChart(data) {
        // Set up dimensions and radius
        const width = 900;
        const height = 750; 
        const radius = Math.min(width, height - 120) / 2;

        // Create SVG
        const svg = d3.select('#sunburst-chart')
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2 + 20})`);

        // Create a tooltip
        const tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);

        // Create a color scale
        const color = d3.scaleOrdinal()
            .domain(["Business", "Education", "Holiday", "Other purpose", "Visiting friends"])
            .range(["#7b6888", "#e08214", "#3182bd", "#d33682", "#31a354"]);

        // Convert data to hierarchy structure
        const dataCopy = JSON.parse(JSON.stringify(data));
        dataCopy.children = dataCopy["Travel Purpose"];
        delete dataCopy["Travel Purpose"];
        
        // Prepare the data for the sunburst layout
        const root = d3.hierarchy(dataCopy)
            .sum(d => d.children ? 0 : d.value);

        // Create the sunburst layout
        const partition = d3.partition()
            .size([2 * Math.PI, radius * 0.9]);

        // Apply the layout to the data
        partition(root);

        // Create arcs for the sunburst
        const arc = d3.arc()
            .startAngle(d => d.x0)
            .endAngle(d => d.x1)
            .innerRadius(d => d.y0)
            .outerRadius(d => d.y1);

        // Add the paths with coloring
        const path = svg.selectAll('path')
            .data(root.descendants())
            .enter()
            .append('path')
            .attr('d', arc)
            .style('fill', d => {
                if (d.depth === 0) return "white"; // center circle
                if (d.depth === 1) return color(d.data.name);
                if (d.depth === 2) return d3.color(color(d.parent.data.name)).brighter(0.5);
                return d3.color(color(d.parent.parent.data.name)).brighter(1);
            })
            .style('stroke', '#fff')
            .style('stroke-width', '1px')
            .style('opacity', 1)
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .style('opacity', 0.8)
                    .style('cursor', 'pointer');

                let tooltipContent = `<strong>${d.data.name}</strong>`;
                
                if (d.data.value) {
                    tooltipContent += `<br>Amount: $${d.data.value.toLocaleString()}M`;
                }
                
                if (d.data.percentage) {
                    tooltipContent += `<br>Percentage: ${d.data.percentage}`;
                }
                
                if (d.depth > 1 && d.parent) {
                    tooltipContent += `<br>Category: ${d.parent.data.name}`;
                }
                
                tooltip.transition()
                    .duration(200)
                    .style('opacity', .9);
                
                tooltip.html(tooltipContent)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .style('opacity', 1);
                
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
            });

        // Add center circle text for total value
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "-0.2em")
            .style("font-size", "14px")
            .text("Total");
            
        svg.append("text")
            .attr("text-anchor", "middle")
            .attr("dy", "1em")
            .style("font-size", "14px")
            .text(root.value.toLocaleString());

        // Add a label for each element in the sunburst
        svg.append("g")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .attr("font-size", 10)
            .attr("font-family", "sans-serif")
            .selectAll("text")
            .data(root.descendants().filter(d => d.depth && (d.y0 + d.y1) / 2 * (d.x1 - d.x0) > 10))
            .join("text")
            .attr("transform", function(d) {
                const x = (d.x0 + d.x1) / 2 * 180 / Math.PI;
                const y = (d.y0 + d.y1) / 2;
                return `rotate(${x - 90}) translate(${y},0) rotate(${x < 180 ? 0 : 180})`;
            })
            .attr("dy", "0.35em")
            .style("fill", d => d.depth === 1 ? "#fff" : "#333") // White text for level 1, dark for others
            .style("font-size", d => d.depth === 1 ? "12px" : "10px") // Larger text for level 1
            .style("font-weight", d => d.depth === 1 ? "bold" : "normal") // Bold text for level 1
            .text(d => d.data.name);

        // Add hierarchical view description
        svg.append('text')
            .attr('text-anchor', 'middle')
            .attr('y', -radius - 5)
            .attr('x', 0)
            .text('Inner circle: total tourism spending in AU > Middle ring: Travel Purpose > Outer ring: Expenditure Category')
            .style('font-size', '15px');

    }
});
