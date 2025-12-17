document.addEventListener('DOMContentLoaded', () => {

    // --- LOGIC FOR HOME PAGE (index.html) ---
    const searchBtn = document.getElementById('search'); // The green button
    
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            const startSelect = document.getElementById('departure-dropdown');
            const endSelect = document.getElementById('destination-dropdown');
            
            const startVal = startSelect.value;
            const endVal = endSelect.value;
            
            // Get the readable text (e.g., "NUST H-12") to show on the next page
            const startText = startSelect.options[startSelect.selectedIndex].text;
            const endText = endSelect.options[endSelect.selectedIndex].text;

            if (startVal && endVal && startVal !== endVal) {
                // 1. Save the trip details to LocalStorage
                const tripData = {
                    start: startVal,
                    end: endVal,
                    startName: startText,
                    endName: endText
                };
                localStorage.setItem('unigo_trip', JSON.stringify(tripData));

                // 2. Go to the route page
                window.location.href = 'route.html';
            } else {
                alert("Please select two different locations.");
            }
        });
    }

    // --- LOGIC FOR ROUTE PAGE (route.html) ---
    const routeTitle = document.getElementById('route-title'); // The header on sidebar
    
    if (routeTitle) {
        // 1. Retrieve the data we saved on the Home Page
        const tripData = JSON.parse(localStorage.getItem('unigo_trip'));

        if (tripData) {
            // Update the sidebar text
            routeTitle.innerText = `${tripData.startName} to ${tripData.endName}`;
            
            // Update the "You:" chat message
            const userQuery = document.querySelector('.user-query');
            if(userQuery) userQuery.innerText = `You: ${tripData.startName} to ${tripData.endName}`;

            // 2. Trigger the Pathfinder (This relies on pathfinder.js being loaded)
            if (typeof UniGoPathfinder !== 'undefined' && typeof routes !== 'undefined') {
                // We need to wait for routes.json to load. 
                // In a real app, we'd use a Promise/Callback here.
                // For now, we'll assume dataLoader loads it into 'routes' global variable.
                
                // Example call (you will connect this to your actual pathfinder logic)
                // const path = UniGoPathfinder.findShortestPath(routes, tripData.start, tripData.end);
                // renderRoute(path);
            }
        } else {
            // If no data found (user came directly to route.html), send them back
            window.location.href = 'index.html';
        }
    }
});