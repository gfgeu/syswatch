// Fetch detailed process information
async function fetchData() {
    try {
        const response = await fetch('/performance');
        const data = await response.json();
        console.log('Data received from server:', data); // Log the entire data object
        
        // Update performance metrics (CPU, memory, etc.)
        document.getElementById('cpu-usage').innerText = `${data.cpuUsage.toFixed(2)}%`;
        document.getElementById('memory-usage').innerText = `${data.memoryUsage.toFixed(2)}%`;
        document.getElementById('disk-usage').innerText = `${data.diskUsage.toFixed(2)}%`;
        document.getElementById('cpu-temperature').innerText = `${data.temperature}°C`;
        document.getElementById('disk-io').innerText = data.diskIO;

        // Update process status (if visible)
        updateTopProcesses(data.topProcesses);
    } catch (error) {
        console.error('Error fetching performance data:', error);
    }
}

// Function to update top processes
function updateTopProcesses(topProcesses) {
    const processStatusElement = document.getElementById('process-status');
    if (!processStatusElement) {
        console.error('Process status element not found.');
        return;
    }
    processStatusElement.innerHTML = ''; // Clear previous entries

    if (topProcesses && topProcesses.length > 0) {
        // Calculate total CPU usage
        const totalCPUUsage = topProcesses.reduce((total, process) => total + process.cpu, 0);
        
        // Display only the top 5 processes
        topProcesses.slice(0, 5).forEach(process => {
            const name = process.name || 'Unknown';
            const cpuPercentage = totalCPUUsage > 0 ? ((process.cpu / totalCPUUsage) * 100).toFixed(2) : 'Unknown';
            const listItem = document.createElement('li');
            listItem.classList.add('py-2', 'flex', 'justify-between');
            listItem.innerHTML = `
                <span>${name}</span>
                <span>${cpuPercentage}%</span>
            `;
            processStatusElement.appendChild(listItem);
        });
    } else {
        console.warn('No top processes available.');
    }
}

// Toggle Process Status visibility
document.getElementById('toggle-process-status').addEventListener('click', function() {
    const processStatusElement = document.getElementById('process-status');
    if (processStatusElement.classList.contains('hidden')) {
        // Show process status
        processStatusElement.classList.remove('hidden');
        this.innerText = 'Hide Process Status';
        fetchData(); // Fetch process data when showing process status
    } else {
        // Hide process status
        processStatusElement.classList.add('hidden');
        this.innerText = 'Show Process Status';
    }
});

// Fetch data initially and then set interval for subsequent fetches
fetchData();
setInterval(fetchData, 5000); // Refresh every 5 seconds
