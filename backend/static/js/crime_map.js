document.addEventListener('DOMContentLoaded', function () {
    // Check if map container exists
    const mapElement = document.getElementById('crimeMap');
    if (!mapElement) return;

    // Center map on Kolkata
    const kolkataCoords = [22.5726, 88.3639];

    // Initialize map
    const map = L.map('crimeMap', {
        minZoom: 11,
        maxBounds: [
            [22.4000, 88.2500],
            [22.7500, 88.5000]
        ]
    }).setView(kolkataCoords, 12);

    // Add Tile Layers
    const streetsLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const satelliteLayer = L.tileLayer('https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}', {
        attribution: 'Google Satellite'
    });

    const baseMaps = {
        "Streets View": streetsLayer,
        "Satellite View": satelliteLayer
    };

    const overlayMaps = {};
    const layerControl = L.control.layers(baseMaps, overlayMaps, { collapsed: false }).addTo(map);

    // Fetch data from analytical map JSON endpoint
    fetch(window.location.pathname.replace('/analytics', '/analytics/map') + window.location.search)
        .then(response => {
            if (!response.ok) {
                throw new Error("Failed to load map data.");
            }
            return response.json();
        })
        .then(data => {
            // 1. Heatmap Layer
            const heatData = data.map(row => [row.Latitude, row.Longitude, row.Crime_Count]);
            const heatLayer = L.heatLayer(heatData, {
                radius: 15,
                blur: 20,
                maxZoom: 1
            });
            heatLayer.addTo(map);
            layerControl.addOverlay(heatLayer, "Crime Heatmap");

            // 2. Marker Clusters for Risk Levels
            const mcRed = L.markerClusterGroup();
            const mcOrange = L.markerClusterGroup();
            const mcYellow = L.markerClusterGroup();

            const iconColors = {
                'Yellow': 'orange',
                'Orange': 'darkred',
                'Red': 'darkred'
            };

            data.forEach(row => {
                if (row.Risk_Category === 'Green') return; // Skip green zones for marker performance

                const cat = row.Risk_Category;
                const timeSlot = row.TimeSlot;
                const predictedType = row.Predicted_Crime_Type || 'Unknown';
                const confidence = row.Prediction_Confidence || 0.0;

                const popupHtml = `
                <div style="width:220px; font-family: Arial, sans-serif;">
                    <h4 style="margin-top:0; margin-bottom:5px; color:#333;">Ward ${Math.floor(row.Ward)} Area</h4>
                    <b>Risk Score:</b> <strong>${row.Risk_Index.toFixed(1)}/100</strong><br>
                    <b>Category:</b> <span style="color:${cat.toLowerCase()}; font-weight:bold;">${cat}</span><br>
                    <hr style="margin:5px 0;">
                    <b style="color:#e74c3c;">Predicted Crime:</b> ${predictedType}<br>
                    <b>Confidence:</b> ${confidence.toFixed(1)}%<br>
                    <b>Peak Risk Time:</b> ${timeSlot}<br>
                    <b>Expected Volume:</b> ${row.Predicted_Volume.toFixed(1)} incidents<br>
                </div>
                `;

                const color = iconColors[cat] || 'blue';

                const marker = L.circleMarker([row.Latitude, row.Longitude], {
                    radius: 10,
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.4
                }).bindPopup(popupHtml);

                // Add to appropriate cluster
                if (cat === 'Red') mcRed.addLayer(marker);
                else if (cat === 'Orange') mcOrange.addLayer(marker);
                else if (cat === 'Yellow') mcYellow.addLayer(marker);
            });

            // Add clusters to map
            map.addLayer(mcRed);
            map.addLayer(mcOrange);

            // Add layers to control (so user can toggle them)
            layerControl.addOverlay(mcRed, "Critical Risk (Red)");
            layerControl.addOverlay(mcOrange, "High Risk (Orange)");
            layerControl.addOverlay(mcYellow, "Moderate Risk (Yellow)");
        })
        .catch(error => {
            console.error("Error loading crime risk data:", error);
            const errorDiv = document.createElement('div');
            errorDiv.style.position = 'absolute';
            errorDiv.style.top = '10px';
            errorDiv.style.left = '50px';
            errorDiv.style.backgroundColor = 'white';
            errorDiv.style.padding = '10px';
            errorDiv.style.border = '1px solid red';
            errorDiv.style.zIndex = 9999;
            errorDiv.innerText = "Error loading crime data. Please try again later.";
            mapElement.appendChild(errorDiv);
        });

    // Setup Custom Legend Control
    const legend = L.control({ position: 'bottomleft' });

    legend.onAdd = function (map) {
        const div = L.DomUtil.create('div', 'info legend');
        div.style.backgroundColor = 'white';
        div.style.padding = '10px';
        div.style.border = '2px solid grey';
        div.style.opacity = '0.9';
        div.style.fontSize = '14px';
        div.style.lineHeight = '18px';

        div.innerHTML = `
            <b>Risk Levels</b><br>
            <i style="background:green; width:10px; height:10px; display:inline-block; margin-right:5px;"></i> Low Risk<br>
            <i style="background:orange; width:10px; height:10px; display:inline-block; margin-right:5px;"></i> Moderate Risk<br>
            <i style="background:darkred; width:10px; height:10px; display:inline-block; margin-right:5px; opacity:0.8;"></i> High Risk<br>
            <i style="background:darkred; width:10px; height:10px; display:inline-block; margin-right:5px;"></i> Critical Risk<br>
        `;
        return div;
    };
    legend.addTo(map);
});
