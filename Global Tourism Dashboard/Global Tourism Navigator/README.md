# Tourism Data Visualization Project

This project provides an interactive dashboard exploring global tourism trendings, tourism preferences, and visitor experiences.

## Overview

The dashboard includes multiple visualizations powered by advanced data science techniques:

- **World Map**: Explore tourism volumes and heritage sites by country with interactive geospatial visualization
- **Bar Chart Race**: View how tourism rankings change over time with dynamic temporal data animation
- **Tourism Network Graph**: Visualize relationships between countries based on tourism/heritage site ratios using graph theory and force-directed algorithms
- **Experience Analysis**: Explore visitor feedback through NLP, sentiment analysis, and topic modeling techniques
  - Implemented text processing pipeline for visitor survey data
  - Applied sentiment analysis to categorize feedback into impact levels (Low, Moderate, High, Critical)
  - Used topic modeling to extract key themes from textual data
  - Visualized results with interactive circle packing diagrams
- **Radial Chart**: Compare tourism data by region with hierarchical visualization techniques
  - Applied K-means clustering with PCA to identify distinct Australian tourism destination types
  - Visualized clusters in a 2D space where PC1 (60.2% variance) represents tourism volume and economic impact
  - PC2 (22.7% variance) represents growth potential and market positioning
  - Used point size to represent average spend per visitor for each region
  - Color-coded to differentiate between cluster groups (Major Urban Destinations vs. Diverse Regional Destinations)
- **Sunburst Chart**: Analyze tourism expenditure patterns with multi-level categorical data visualization


## Instructions for Running the Project

### Using Visual Studio Code Live Server

1. Open Visual Studio Code, go-live
   


## Project Structure

```
/
├── index.html              # Main entry point
├── Data/                   # CSV and JSON data files
│   ├── Country_Summary_S1.csv     
│   ├── Tourism_Decade.csv        
│   ├── cluster_regaion.csv       
│   ├── S2_Experience_Sitiment_Analysis.csv  
│   ├── S2_Good_Experiences_Term.csv         
│   ├── S2_Bad_Experiences_Word.csv         
│   └── S3_Expendature.json                  
├── NetworkGraph.js         # Network visualization code
├── World_Map.js            # World map visualization code
├── CountryRace.js          # Bar chart race visualization
├── RadialChart.js          # Radial chart visualization
├── SunburstChart.js        # Sunburst chart visualization
├── ExperienceCircle.js     # Circle packing visualization
└── index.css               # Styling for the dashboard
```


### External Data Sources

In addition to the local data files, one external data is loaded:

- World_Map.js loads country boundary data from: `https://unpkg.com/world-atlas@2.0.2/countries-110m.json`

## Data Science Techniques

This project demonstrates several advanced data science and visualization techniques:

### Natural Language Processing (NLP)
- **Text Processing**: Cleaned and preprocessed visitor feedback survey data
- **Sentiment Analysis**: Analyzed the emotional tone of visitor comments to determine satisfaction levels
- **Topic Modeling**: Extracted key themes from textual data to identify common experience categories
- **Impact Classification**: Developed a custom algorithm to categorize sentiment scores into four impact levels (Low, Moderate, High, Critical) for improved interpretability

### Data Visualization
- **Interactive Visualization**: Implemented responsive D3.js visualizations with hover effects and tooltips
- **Hierarchical Data Structures**: Used partition layouts for multi-level categorical data in the sunburst chart
- **Force-Directed Graphs**: Applied physics-based algorithms to create network visualizations
- **Temporal Animation**: Created animated transitions for time-series data in the bar chart race
- **Geospatial Visualization**: Mapped tourism data to geographic coordinates with color encoding

### Data Processing & Machine Learning
- **Data Integration**: Combined multiple datasets with different structures and formats
- **Statistical Analysis**: Calculated correlations and relationships between tourism volumes and heritage sites
- **Data Transformation**: Converted raw data into hierarchical structures for visualization
- **Dimensionality Reduction**: Applied Principal Component Analysis (PCA) to reduce tourism metrics to two key dimensions:
  - PC1 (60.2% variance): Tourism volume and economic impact
  - PC2 (22.7% variance): Growth potential and market positioning
- **Clustering Analysis**: Implemented K-means clustering to identify distinct tourism destination types:
  - Major Urban Destinations: High-value, high-volume tourism centers with premium spending per visitor
  - Diverse Regional Destinations: Medium-sized tourism destinations with stable visitor patterns
- **Feature Importance Analysis**: Created visualization to determine which factors most define tourism clusters:
  - Visitor Growth Rate (30%)
  - Average Tourism Spending (29%)
  - Average Visitor Volume (25%)
  - Average Spend per Visitor (16%)
- **Feature Engineering**: Derived new metrics from raw data to enhance analysis:
  - Tourism density (visitors per capita)
  - Visitor growth rate year-over-year
  - Spending efficiency (revenue per visitor)
  - Heritage site utilization (visitors per heritage site)


