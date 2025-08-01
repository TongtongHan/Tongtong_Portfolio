# Tourism Data Visualization Project

This project provides an interactive dashboard exploring global tourism trendings, tourism preferences, and visitor experiences.

## Overview

The dashboard includes multiple visualizations:

- **World Map**: Explore tourism volumes and heritage sites by country
- **Bar Chart Race**: View how tourism rankings change over time
- **Tourism Network Graph**: Visualize relationships between countries based on tourism/heritage site ratios
- **Experience Analysis**: Explore visitor feedback through sentiment analysis and circle packing
- **Radial Chart**: Compare tourism data by region for different years
- **Sunburst Chart**: Analyze tourism expenditure patterns


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





