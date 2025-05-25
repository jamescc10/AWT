const express = require("express");
const expressws = require("express-ws");
const fs = require("node:fs");
const path = require("node:path");
const mime = require("mime");

const app = express();
expressws(app);

const {config, PORT, homePage, projectDir, log, devlog, run_cmd} = require("./util.js");

// added script
const script = `
<script>
const ws = new WebSocket('ws://localhost:${PORT}/ws');

ws.onopen = () => {
    console.log("AWT Connected!");
};

ws.onmessage = (event) => {
    const filename = event.data;
    console.log(\`File Changed \${filename}\`);
    if(filename === location.pathname.slice(1,location.pathname.length)) {
        location.reload();
    } else if(filename.endsWith(".css") || filename.endsWith(".js")) {
        location.reload();
    }
};

ws.onclose = () => {
    console.log("Connection closed");
};
</script>
`;

// on exit
process.on("exit", () => {
    log("Removing reverse");
    exec(`adb reverse --remove tcp:${PORT}`);
    log("Exiting");
});

// ws
let clients = Array();
app.ws("/ws", (ws, req) => {
    const id = clients.length;
    clients.push(ws);

    ws.on("close", () => {
        clients.splice(id,id);
    });
});

function msgAll(msg) {
    for(let i = 0; i < clients.length; ++i) {
        clients[i].send(msg);
    }
}

// watch for updates
// fs.watch(projectDir, {recursive: true}, (eventType, filename) => {
//     log(`File changed ${filename}`);
//     msgAll(`file changed ${filename}`);
//     if(eventType == "change" && filename == currentPage) {
//         log("Refreshing");
//         run_cmd(`adb shell input swipe 500 300 500 1000`, false); // swipe down to refresh
//     } else if(eventType == "change" && (filename.endsWith(".css") || filename.endsWith(".js"))) {
//         log("Refreshing");
//         run_cmd(`adb shell input swipe 500 300 500 1000`, false); // swipe down to refresh
//     }
// });

fs.watch(projectDir, {recursive: true}, (eventType, filename) => {
    log(`File changed ${filename}`);
    msgAll(`${filename}`);
});

// hosting
app.use("/", (req, res, next) => {
    const rootDir = projectDir;
    const filePath = path.join(rootDir, req.url);

    // check if dir
    fs.stat(filePath, (err, stats) => {
        if(err) {
            if(err.code == "ENOENT") {
                next();
            } else {
                res.send(err);
            }
            return;
        }

        if(stats.isDirectory()) {
            fs.readFile(path.join(filePath, "index.html"), (err, data) => {
                if(err) {
                    res.send(`Error reading file: ${err}`);
                }

                res.setHeader("Content-Type", "text/html");
                res.send(data);
            });
        } else {
            const mimeType = mime.getType(filePath) || "application/octet-stream";
            res.setHeader("Content-Type", mimeType);

            if(mimeType === "text/html") {
                let content = fs.readFileSync(filePath);

                const endIndex = content.indexOf("</body>"); // at the end of the body or 0 index added to empty file
                res.send([content.slice(0,endIndex), script, content.slice(endIndex, content.length)].join(""));
            } else {
                fs.createReadStream(filePath).pipe(res);
            }
        }
    });
});

app.use((req, res, next) => res.send("404 not found."));

// listen
app.listen(PORT, async () => {
    log(`Listening on *:${PORT}`);

    // clear log
    if(config.log_data_in_file)
        fs.writeFileSync("log.txt", "");

    // run on android
    if(config.start_on_android) {
        log("Checking Android Devices");
        run_cmd("adb devices");
        log("Running reverse to Android");
        run_cmd(`adb reverse tcp:${PORT} tcp:${PORT}`, true);
        log("Opening on Android");
        run_cmd(`adb shell am start -a android.intent.action.VIEW -d http://localhost:${PORT}/${config.home_file}`, true);
    }

    // Open in browser on computer
    if(config.start_on_computer) {
        log("Opening on computer");
        (async () => {
            const { default: open } = await import('open');
            open(`http://localhost:${PORT}/${config.home_file}`);
        })();
    }
});