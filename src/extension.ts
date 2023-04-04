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
let binaryPath = "nvidia-smi";


function getNvidiaSMIError(): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
        let error = exec(binaryPath, (error, stdout, stderr) => {
            if (error) {
                resolve(`The command ${binaryPath} was not found on shell.`);
            }
        });
        error = exec(`${binaryPath} -i ${selectedGpuIndex}`, (error, stdout, stderr) => {
            if (error) {
                resolve(`Could not find GPU with index ${selectedGpuIndex} make sure you have a GPU available`);
            } else {
                resolve(undefined);
            }
        });
    });
}

function testNvidiaSMI() {
    getNvidiaSMIError().then(error => {
        if (error) {
            vscode.window.showErrorMessage(`Extension startup failed because of '${error}' try and update your settings`, "Open Settings").then(choice => {
                if (choice === "Open Settings") {
                    vscode.commands.executeCommand('workbench.action.openSettings', '@ext:Maimonator.gpu-monitor');
                }
            });
        }
    });

}



export function activate(context: vscode.ExtensionContext) {
    myStatusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    myStatusBarItem.command = 'gpu-monitor.selectGpu';
    context.subscriptions.push(myStatusBarItem);

    context.subscriptions.push(vscode.commands.registerCommand('gpu-monitor.selectGpu', async () => {
        const gpuNames = await getGpuNames();
        const selectedGpuName = await vscode.window.showQuickPick(gpuNames, { placeHolder: 'Select a GPU' });
        if (selectedGpuName) {
            selectedGpuIndex = gpuNames.indexOf(selectedGpuName);
        }
    }));

    context.subscriptions.push(vscode.commands.registerCommand('gpu-monitor.setUpdateInterval', async () => {
        const intervalString = await vscode.window.showInputBox({ placeHolder: 'Enter the update interval in milliseconds' });
        if (intervalString) {
            updateInterval = parseInt(intervalString);
            clearInterval(updateIntervalId);
            updateIntervalId = setInterval(updateGpuMemory, updateInterval);
        }
    }));

    context.subscriptions.push(vscode.workspace.onDidChangeConfiguration(event => {
        if (event.affectsConfiguration('gpu-monitor')) {
            const configuration = vscode.workspace.getConfiguration('gpu-monitor');
            updateInterval = configuration.get('updateInterval', 1000);
            selectedGpuIndex = configuration.get('selectedGpuIndex', 0);
            binaryPath = configuration.get('binaryPath', "nvidia-smi");
            testNvidiaSMI();
        }

    }));

    const configuration = vscode.workspace.getConfiguration('gpu-monitor');
    updateInterval = configuration.get('updateInterval', 1000);
    selectedGpuIndex = configuration.get('selectedGpuIndex', 0);
    binaryPath = configuration.get('binaryPath', "nvidia-smi");


    testNvidiaSMI();
    updateGpuMemory();
    updateIntervalId = setInterval(updateGpuMemory, updateInterval);
}

async function getGpuNames(): Promise<string[]> {
    return new Promise((resolve, reject) => {
        exec(`${binaryPath} --query-gpu=name --format=csv,noheader`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            if (stderr) {
                reject(stderr);
                return;
            }
            const gpuNames = stdout.split('\n').slice(0, -1).map(line => line.trimEnd().trimStart());
            resolve(gpuNames);
        });
    });
}

async function getGpuData(): Promise<Gpu> {
    return new Promise((resolve, reject) => {
        exec(`${binaryPath} -i ${selectedGpuIndex} --query-gpu=name,memory.used,memory.total,temperature.gpu,utilization.gpu,utilization.memory,clocks.current.graphics,clocks.current.memory --format=csv,noheader`, (error, stdout, stderr) => {
            if (error) {
                reject(error);
                return;
            }
            if (stderr) {
                reject(stderr);
                return;
            }
            const gpuData = stdout.split('\n')[0];
            const [name, memoryUsed, memoryTotal, temperature, gpuUtilization, memoryUtilization, graphicsClock, memoryClock] = gpuData.split(', ');
            let gpu = { name, memoryUsed, memoryTotal, temperature, gpuUtilization, memoryUtilization, graphicsClock, memoryClock };
            resolve(gpu);
        });
    });
}

async function updateGpuMemory() {
    const gpu = await getGpuData();
    if (gpu !== null) {
        myStatusBarItem.text = `${gpu.name}: ${gpu.memoryUsed} / ${gpu.memoryTotal}, ${gpu.temperature}°C`;
        myStatusBarItem.tooltip = `GPU Utilization: ${gpu.gpuUtilization}\nMemory Utilization: ${gpu.memoryUtilization}\nGraphics Clock: ${gpu.graphicsClock}\nMemory Clock: ${gpu.memoryClock}`;
        myStatusBarItem.show();
    }
}

export function deactivate() {
    myStatusBarItem.hide();
}
