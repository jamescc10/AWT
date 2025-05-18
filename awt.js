const express = require("express");
const { exec } = require("child_process");
const fs = require("node:fs");
const app = express();

// config
const defaultConfig = {
    "project_path": "example_project",
    "home_file": "index.html",
    "port": 5124,
    "log_data": true,
    "log_data_in_file": false
};

let config = defaultConfig;

try {
    config = JSON.parse(fs.readFileSync("./awt-config.json"));
} catch(e) {
    log("No config found.")
}

const PORT = config.port ? config.port : 5124;
let currentPage = config.home_file ? config.home_file : "index.html";
const projectDir = config.project_path ? config.project_path : "example_project";

// on exit
process.on("exit", () => {
    log("Removing reverse");
    exec(`adb reverse --remove tcp:${PORT}`);
    log("Exiting");
});

// logging
function log(msg) {
    if(config.log_data)
        console.log(msg);
    if(config.log_data_in_file)
        fs.appendFileSync("log.txt", msg+"\n");
}

// run cmd
function run_cmd(cmd, output) {
    exec(cmd, (error, stdout, stderr) => {
        if(error) {
            console.error(`error: ${error.message}`);
            console.error("Error starting server.");
            process.exit(1);
        }

        if(stderr) {
            console.error(`stderr: ${stderr}`);
            console.error("Error starting server.");
            process.exit(1);
        }

        if(output)
            log(stdout);
    });
}

// watch for updates
fs.watch(`./${projectDir}`, (eventType, filename) => {
    log(`File changed ${filename}`);
    if(eventType == "change" && filename == currentPage) {
        log("Refreshing");
        run_cmd(`adb shell input swipe 500 300 500 1000`, false); // swipe down to refresh
    } else if(eventType == "change" && (filename.endsWith(".css") || filename.endsWith(".js"))) {
        log("Refreshing");
        run_cmd(`adb shell input swipe 500 300 500 1000`, false); // swipe down to refresh
    }
});

// get link
app.use((req, res, next) => {
    currentPage = req.url.slice(1,req.url.length);
    next();
});

// hosting
app.use('/', express.static(projectDir));
app.use((req, res, next) => res.send("404 not found."));

// listen
app.listen(PORT, async () => {
    log(`Listening on *:${PORT}`);

    // clear log
    if(config.log_data_in_file)
        fs.writeFileSync("log.txt", "");

    // run on android
    log("Checking Devices");
    run_cmd("adb devices");
    log("Running reverse");
    run_cmd(`adb reverse tcp:${PORT} tcp:${PORT}`, true);
    log("Opening in browser");
    run_cmd(`adb shell am start -a android.intent.action.VIEW -d http://localhost:${PORT}/${config.home_file}`, true);

    // Open in browser on computer
    // doesnt work with currentPage var and reload
    // (async () => {
    //     const { default: open } = await import('open');
    //     open('http://example.com');
    // })();
});