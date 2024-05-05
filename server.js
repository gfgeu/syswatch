#!/usr/bin/env node
const express = require('express');
const os = require('os');
const osUtils = require('os-utils');
const si = require('systeminformation');
const { exec } = require('child_process');

const app = express();
const port = 3000;

app.use(express.static('public'));

// Endpoint to fetch system performance data including top CPU-consuming processes and process status
app.get('/performance', async (req, res) => {
    try {
        const cpuUsage = await getCpuUsage();
        const memoryUsage = await getMemoryUsage();
        const diskUsage = await getDiskUsage();
        const temperature = await getTemperature();
        const diskIO = await getDiskIO();
        const topProcesses = await getTopCpuProcesses();
        const processStatus = await getProcessStatus(); // Retrieve process status data

        res.json({ cpuUsage, memoryUsage, diskUsage, temperature, diskIO, topProcesses, processStatus }); // Send all data in response
    } catch (error) {
        console.error('Error fetching performance data:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(port, () => {
    console.log(`SYSWatch is now available at http://localhost:${port}`);
});

// Helper functions to fetch system performance data
async function getCpuUsage() {
    return new Promise((resolve, reject) => {
        osUtils.cpuUsage((cpuUsage) => {
            resolve(cpuUsage * 100);
        });
    });
}

async function getMemoryUsage() {
    return (1 - (os.freemem() / os.totalmem())) * 100;
}

async function getDiskUsage() {
    try {
        const data = await si.fsSize();
        const disk = data.find(item => item.mount === '/');
        if (disk) {
            const usedPercentage = (disk.use / disk.size) * 100;
            return usedPercentage;
        } else {
            return 0; // Default value if disk data is not found
        }
    } catch (error) {
        console.error('Error fetching disk usage:', error);
        return 0; // Default value if an error occurs
    }
}

async function getTemperature() {
    const data = await si.cpuTemperature();
    return data.main;
}

async function getDiskIO() {
    // Replace with actual disk I/O calculation
    return 0;
}

// Function to fetch top CPU-consuming processes
async function getTopCpuProcesses() {
    try {
        const processes = await si.processes();
        const sortedProcesses = processes.list.sort((a, b) => b.pcpu - a.pcpu); // Sort by CPU usage
        return sortedProcesses.slice(0, 3); // Return top 3 processes
    } catch (error) {
        console.error('Error fetching top CPU-consuming processes:', error);
        return []; // Return an empty array if an error occurs
    }
}

// Function to execute system command and retrieve process information
function getProcessStatus() {
    return new Promise((resolve, reject) => {
        const command = process.platform === 'win32' ? 'tasklist' : 'ps aux';

        exec(command, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                reject(error);
            }
            if (stderr) {
                console.error(`Command stderr: ${stderr}`);
                reject(stderr);
            }

            const processes = stdout.split('\n');
            const processList = processes.filter(process => {
                return !process.startsWith('=') && !process.trim() === '';
            }).map(process => {
                // Use regex to extract process name
                const nameMatch = process.match(/[^\\]+$/);
                const name = nameMatch ? nameMatch[0] : 'Unknown';
                const tokens = process.trim().split(/\s+/);
                const cpu = tokens[tokens.length - 3]; // CPU usage is located at the second last index
                return { name, cpu };
            });

            // Return only the top 5 processes
            resolve(processList.slice(0, 5));
        });
    });
}
