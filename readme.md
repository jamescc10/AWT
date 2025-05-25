# AWT (Amazing Website Testing)
This is a tool that lets you test websites on computer/android or both. When you save the code it refreshes.

# Download
[Windows](#computer)
[Android](#android)
[Config](#config)

## Computer
Just download the file and add awt-config.json

## Android
First you need to install ADB with `winget install Google.PlatformTools`
Second you need to enable developer options and then enable USB debugging. (optional enable stay awake)
Last you need to install AWT from the releases section on Github.

## Config
Add awt-config.json to the same directory as the executable.
- project_path(string) - directory that the project is in local from directory config is in
- home_file(string) - file that browser starts with
- port(int) - port the website is running on and websocket
- log_data(boolean) - if awt logs data
- log_data_in_file(boolean) - if awt should log the data in a file
- start_on_android(boolean) - if awt starts on android
- start_on_computer(boolean) - if awt starts on host computer
```json
{
    "project_path": "example_project",
    "home_file": "index.html",
    "port": 5124,
    "log_data": true,
    "log_data_in_file": false,
    "start_on_android": true,
    "start_on_computer": true,

    "dev": {
        "log_data": true
    }
}
```

[TODO](todo.md)
