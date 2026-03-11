// Temporal Tumor Controls Injector
// Add this script to your existing index.html to enable temporal tumor switching

(function() {
    console.log('Loading temporal tumor controls...');
    
    // Add CSS for temporal controls
    const temporalCSS = `
        #temporal-controls {
            position: fixed;
            top: 100px;
            right: 20px;
            display: flex;
            gap: 10px;
            align-items: center;
            background: rgba(255, 0, 140, 0.95);
            padding: 12px 18px;
            border-radius: 15px;
            border: 3px solid #ff008c;
            z-index: 9999;
            pointer-events: auto;
            box-shadow: 0 6px 20px rgba(255, 0, 140, 0.5);
            font-family: Arial, sans-serif;
        }
        
        .temporal-label {
            color: #fff;
            font-size: 14px;
            font-weight: 600;
            margin-right: 8px;
            text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }
        
        .temporal-btn {
            background: rgba(255, 255, 255, 0.3);
            border: 2px solid #fff;
            color: #fff;
            padding: 10px 18px;
            border-radius: 10px;
            font-size: 16px;
            font-weight: 700;
            cursor: pointer;
            transition: all 0.2s ease;
            min-width: 45px;
            text-shadow: 0 1px 3px rgba(0,0,0,0.5);
        }
        
        .temporal-btn:hover {
            background: rgba(255, 255, 255, 0.5);
            border-color: #fff;
            transform: translateY(-3px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.4);
        }
        
        .temporal-btn.active {
            background: linear-gradient(135deg, #fff, #f0f0f0);
            border-color: #fff;
            color: #ff008c;
            box-shadow: 0 4px 12px rgba(255, 255, 255, 0.4);
            text-shadow: none;
        }
        
        @media (max-width: 768px) {
            #temporal-controls {
                top: 120px;
                right: 10px;
                padding: 8px 12px;
            }
            .temporal-btn {
                padding: 6px 12px;
                font-size: 14px;
                min-width: 35px;
            }
            .temporal-label {
                font-size: 12px;
            }
        }
    `;

    // Add CSS to head
    const style = document.createElement('style');
    style.textContent = temporalCSS;
    document.head.appendChild(style);

    // Create temporal controls HTML
    const temporalControls = document.createElement('div');
    temporalControls.id = 'temporal-controls';
    temporalControls.innerHTML = `
        <div class="temporal-label">Timepoint:</div>
        <button class="temporal-btn active" data-timepoint="t1">T1</button>
        <button class="temporal-btn" data-timepoint="t2">T2</button>
        <button class="temporal-btn" data-timepoint="t3">T3</button>
    `;

    // Add to body (fixed positioning)
    document.body.appendChild(temporalControls);

    // Temporal tumor data (progressive growth)
    const temporalTumorData = {
        t1: {
            scaleFactor: 0.6,
            size: "Small (Stage 1)",
            volume: "~150 voxels",
            growth: "Initial detection"
        },
        t2: {
            scaleFactor: 1.0,
            size: "Medium (Stage 2)", 
            volume: "~378 voxels",
            growth: "Moderate growth"
        },
        t3: {
            scaleFactor: 1.5,
            size: "Large (Stage 3)",
            volume: "~650 voxels", 
            growth: "Significant growth"
        }
    };

    let currentTimepoint = 't1';
    let originalTumorData = null;

    // Store original tumor data
    function storeOriginalTumorData() {
        if (window.tracesData) {
            const tumorIndex = window.tracesData.findIndex(t => t.name === 'Tumor');
            if (tumorIndex !== -1) {
                originalTumorData = JSON.parse(JSON.stringify(window.tracesData[tumorIndex]));
                console.log('Original tumor data stored');
            }
        }
    }

    // Update tumor for timepoint
    function updateTumorForTimepoint(timepoint) {
        if (!originalTumorData || !window.tracesData) {
            console.log('Waiting for tumor data...');
            return;
        }

        currentTimepoint = timepoint;
        const tumorData = temporalTumorData[timepoint];
        
        console.log(`Updating to timepoint: ${timepoint}`);
        
        // Update button states
        document.querySelectorAll('.temporal-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.timepoint === timepoint);
        });

        // Find and update tumor trace
        const tumorIndex = window.tracesData.findIndex(t => t.name === 'Tumor');
        if (tumorIndex !== -1) {
            // Scale the tumor vertices
            const scaledVerts = originalTumorData.verts.map(v => [
                v[0] * tumorData.scaleFactor,
                v[1] * tumorData.scaleFactor, 
                v[2] * tumorData.scaleFactor
            ]);

            // Update tumor data
            window.tracesData[tumorIndex].verts = scaledVerts;
            window.tracesData[tumorIndex].timepoint = timepoint;
            window.tracesData[tumorIndex].size = tumorData.size;
            window.tracesData[tumorIndex].volume = tumorData.volume;
            window.tracesData[tumorIndex].growth = tumorData.growth;

            // Update the plot
            if (window.plot) {
                const coords = {
                    x: scaledVerts.map(v => v[0]),
                    y: scaledVerts.map(v => v[1]),
                    z: scaledVerts.map(v => v[2])
                };

                Plotly.restyle('plot', {
                    x: [coords.x],
                    y: [coords.y], 
                    z: [coords.z],
                    'vertexcolor': [window.tracesData[tumorIndex].vertexColors],
                    name: [`Tumor (${timepoint.toUpperCase()}) - ${tumorData.size}`],
                    hovertemplate: [`<b>Tumor</b><br>Timepoint: ${timepoint.toUpperCase()}<br>Size: ${tumorData.size}<br>Volume: ${tumorData.volume}<br>Growth: ${tumorData.growth}<extra></extra>`]
                }, [tumorIndex]);
            }

            // Update info box
            updateInfoBox(tumorData);
        }
    }

    // Update info box with temporal data
    function updateInfoBox(tumorData) {
        const infoBox = document.getElementById('info-box');
        if (infoBox) {
            const title = infoBox.querySelector('h3');
            const desc = infoBox.querySelector('p');
            
            if (title && desc) {
                title.textContent = `Tumor - ${currentTimepoint.toUpperCase()}`;
                title.style.color = '#ff008c';
                
                desc.innerHTML = `
                    <b>Temporal Tumor Analysis</b><br><br>
                    <b>Timepoint:</b> ${currentTimepoint.toUpperCase()}<br>
                    <b>Size:</b> ${tumorData.size}<br>
                    <b>Volume:</b> ${tumorData.volume}<br>
                    <b>Growth Status:</b> ${tumorData.growth}<br><br>
                    <i>Click T1, T2, or T3 to see tumor progression over time</i>
                `;
            }
        }
    }

    // Add event listeners
    document.querySelectorAll('.temporal-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            updateTumorForTimepoint(btn.dataset.timepoint);
        });
    });

    // Initialize when plot is ready
    function initializeTemporalControls() {
        if (window.tracesData && window.plot) {
            storeOriginalTumorData();
            updateTumorForTimepoint('t1');
            console.log('Temporal controls initialized successfully!');
        } else {
            // Try again after a short delay
            console.log('Waiting for plot data...');
            setTimeout(initializeTemporalControls, 1000);
        }
    }

    // Start initialization
    setTimeout(initializeTemporalControls, 2000);

    console.log('Temporal tumor controls script loaded!');
})();
