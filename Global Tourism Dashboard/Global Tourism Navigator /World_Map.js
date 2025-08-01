// Section 1: World Map
// Variables Initialization
let countriesData;
let worldMap;
let mapCreated = false;

// Set up dimensions for the map
const width = window.innerWidth;
const height = window.innerHeight;
const mapWidth = Math.min(1200, width * 0.9);
const mapHeight = Math.min(800, height * 0.8);

// Color scales for the map and pie chart
const tourismColorScale = d3.scaleSequentialLog()
    .interpolator(d3.interpolateBlues);

const pieColors = {
    "Cultural": "#1976d2",
    "Natural": "#43a047",
    "Mixed": "#f9a825"
};

// Visualization Loading
document.addEventListener('DOMContentLoaded', function() {
    // Load data
    Promise.all([
        d3.json('https://unpkg.com/world-atlas@2.0.2/countries-110m.json'), // Load world map 
        d3.csv('Data/Country_Summary_S1.csv') // Load country summary data
    ]).then(([world, countries]) => {
        // Load data
        worldMap = world;
        countriesData = countries.map(d => ({
            country: d.Country,
            region: d.Region,
            totalHeritage: +d["World Heritage Sites"],
            culturalHeritage: +d["Cultural Heritage Sites"],
            naturalHeritage: +d["Natural Heritage Sites"],
            mixedHeritage: +d["Mixed Heritage Sites"],
            tourismVolume: +d["Tourism Volume"]
        }));
        
        // Set up color scales according to data ranges
        const maxTourism = d3.max(countriesData, d => d.tourismVolume);
        
        tourismColorScale.domain([10000, maxTourism]);
        
        // Display settings: map instructions, no data message, and details data
        document.querySelector('#details-panel .details-header').style.display = 'none';
        document.getElementById('no-data-message').style.display = 'none';
        document.getElementById('map-instructions').style.display = 'block';
        document.querySelector('#details-panel .details-content').style.display = 'none';
        
        // Create the map
        createMap();
    });
});

// Create the world map visualization
function createMap() {
    // Set up the map entity
    const projection = d3.geoNaturalEarth1()
        .fitSize([mapWidth, mapHeight], topojson.feature(worldMap, worldMap.objects.countries));
    
    const path = d3.geoPath().projection(projection); // Create path for the map
    
    // Create map SVG 
    const svg = d3.select('#map-chart')
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${mapWidth} ${mapHeight}`)
        .attr('preserveAspectRatio', 'xMidYMid meet');
    
    // Add background for the map
    svg.append('path')
        .datum({ type: 'Sphere' })
        .attr('class', 'sphere')
        .attr('d', path);
    
    // Create a map for country name lookup
    const countryNameMap = {};
    countriesData.forEach(d => {
        countryNameMap[d.country] = d;
    });
    
    // Draw countries on the map
    const countries = topojson.feature(worldMap, worldMap.objects.countries).features;
    
    // Draw countries on the map
    svg.selectAll('.country')
        .data(countries)
        .enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path)
        .attr('data-name', d => {
            // Match country names from TopoJSON with loaded dataset
            const countryName = getCountryName(d.properties.name);
            return countryName;
        }) // Add country name to the map
        .on('mouseover', function(event, d) {
            // Highlight country
            d3.select(this) // Select the country
                .classed('highlighted', true);
            
            // Display country detail information
            const countryName = getCountryName(d.properties.name);
            showCountryDetails(countryName);
        })
        .on('mouseout', function() {
            // Remove highlight from the country
            d3.select(this)
                .classed('highlighted', false);
                
            // Restore initial state to hide details, show instructions
            document.querySelector('#details-panel .details-header').style.display = 'none';
            document.querySelector('#details-panel .details-content').style.display = 'none';
            document.getElementById('no-data-message').style.display = 'none';
            document.getElementById('map-instructions').style.display = 'block';
        });
    
    // Add country borders
    svg.append('path')
        .datum(topojson.mesh(worldMap, worldMap.objects.countries, (a, b) => a !== b))
        .attr('class', 'mesh')
        .attr('d', path);
    
    // Create legend
    createLegend();
    
    // Set initial map colors
    colorMapByTourism();
    
    mapCreated = true;
}

// Color the map by tourism volume
function colorMapByTourism() {
    d3.selectAll('.country')
        .transition()
        .duration(750)
        .style('fill', function() {
            const countryName = d3.select(this).attr('data-name');
            const countryData = countriesData.find(d => d.country === countryName);
            
            if (!countryData) return '#e0e0e0'; 
            
            return countryData.tourismVolume ? tourismColorScale(countryData.tourismVolume) : '#e0e0e0';
        });
}

// Create color legend
function createLegend() {
    const legendWidth = 300;
    const legendHeight = 50;  
    
    const legend = d3.select('#map-legend')
        .append('svg')
        .attr('width', legendWidth)
        .attr('height', legendHeight);
    
    // Add legend title
    legend.append('text')
        .attr('class', 'legend-title')
        .attr('x', legendWidth / 2)
        .attr('y', 12)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', 'bold')
        .text('Tourism Volume');
    
    const defs = legend.append('defs');
    
    // Create linear gradient for tourism
    const tourismGradient = defs.append('linearGradient')
        .attr('id', 'tourism-gradient')
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '100%')
        .attr('y2', '0%');
    
    // Add color stops for tourism gradient
    const tourismStops = [0, 0.2, 0.4, 0.6, 0.8, 1];
    tourismStops.forEach(stop => {
        tourismGradient.append('stop')
            .attr('offset', `${stop * 100}%`)
            .attr('stop-color', d3.interpolateBlues(stop));
    });
    
    // Create the rectangle with gradient
    legend.append('rect')
        .attr('class', 'legend-rect tourism-legend')
        .attr('x', 0)
        .attr('y', 20)  // Put the legend below the title
        .attr('width', legendWidth)
        .attr('height', 15)
        .style('fill', 'url(#tourism-gradient)');
    
    // Add legend labels with actual values
    legend.append('text')
        .attr('class', 'legend-min tourism-min')
        .attr('x', 0)
        .attr('y', 45)  // Put the legend below the gradient
        .attr('text-anchor', 'start')
        .style('font-size', '10px')
        .text('10,000'); 
    
    legend.append('text')
        .attr('class', 'legend-max tourism-max')
        .attr('x', legendWidth)
        .attr('y', 45)  // Put the legend below the gradient
        .attr('text-anchor', 'end')
        .style('font-size', '10px')
        .text(formatNumber(d3.max(countriesData, d => d.tourismVolume)));  // Max value
}

// When hover a country, show country details in the right panel
function showCountryDetails(countryName) {
    const countryData = countriesData.find(d => d.country === countryName);
    
    if (!countryData) {
        // Show no-data message for countries without data
        document.getElementById('no-data-message').style.display = 'block'; // Display no-data message
        document.getElementById('map-instructions').style.display = 'none'; // Hide map instructions
        document.querySelector('#details-panel .details-header').style.display = 'none'; // Hide details header
        document.querySelector('#details-panel .details-content').style.display = 'none'; // Hide details content
        return;
    }
    
    // Hide instructions and no-data message, show details header
    document.getElementById('no-data-message').style.display = 'none'; // Hide no-data message
    document.getElementById('map-instructions').style.display = 'none'; // Hide map instructions
    document.querySelector('#details-panel .details-header').style.display = 'block'; // Show details header
    
    document.getElementById('country-name').textContent = countryData.country; // Update country name
    
    // Update tourism volume
    document.getElementById('tourism-volume').textContent = formatNumber(countryData.tourismVolume);
    
    // Update heritage sites
    document.getElementById('heritage-sites').textContent = countryData.totalHeritage;
    
    // Update heritage site percentages
    document.getElementById('cultural-percent').textContent = countryData.culturalHeritage.toFixed(1) + '%';
    document.getElementById('natural-percent').textContent = countryData.naturalHeritage.toFixed(1) + '%';
    document.getElementById('mixed-percent').textContent = countryData.mixedHeritage.toFixed(1) + '%';
    
    // Show details content
    document.querySelector('#details-panel .details-content').style.display = 'block';
    
    // Create pie chart
    createPieChart(countryData);
}

// Create pie chart for heritage site types
function createPieChart(countryData) {
    // Clear previous chart
    d3.select('#pie-chart-container').html('');
    
    // Prepare data for pie chart
    const pieData = [
        { type: 'Cultural', value: countryData.culturalHeritage, percentage: countryData.culturalHeritage },
        { type: 'Natural', value: countryData.naturalHeritage, percentage: countryData.naturalHeritage },
        { type: 'Mixed', value: countryData.mixedHeritage, percentage: countryData.mixedHeritage }
    ];
    
    // Filter out zero values
    const filteredPieData = pieData.filter(d => d.percentage > 0);
    
    // Set up dimensions
    const width = 120;
    const height = 120;
    const radius = Math.min(width, height) / 2;
    
    // Create SVG
    const svg = d3.select('#pie-chart-container')
        .append('svg')
        .attr('width', width)
        .attr('height', height)
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .append('g')
        .attr('transform', `translate(${width / 2}, ${height / 2})`);
    
    // Create pie 
    const pie = d3.pie()
        .value(d => d.percentage)
        .sort(null)
        .padAngle(0.02);
    
    // defind arc dimension
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius * 0.75);
    
    // Create pie parts
    const slices = svg.selectAll('.slice')
        .data(pie(filteredPieData))
        .enter()
        .append('g')
        .attr('class', 'slice');
    
    // Add paths for the pie parts
    slices.append('path')
        .attr('d', arc)
        .attr('fill', d => pieColors[d.data.type]) // Fill the pie parts with the color of the heritage site type
        .attr('stroke', 'white')
        .style('stroke-width', '1.5px')
        .style('opacity', 0.9)
        .transition()
        .duration(500)
        .attrTween('d', function(d) {
            const interpolate = d3.interpolate({ startAngle: 0, endAngle: 0 }, d); 
            return function(t) {
                return arc(interpolate(t)); 
            };
        });
    
    // Add percentage labels for pie charts
    slices.filter(d => d.data.percentage >= 15)
        .append('text')
        .attr('transform', d => `translate(${arc.centroid(d)})`) 
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('fill', 'white')
        .style('font-size', '8px')
        .style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .text(d => `${Math.round(d.data.percentage)}%`); // Display the percentage of the pie parts
}

//  format numbers with commas
function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","); // Format numbers with commas
}

//  match country names between datasets and loaded dataset
function getCountryName(name) {
    //  match unmathced country names
    const nameMap = {
        'United States of America': 'United States',
        'United States': 'United States of America',
        'Russia': 'Russian Federation',
        'Democratic Republic of the Congo': 'Democratic Republic of Congo',
        'Republic of the Congo': 'Republic of Congo',
        'Tanzania': 'United Republic of Tanzania',
        'Myanmar': 'Myanmar (Burma)',
        'Vietnam': 'Viet Nam',
        'Laos': 'Lao PDR',
        'South Korea': 'Republic of Korea',
        'North Korea': 'Democratic People\'s Republic of Korea',
        'Guinea Bissau': 'Guinea-Bissau',
        'Ivory Coast': 'Côte d\'Ivoire',
        'Czechia': 'Czech Republic'
    };
    

    // Find a matching country in loaded dataset
    const match = countriesData.find(d => 
        d.country === name || // Match the country name
        d.country.includes(name) || 
        name.includes(d.country)
    ); 
    
    return match ? match.country : name; // Return the matched country name
}
