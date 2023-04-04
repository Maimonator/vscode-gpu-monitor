# GPU Monitor
Allows you to monitor the usage of your NVIDIA GPU directly in your status bar.

Note: this extension has no affiliation with NVIDIA.

## Features
- Displays the name, memory usage, and temperature of your Nvidia GPU in the status bar.
- Allows you to select the GPU you want to monitor.
- Allows you to set the update interval for monitoring the GPU.
- Shows an error message if the nvidia-smi command is not found on your system or if the specified GPU index cannot be found.
- Provides a tooltip with additional information about GPU utilization and memory utilization.

## Requirements
- This extension requires the nvidia-smi command to be installed on your system.

## Extension Settings

This extension contributes the following settings:

- `gpu-monitor.updateInterval`: the interval (in milliseconds) at which to update the GPU information. Defaults to 1000.
- `gpu-monitor.selectedGpuIndex`: the index of the GPU to monitor. Defaults to 0 (the first GPU).
- `gpu-monitor.binaryPath`: the path to the nvidia-smi command. Defaults to "nvidia-smi".

## Commands
This extension contributes the following commands:

- `gpu-monitor.selectGpu`: allows you to select the GPU you want to monitor.
- `gpu-monitor.setUpdateInterval`: allows you to set the update interval for monitoring the GPU.

## Credits

- README was generated with ChatGPT
- Icon was generated with Dall-E
- Code was co-authored with Bing chat
