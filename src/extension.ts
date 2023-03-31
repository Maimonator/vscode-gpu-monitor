import * as vscode from 'vscode';
import { exec } from 'child_process';

interface Gpu {
    name: string;
    memoryUsed: string;
    memoryTotal: string;
    temperature: string;
    gpuUtilization: string;
    memoryUtilization: string;
    graphicsClock: string;
    memoryClock: string;
}

let myStatusBarItem: vscode.StatusBarItem;
let selectedGpuIndex = 0;
let updateInterval = 1000;
let updateIntervalId: NodeJS.Timeout;


export function activate(context: vscode.ExtensionContext) {
    myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    myStatusBarItem.command = 'gpu-monitor.selectGpu';
    context.subscriptions.push(myStatusBarItem);

    let disposable = vscode.commands.registerCommand('gpu-monitor.selectGpu', async () => {
        const gpus = await getGpus();
        const gpuNames = gpus.map(gpu => gpu.name);
        const selectedGpuName = await vscode.window.showQuickPick(gpuNames, { placeHolder: 'Select a GPU' });
        if (selectedGpuName) {
            selectedGpuIndex = gpuNames.indexOf(selectedGpuName);
        }
    });
    context.subscriptions.push(disposable);

    disposable = vscode.commands.registerCommand('gpu-monitor.setUpdateInterval', async () => {
        const intervalString = await vscode.window.showInputBox({ placeHolder: 'Enter the update interval in milliseconds' });
        if (intervalString) {
            updateInterval = parseInt(intervalString);
            clearInterval(updateIntervalId);
            updateIntervalId = setInterval(updateGpuMemory, updateInterval);
        }
    });
    context.subscriptions.push(disposable);

    const configuration = vscode.workspace.getConfiguration('gpu-monitor');
    updateInterval = configuration.get('updateInterval', 1000);

    updateGpuMemory();
    updateIntervalId = setInterval(updateGpuMemory, updateInterval);
}


async function getGpus(): Promise<Gpu[]> {
    return new Promise((resolve, reject) => {
        exec('nvidia-smi --query-gpu=name,memory.used,memory.total,temperature.gpu,utilization.gpu,utilization.memory,clocks.current.graphics,clocks.current.memory --format=csv,noheader', (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            if (stderr) {
                reject(stderr);
                return;
            }
            const lines = stdout.split('\n').slice(0, -1);
            const gpus = lines.map(line => {
                const [name, memoryUsed, memoryTotal, temperature, gpuUtilization, memoryUtilization, graphicsClock, memoryClock] = line.split(', ');
                return { name, memoryUsed, memoryTotal, temperature, gpuUtilization, memoryUtilization, graphicsClock, memoryClock };
            });
            resolve(gpus);
        });
    });
}

async function updateGpuMemory() {
    const gpus = await getGpus();
    if (gpus.length > 0) {
        const gpu = gpus[selectedGpuIndex];
        myStatusBarItem.text = `${gpu.name}: ${gpu.memoryUsed} / ${gpu.memoryTotal}, ${gpu.temperature}°C`;
        myStatusBarItem.tooltip = `GPU Utilization: ${gpu.gpuUtilization}\nMemory Utilization: ${gpu.memoryUtilization}\nGraphics Clock: ${gpu.graphicsClock}\nMemory Clock: ${gpu.memoryClock}`;
        myStatusBarItem.show();
    }
}

export function deactivate() {}
