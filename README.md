# 🚌 UniGo - Islamabad Metro Route Finder

A smart metro route planning application for Islamabad-Rawalpindi that uses **natural language processing** and **A* pathfinding** to find optimal routes.

![UniGo](images/location.png)

## ✨ Features

- **Natural Language Input** - Just type "NUST to PIMS" or "cheap route from Faizabad to F-9 Park"
- **Smart Route Planning** - A* algorithm finds optimal paths based on time or budget
- **Multiple Strategies**:
  - ⚡ **Fastest** - Minimize travel time
  - 💰 **Cheapest** - Minimize transfers (saves money)
- **Avoid Stations** - Say "avoid Police Foundation" to route around closures
- **Interactive Map** - Leaflet-powered map showing your route
- **Bus Route Cards** - See exactly which buses to take with images

## 🚀 Quick Start

1. Open `index.html` in your browser
2. Type your route request in natural language:
   - "NUST to PIMS"
   - "Fast route from Faizabad to F-9 Park"
   - "Cheap route from NUST to PIMS avoid Police Foundation"
3. View your route on the interactive map with bus cards

## 📁 Project Structure

```
MetroProject/
├── index.html              # Chatbot interface (main entry)
├── route.html              # Route display with map & bus cards
├── css/
│   ├── index.css           # Chatbot styles
│   └── route.css           # Route page styles
├── src/js/
│   ├── core/
│   │   └── astar.js        # A* pathfinding algorithm
│   ├── nlp/
│   │   └── intentParser.js # Natural language processing
│   └── utils/
│       ├── distance.js     # Haversine distance calculation
│       └── priorityQueue.js # Priority queue for A*
├── data/
│   └── reliable_metro_graph.json  # Metro network graph
├── images/
│   ├── orange-line.png     # Orange Line bus
│   ├── red-line.jpg        # Red Line bus
│   ├── green-line.jpeg     # Green Line bus
│   └── green-feeders/      # Feeder route buses (FR-01 to FR-13)
└── tests/
    └── test_astar.js       # Unit tests
```

## 🧠 How It Works

### 1. Natural Language Processing (`intentParser.js`)

Extracts route information from plain English:
- **Source/Destination** - "NUST to PIMS" → `{source: "nust", destination: "pims"}`
- **Strategy Detection** - "fast" → time, "cheap" → budget
- **Constraints** - "avoid X" → avoids station X
- **Fuzzy Matching** - Handles typos and abbreviations

### 2. A* Pathfinding (`astar.js`)

- **O(1) Edge Lookup** - Uses Map for fast edge data retrieval
- **Closed Set** - Prevents revisiting nodes
- **Strategy-based Costs**:
  - Time: Minimizes travel duration
  - Budget: Heavily penalizes transfers (100 cost penalty)

### 3. Route Visualization (`route.html`)

- **Leaflet Map** - Shows polyline with start/end markers
- **Bus Cards** - Animated cards showing which buses to take
- **Route Segments** - Parses path into bus route segments

## 🚇 Supported Routes

| Route | Type | Image |
|-------|------|-------|
| Orange Line | Main | `orange-line.png` |
| Red Line | Main | `red-line.jpg` |
| Green Line | Main | `green-line.jpeg` |
| FR-01 to FR-13 | Feeders | `green-feeders/fr-XX.png` |

## 🧪 Testing

```bash
# Run tests (requires Node.js)
node tests/test_astar.js
```

Expected output:
```
🚀 Initializing Advanced Systems...
✅ Strategy: budget (Should be 'budget')
✅ Cost: 2 (Should be low if no transfers involved)
✅ SUCCESS: Path avoided the blocked station!
```

## 📝 Example Queries

| Query | Result |
|-------|--------|
| `NUST to PIMS` | Default time-optimized route |
| `Fast route from Faizabad to F-9 Park` | Fastest route |
| `Cheap route from NUST to PIMS` | Fewest transfers |
| `NUST to PIMS avoid Police Foundation` | Route avoiding that station |

## 🛠️ Technologies

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **Map**: Leaflet.js with OpenStreetMap tiles
- **Algorithm**: A* Pathfinding with Haversine distance heuristic
- **NLP**: Custom intent parser with fuzzy matching

## 📊 Data

The metro network is stored in `data/reliable_metro_graph.json`:
- **229 stations** across Islamabad-Rawalpindi
- **15 routes** (Orange, Red, Green Lines + Feeders)
- **700+ edges** with time and distance data

## 👨‍💻 Author

**M. Ehsaan ur Rehman Qazi**

## 📄 License

This project is for educational purposes.
