// Circle Packing Visualization for Travel Experience Word Factors
document.addEventListener('DOMContentLoaded', function() {
    // Create a container for the split layout
    const container = d3.select('#circle-packing')
        .style('display', 'flex')
        .style('flex-direction', 'column')
        .style('width', '100%')
        .style('height', 'auto')
        .style('align-items', 'center');
    
    // Add main title
    container.append('h2')
        .text('Key Findings from Visitor Feedback')
        .style('text-align', 'center')
        .style('margin-bottom', '15px')
        .style('color', '#333');

    
    // Add dashboard container
    const dashboardContainer = container.append('div')
        .style('width', '100%')
        .style('background-color', '#f8f9fa')
        .style('border-radius', '8px')
        .style('padding', '20px')
        .style('margin-bottom', '30px')
        .style('box-shadow', '0 4px 8px rgba(0,0,0,0.1)');
    
    // Add instruction 
    dashboardContainer.append('div')
        .style('margin-bottom', '20px')
        .style('text-align', 'center')
        .style('color', '#333')
        .style('line-height', '1.6')
        .html(`
            <p><span style="color: #2a9d8f; font-weight: bold;">Green bars</span> = Good experiences (higher % = more satisfied visitors)</p>
            <p><span style="color: #e63946; font-weight: bold;">Red bars</span> = Bad experiences (lower % = major problem areas)</p>
            <p><span style="font-weight: bold;">Impact levels</span> show trip impact based on sentiment analysis of visitor text feedback</p>
            <p><span style="font-weight: bold;">Advice</span> provides actionable tips for travelers and destinations</p>
        `);
    
    // Create split container for good/bad experience insights
    const insightsContainer = dashboardContainer.append('div')
        .style('display', 'flex')
        .style('flex-direction', 'row')
        .style('flex-wrap', 'wrap')
        .style('justify-content', 'center')
        .style('gap', '20px');
    
    // Load the sentiment analysis data and create the dashboard
    d3.csv('Data/S2_Experience_Sitiment_Analysis.csv').then(function(data) {
        // Split data into good and bad experiences
        const goodExperiences = data.filter(d => d['Experience Type'] === 'Good');
        const badExperiences = data.filter(d => d['Experience Type'] === 'Bad');
        
        // Simple color mapping for impact levels
        const impactColors = {
            'Low Impact': '#2a9d8f',
            'Moderate Impact': '#e9c46a',
            'High Impact': '#f4a261',
            'Critical Impact': '#e76f51'
        };
        
        // Create Good Experience Section
        const goodSection = insightsContainer.append('div')
            .style('flex', '1')
            .style('min-width', '300px')
            .style('max-width', '500px')
            .style('background-color', '#e8f5e9')
            .style('border-radius', '8px')
            .style('padding', '15px');
        
        goodSection.append('h4')
            .text('Good Experience Sharing (Expectations)')
            .style('text-align', 'center')
            .style('margin-bottom', '15px')
            .style('color', '#2a9d8f');
        
        // Create good experience cards
        const goodList = goodSection.append('div').style('margin-top', '10px');
        
        goodExperiences.forEach((exp, i) => {
            const card = goodList.append('div')
                .style('background', 'white')
                .style('border-radius', '5px')
                .style('padding', '12px')
                .style('margin-bottom', '12px');
            
            // Category title
            card.append('h5')
                .html(`${i+1}. ${exp['Experience Category']}`)
                .style('margin', '0 0 8px 0')
                .style('color', '#333');
            
            // Satisfaction with inline bar
            const satBar = card.append('div');
            satBar.append('div')
                .style('display', 'flex')
                .style('justify-content', 'space-between')
                .style('margin-bottom', '3px')
                .html(`<span>Satisfaction</span><span>${exp['Satisfaction Rate']}</span>`);
            
            satBar.append('div')
                .style('width', '100%')
                .style('height', '8px')
                .style('background', '#d8f3dc')
                .append('div')
                .style('width', '0')
                .style('height', '100%')
                .style('background', '#2a9d8f')
                .transition().duration(600)
                .style('width', exp['Satisfaction Rate']);
            
            // Problems with inline bar
            const probBar = card.append('div').style('margin-top', '8px');
            probBar.append('div')
                .style('display', 'flex')
                .style('justify-content', 'space-between')
                .style('margin-bottom', '3px')
                .html(`<span>Problems</span><span>${exp['Problems']}</span>`);
            
            probBar.append('div')
                .style('width', '100%')
                .style('height', '8px')
                .style('background', '#e9ecef')
                .append('div')
                .style('width', '0')
                .style('height', '100%')
                .style('background', '#6c757d')
                .transition().duration(600)
                .style('width', exp['Problems']);
            
            // Impact and advice
            card.append('div')
                .style('margin-top', '8px')
                .html(`<span style="color:${impactColors[exp['Sentiment Impact']]}">
                       <strong>${exp['Sentiment Impact']}</strong></span>`);
            
            card.append('div')
                .style('margin-top', '5px')
                .style('font-size', '13px')
                .html(`<strong>Advice:</strong> ${exp['Advice']}`);
        });
        
        // Create Bad Experience Section
        const badSection = insightsContainer.append('div')
            .style('flex', '1')
            .style('min-width', '300px')
            .style('max-width', '500px')
            .style('background-color', '#fee')
            .style('border-radius', '8px')
            .style('padding', '15px');
        
        badSection.append('h4')
            .text('Bad Experience Sharing (Lessons Learned)')
            .style('text-align', 'center')
            .style('margin-bottom', '15px')
            .style('color', '#e63946');
        
        // Create bad experience cards
        const badList = badSection.append('div').style('margin-top', '10px');
        
        badExperiences.forEach((exp, i) => {
            const card = badList.append('div')
                .style('background', 'white')
                .style('border-radius', '5px')
                .style('padding', '12px')
                .style('margin-bottom', '12px');
            
            // Category title
            card.append('h5')
                .html(`${i+1}. ${exp['Experience Category']}`)
                .style('margin', '0 0 8px 0')
                .style('color', '#333');
            
            // Satisfaction with inline bar
            const satBar = card.append('div');
            satBar.append('div')
                .style('display', 'flex')
                .style('justify-content', 'space-between')
                .style('margin-bottom', '3px')
                .html(`<span>Satisfaction</span><span>${exp['Satisfaction Rate']}</span>`);
            
            satBar.append('div')
                .style('width', '100%')
                .style('height', '8px')
                .style('background', '#f8d7da')
                .append('div')
                .style('width', '0')
                .style('height', '100%')
                .style('background', '#e63946')
                .transition().duration(600)
                .style('width', exp['Satisfaction Rate']);
            
            // Problems with inline bar
            const probBar = card.append('div').style('margin-top', '8px');
            probBar.append('div')
                .style('display', 'flex')
                .style('justify-content', 'space-between')
                .style('margin-bottom', '3px')
                .html(`<span>Problems</span><span>${exp['Problems']}</span>`);
            
            probBar.append('div')
                .style('width', '100%')
                .style('height', '8px')
                .style('background', '#e9ecef')
                .append('div')
                .style('width', '0')
                .style('height', '100%')
                .style('background', '#6c757d')
                .transition().duration(600)
                .style('width', exp['Problems']);
            
            // Impact and advice
            card.append('div')
                .style('margin-top', '8px')
                .html(`<span style="color:${impactColors[exp['Sentiment Impact']]}">
                       <strong>${exp['Sentiment Impact']}</strong></span>`);
            
            card.append('div')
                .style('margin-top', '5px')
                .style('font-size', '13px')
                .html(`<strong>Advice:</strong> ${exp['Advice']}`);
        });
        
    });
    // Add  title
    container.append('h2')
        .text('Explore Visitor Experience Themes (Click to Zoom)')
        .style('text-align', 'center')
        .style('margin-bottom', '15px')
        .style('color', '#333');


    // Create split container for the two visualizations
    const splitContainer = container.append('div')
        .style('display', 'flex')
        .style('flex-direction', 'row')
        .style('width', '100%')
        .style('justify-content', 'center')
        .style('gap', '20px')
        .style('margin-bottom', '30px');


    
    // Container for good experiences
    const goodContainer = splitContainer.append('div')
        .style('flex', '1')
        .style('max-width', '500px')
        .style('background-color', '#e8f5e9') // Light green background
        .style('border-radius', '8px')
        .style('padding', '20px')
        .style('box-shadow', '0 4px 8px rgba(0,0,0,0.1)')
        .style('display', 'flex')
        .style('flex-direction', 'column');
    
    // Add title for good experiences
    goodContainer.append('h3')
        .text('Good Experiences')
        .style('text-align', 'center')
        .style('color', '#2a9d8f')
        .style('margin-bottom', '10px')
        .style('font-size', '22px');
    
    // Container for legend for good experiences
    const goodLegend = goodContainer.append('div')
        .attr('id', 'good-legend')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('justify-content', 'center')
        .style('gap', '10px')
        .style('margin-bottom', '15px');
    
    // Container for good experiences visualization
    const goodViz = goodContainer.append('div')
        .attr('id', 'good-experiences-viz')
        .style('width', '100%')
        .style('height', '450px');
    
    // Container for bad experiences
    const badContainer = splitContainer.append('div')
        .style('flex', '1')
        .style('max-width', '500px')
        .style('background-color', '#fee')  
        .style('border-radius', '8px')
        .style('padding', '20px')
        .style('box-shadow', '0 4px 8px rgba(0,0,0,0.1)')
        .style('display', 'flex')
        .style('flex-direction', 'column');
    
    // Add title for bad experiences
    badContainer.append('h3')
        .text('Bad Experiences')
        .style('text-align', 'center')
        .style('color', '#e63946')
        .style('margin-bottom', '10px')
        .style('font-size', '22px');
    
    // Container for legend for bad experiences
    const badLegend = badContainer.append('div')
        .attr('id', 'bad-legend')
        .style('display', 'flex')
        .style('flex-wrap', 'wrap')
        .style('justify-content', 'center')
        .style('gap', '10px')
        .style('margin-bottom', '15px');
    
    // Container for bad experiences visualization
    const badViz = badContainer.append('div')
        .attr('id', 'bad-experiences-viz')
        .style('width', '100%')
        .style('height', '450px');
    
    // Set dimensions for each visualization
    const width = 450;
    const height = 450;
    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    
    // Function to create circle packing visualization
    function createVisualization(data, containerId, experienceType, categoryColors) {
        // Create SVG
        const svg = d3.select(`#${containerId}`)
            .append('svg')
            .attr('width', width)
            .attr('height', height)
            .attr('viewBox', [-width / 2, -height / 2, width, height])
            .attr('style', 'max-width: 100%; height: auto; display: block; margin: 0 auto;');
        
        // Create hierarchy and pack layout
        const root = d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);
        
        // Apply pack layout
        const pack = d3.pack()
            .size([width - margin.left - margin.right, height - margin.top - margin.bottom])
            .padding(3);
        
        const packedData = pack(root);
        
        // Helper function to determine color
        const getColor = (d) => {
            // Experience type differs the background color
            const isGood = experienceType === 'Good Experiences';
            
            // Root level
            if (d.depth === 0) return isGood ? '#e8f5e9' : '#fee';
            
            // Category level 
            if (d.depth === 1) {
                return categoryColors[d.data.name];
            }
            
            // Word level 
            if (d.depth === 2) {
                return d3.color(getColor(d.parent)).brighter(0.5);
            }
            
            return '#ccc'; 
        };
        
        // Create the circles for nodes
        const node = svg.append("g")
            .selectAll("circle")
            .data(packedData.descendants().slice(1))
            .join("circle")
            .attr("fill", d => d.children ? getColor(d) : "white")
            .attr("stroke", d => d.depth === 1 ? "#000" : null)
            .attr("stroke-width", d => d.depth === 1 ? 2 : 0)
            .attr("pointer-events", d => !d.children ? "none" : null)
            .attr("opacity", d => d.depth === 0 ? 0 : 0.8)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke", "#000");
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke", d => d.depth === 1 ? "#000" : null);
            })
            .on("click", (event, d) => focus !== d && (zoom(event, d), event.stopPropagation()));
        
        // Add text labels
        const label = svg.append("g")
            .style("font", "10px sans-serif")
            .attr("pointer-events", "none")
            .attr("text-anchor", "middle")
            .selectAll("text")
            .data(packedData.descendants().slice(1))
            .join("text")
            .style("fill-opacity", d => d.depth === 1 ? 1 : 0)
            .style("display", d => d.depth === 1 ? "inline" : "none")
            .attr("font-size", d => d.depth === 1 ? "14px" : "10px")
            .attr("font-weight", "bold")
            .attr("fill", d => d.depth === 1 ? "#11267d" : "#000")
            .text(d => d.data.name);
        
        // Setup zoom function
        svg.on("click", (event) => zoom(event, packedData));
        let focus = packedData;
        let view;
        zoomTo([focus.x, focus.y, focus.r * 2]);
        
        function zoomTo(v) {
            const k = width / v[2];
            
            view = v;
            
            label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            node.attr("r", d => d.r * k);
        }
        // Zoom function and transition setup
        function zoom(event, d) {
            const focus0 = focus;
            focus = d;
            
            const transition = svg.transition()
                .duration(event.altKey ? 7500 : 750)
                .tween("zoom", d => {
                    const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                    return t => zoomTo(i(t));
                });
            
            // Adjust label when zooming
            label
                .filter(function(d) {
                    return d.parent === focus || this.style.display === "inline";
                })
                .transition(transition)
                .style("fill-opacity", d => d.parent === focus ? 1 : 0)
                .on("start", function(d) { if (d.parent === focus) this.style.display = "inline"; })
                .on("end", function(d) { if (d.parent !== focus) this.style.display = "none"; });
        }
    }
    
    // Load datasets
    Promise.all([
        d3.csv('Data/S2_Good_Experiences_Term.csv'),
        d3.csv('Data/S2_Bad_Experiences_Word.csv')
    ]).then(function(datasets) {
        const goodExperiences = datasets[0];
        const badExperiences = datasets[1];
        
        // Find experience categories 
        const allCategories = Array.from(new Set([
            ...goodExperiences.map(d => d['Experience Category']),
            ...badExperiences.map(d => d['Experience Category'])
        ]));
        
        // Color mapping for categories
        const categoryColors = {
            'Nature Activities': '#2e83d1',  // Blue
            'Local Attractions': '#731ae5',  // Purpol
            'Amenities': '#f67409',          // Orange
            'Safety': '#f10e6a',             // Coral
        };
        
        // Default set for color pallete
        const defaultColors = d3.schemeTableau10;
        let colorIndex = 0;
        allCategories.forEach(category => {
            if (!categoryColors[category]) {
                categoryColors[category] = defaultColors[colorIndex % defaultColors.length];
                colorIndex++;
            }
        });
        
        // Setup legend for good experiences
        const goodCategories = Array.from(new Set(goodExperiences.map(d => d['Experience Category'])));
        goodCategories.forEach(category => {
            const legendItem = goodLegend.append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('margin-right', '10px');
            
            legendItem.append('div')
                .style('width', '15px')
                .style('height', '15px')
                .style('background-color', categoryColors[category])
                .style('border-radius', '50%')
                .style('margin-right', '5px');
            
            legendItem.append('span')
                .text(category)
                .style('font-size', '12px')
                .style('color', '#333');
        });
        
        // legend  for bad experiences
        const badCategories = Array.from(new Set(badExperiences.map(d => d['Experience Category'])));
        badCategories.forEach(category => {
            const legendItem = badLegend.append('div')
                .style('display', 'flex')
                .style('align-items', 'center')
                .style('margin-right', '10px');
            
            legendItem.append('div')
                .style('width', '15px')
                .style('height', '15px')
                .style('background-color', categoryColors[category])
                .style('border-radius', '50%')
                .style('margin-right', '5px');
            
            legendItem.append('span')
                .text(category)
                .style('font-size', '12px')
                .style('color', '#333');
        });
        
        // Group data into ciecle
        const processData = (data) => {
            // Group by category
            const nestedData = d3.group(data, d => d['Experience Category']);
            
            // setup hierarchical structure
            return {
                name: "Experiences",
                children: Array.from(nestedData, ([category, words]) => ({
                    name: category,
                    children: words.map(word => ({
                        name: word.Word,
                        value: +word['Word Frequency'],
                        category: category
                    }))
                }))
            };
        };
        
        // Create hierarchical data
        const goodData = processData(goodExperiences);
        const badData = processData(badExperiences);
        
        // Connect color scheme
        createVisualization(goodData, 'good-experiences-viz', 'Good Experiences', categoryColors);
        createVisualization(badData, 'bad-experiences-viz', 'Bad Experiences', categoryColors);
        
    });
});
