const { exec } = require("child_process");
const fs = require("node:fs");

// config
let config = require("./defaultConfig.json");

try {
    config = JSON.parse(fs.readFileSync("./awt-config.json"));
} catch(e) {
    log(`No config found.`);
}

const PORT = config.port ? config.port : 5124;
let homePage = config.home_file ? config.home_file : "index.html";
const projectDir = config.project_path ? config.project_path : "example_project";

// logging
function log(msg) {
    if(config.log_data)
        console.log(msg);
    if(config.log_data_in_file)
        fs.appendFileSync("log.txt", msg+"\n");
}

function devlog(msg) {
    if(config.dev.log_data)
        console.log(msg);
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

module.exports = {config, PORT, homePage, projectDir, log, devlog, run_cmd};