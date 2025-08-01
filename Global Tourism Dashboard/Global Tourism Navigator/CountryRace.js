// Tourism Race Animation Graph
document.addEventListener('DOMContentLoaded', function() {
	// setup chart dimensions and animation
	const width = 800;
	const height = 500;
	const marginTop = 30;
	const marginRight = 50;
	const marginBottom = 10;
	const marginLeft = 120;
	const barSize = 25;
	const n = 15; // Show top 15 countries in the race
	const k = 1; // 1 frame per year
	const duration = 1000; // 1 second transition for race
	
	// Years information displayed
	const years = [1990, 2000, 2010, 2020];
	
	// Get the bar chart race element
	const container = document.getElementById('bar-chart-race');
	
	// Create play button
	const playButton = document.getElementById('play-button');
	
	// Set up play button position and animation
	playButton.style.cursor = 'pointer';
	playButton.style.position = 'relative';
	playButton.style.zIndex = '100';
	
	// format numbers and dates
	const formatNumber = d3.format(",d");
	const formatDate = d => d;
	
	// Load tourism data 
	d3.csv("Data/Tourism_Decade.csv").then(function(csvData) {
		// Process the CSV data
		const processedData = csvData.map(d => ({
			date: d.decade.toString(),
			name: d.Country,
			value: +d.Tourism_Volume,
			category: d.region
		})); // Process columns
		
		// Calculate cumulative values for each country by decade
		// First, organize data by country and decade
		const countryDecadeMap = new Map();
		
		// Group all country-decade 
		processedData.forEach(d => {
			if (!countryDecadeMap.has(d.name)) {
				countryDecadeMap.set(d.name, new Map());
			} // Set up country-decade 
			countryDecadeMap.get(d.name).set(d.date, d.value);
		});
		
		// Create cumulative volume 
		const cumulativeData = [];
		const decadeOrder = ["1990", "2000", "2010", "2020"];
		
		// For each country
		countryDecadeMap.forEach((decadeMap, country) => {
			let runningTotal = 0;
			
			// For each decade 
			decadeOrder.forEach(decade => {
				if (decadeMap.has(decade)) {
					runningTotal += decadeMap.get(decade);
					cumulativeData.push({
						date: decade,
						name: country,
						value: runningTotal,
						category: processedData.find(d => d.name === country)?.category || "Unknown"
					}); // add cumulative tourism volume to the array
				}
			});
		});
		
		// Get country names
		const names = new Set(cumulativeData.map(d => d.name)); // Get unique country names
		
		// Reformat data
		const datevalues = Array.from(d3.rollup(cumulativeData, ([d]) => d.value, d => d.date, d => d.name))
			.map(([date, data]) => [date, data]) // Map the data
			.sort(([a], [b]) => d3.ascending(a, b)); // Sort the data
		
		// rank and rant countries for each keyframe
		function rank(value) {
			const data = Array.from(names, name => ({name, value: value(name) || 0})); // Create data array
			data.sort((a, b) => d3.descending(a.value, b.value)); // Sort the data
			for (let i = 0; i < data.length; ++i) data[i].rank = Math.min(n, i); // Rank the data
			return data.slice(0, n); // Return the ranked countries
		}
		
		// create keyframes for the animation
		const keyframes = (() => {
			const frames = [];
			let ka, a, kb, b;
			for (let i = 0; i < datevalues.length - 1; ++i) {
				[ka, a] = datevalues[i];
				[kb, b] = datevalues[i + 1];
				for (let j = 0; j < k; ++j) {
					const t = j / k;
					frames.push([
						ka * (1 - t) + kb * t,
						rank(name => (a.get(name) || 0) * (1 - t) + (b.get(name) || 0) * t)
					]);
				}
			}
			frames.push([kb, rank(name => b.get(name) || 0)]); 
			return frames;
		})(); 
		
		// Use schemeSet3 color palette for more vibrant, diverse colors
		const color = (() => {
			// Create a color scale using schemeSet3
			const colorScale = d3.scaleOrdinal(d3.schemeSet3)
				.domain(d3.range(n)); // Set domain based on number of countries
			
			return d => {
				// Use rank to assign colors, ensuring consistent colors per rank position
				return colorScale(d.rank);
			};
		})();
		
		// Move to next frame
		const nameframes = d3.groups(keyframes.flatMap(([, data]) => data), d => d.name);
		const prev = new Map(nameframes.flatMap(([, data]) => d3.pairs(data, (a, b) => [b, a])));
		const next = new Map(nameframes.flatMap(([, data]) => d3.pairs(data)));
		
		// Define scales for the animation
		const x = d3.scaleLinear([0, 1], [marginLeft, width - marginRight]);
		const y = d3.scaleBand()
			.domain(d3.range(n + 1))
			.rangeRound([marginTop, marginTop + barSize * (n + 1 + 0.1)])
			.padding(0.1);
		
		//  SVG
		const svg = d3.select('#bar-chart-race')
			.append('svg')
			.attr("viewBox", [0, 0, width, height])
			.attr("width", width)
			.attr("height", height)
			.attr("style", "max-width: 100%; height: auto;");
		
		// Update bars
		function bars(svg) {
			let bar = svg.append("g")
				.attr("fill-opacity", 0.85) // Slightly reduced opacity for better color visibility
				.selectAll("rect"); // Select all bars
			
			return ([date, data], transition) => bar = bar // Select all bars
				.data(data, d => d.name)
				.join(
					enter => enter.append("rect")
						.attr("fill", color)
						.attr("height", y.bandwidth())
						.attr("x", x(0))
						.attr("y", d => y((prev.get(d) || d).rank))
						.attr("width", d => x((prev.get(d) || d).value) - x(0)),
					update => update, // Update bars
					exit => exit.transition(transition).remove()
						.attr("y", d => y((next.get(d) || d).rank))
						.attr("width", d => x((next.get(d) || d).value) - x(0))
				)
				.call(bar => bar.transition(transition)
					.attr("y", d => y(d.rank))
					.attr("width", d => x(d.value) - x(0))); // Update bars
		}
		
		// set labels style
		function labels(svg) {
			let label = svg.append("g")
				.attr("font-family", "sans-serif")
				.attr("font-size", 11)
				.attr("font-weight", "bold") 
				.attr("text-anchor", "start")
				.selectAll("text");
			
			// Update labels 
			return ([date, data], transition) => label = label
				.data(data, d => d.name)
				.join(
					enter => enter.append("text")
						.attr("transform", d => `translate(${x(0)},${y((prev.get(d) || d).rank)})`)
						.attr("y", y.bandwidth() / 2)
						.attr("x", -6)
						.attr("dy", "0.35em")
						.attr("text-anchor", "end")
						.text(d => d.name),
					update => update,
					exit => exit.transition(transition).remove()
						.attr("transform", d => `translate(${x(0)},${y((next.get(d) || d).rank)})`)
				)
				.call(label => label.transition(transition)
					.attr("transform", d => `translate(${x(0)},${y(d.rank)})`));
		}
		
		// Update value labels
		function valueLabels(svg) {
			let label = svg.append("g")
				.attr("font-family", "sans-serif")
				.attr("font-size", 11)
				.attr("text-anchor", "start")
				.selectAll("text");
			
			function textTween(a, b) {
				const i = d3.interpolateNumber(a, b);
				return function(t) {
					this.textContent = formatNumber(i(t));
				};
			}
			
			return ([date, data], transition) => label = label
				.data(data, d => d.name)
				.join(
					enter => enter.append("text")
						.attr("transform", d => `translate(${x((prev.get(d) || d).value)},${y((prev.get(d) || d).rank)})`)
						.attr("y", y.bandwidth() / 2)
						.attr("x", 5)
						.attr("dy", "0.35em")
						.text(d => formatNumber(d.value)),
					update => update,
					exit => exit.transition(transition).remove()
						.attr("transform", d => `translate(${x((next.get(d) || d).value)},${y((next.get(d) || d).rank)})`)
				)
				.call(label => label.transition(transition)
					.attr("transform", d => `translate(${x(d.value)},${y(d.rank)})`)
					.tween("text", d => textTween((prev.get(d) || d).value, d.value)));
		}
		
		// Update year label
		function ticker(svg) {
			// Create a group for the year label position 
			const yearLabel = svg.append("g")
				.attr("class", "year-label");
			
			// add year text
			const now = yearLabel.append("text")
				.attr("class", "year")
				.attr("font-family", "sans-serif")
				.attr("font-size", 80)
				.attr("font-weight", "bold")
				.attr("fill", "#000") 
				.attr("opacity", 1)
				.attr("text-anchor", "start")
				.text(keyframes[0][0]);
			
			return ([date, data], transition) => {
				// Position the year label to the right side of chart
				const xPos = width - 200; // Fixed position 
				const yPos = height - 100; // Lower position 
				
				// Update the year text position and value
				yearLabel.transition(transition)
					.attr("transform", `translate(${xPos}, ${yPos})`);
				
				transition.end().then(() => now.text(date));
			};
		}
		
		// Update axis
		function axis(svg) {
			const g = svg.append("g")
				.attr("transform", `translate(0,${marginTop})`);
			
			const axis = d3.axisTop(x)
				.ticks(width / 160)
				.tickFormat(d => d3.format(",d")(d))
				.tickSizeOuter(0)
				.tickSizeInner(-barSize * (n + y.padding())); // Set up axis
			
			return (_, transition) => {
				g.transition(transition).call(axis);
				g.select(".tick:first-of-type text").remove();
				g.selectAll(".tick:not(:first-of-type) line").attr("stroke", "#ddd");
				g.select(".domain").remove(); // Remove axis
			};
		}
		
		// Combine all components
		const updateBars = bars(svg);
		const updateAxis = axis(svg);
		const updateLabels = labels(svg);
		const updateValueLabels = valueLabels(svg);
		const updateTicker = ticker(svg);
		
		// Initialize animation
		let frame = 0;
		let timer;
		let animating = false;
		
		// Initial render
		const keyframe = keyframes[0];
		x.domain([0, keyframe[1][0].value * 1.1]);
		
		updateAxis(keyframe, d3.transition().duration(0)); // Update axis
		updateBars(keyframe, d3.transition().duration(0)); // Update bars
		updateLabels(keyframe, d3.transition().duration(0)); // Update labels
		updateValueLabels(keyframe, d3.transition().duration(0)); // Update value labels
		updateTicker(keyframe, d3.transition().duration(0)); // Update year label
		
		// Call Animation 
		async function animate() {
			if (frame >= keyframes.length) {
				frame = 0;
				animating = false;
				playButton.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z" fill="#2E7D32"/></svg> Play Animation';
				return;
			} 
			
			const transition = d3.transition() // transition
				.duration(duration) // duration
				.ease(d3.easeLinear); // ease
			
			// current keyframe
			const keyframe = keyframes[frame];
			
			// Update keyframe
			x.domain([0, keyframe[1][0].value * 1.1]);
			
			// Update all elements
			updateAxis(keyframe, transition); // Update axis
			updateBars(keyframe, transition); // Update bars
			updateLabels(keyframe, transition); // Update labels
			updateValueLabels(keyframe, transition);
			updateTicker(keyframe, transition);
			
			// End transition
			await transition.end();
			
			// Move to next frame if still animating
			if (animating) {
				frame++;
				timer = setTimeout(animate, 100);
			}
		}
		
		// Set up play button animation
		playButton.addEventListener("click", function() {
			if (animating) {
				// Stop animation
				animating = false;
				clearTimeout(timer);
				this.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M8 5V19L19 12L8 5Z" fill="#2E7D32"/></svg> Play Animation';
			} else {
				// Start animation
				animating = true;
				this.innerHTML = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" fill="#2E7D32"/></svg> Pause Animation';
				frame = 0; // Start from beginning
				animate();
			}
		});
		
		// Handle window resize to avoid animation lag
		function debounce(func, wait) {
			let timeout;
			return function() {
				const context = this;
				const args = arguments;
				clearTimeout(timeout);
				timeout = setTimeout(() => func.apply(context, args), wait);
			};
		}

		window.addEventListener('resize', debounce(function() {
			// Clear animation
			animating = false;
			clearTimeout(timer);
			
			// Remove SVG and recreate it
			d3.select('#bar-chart-race svg').remove(); // Remove SVG
			
			window.location.reload(); // Reload 
		}, 250)); 
	});
});