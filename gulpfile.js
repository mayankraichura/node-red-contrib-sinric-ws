var childProcess = require("child_process");
var oldSpawn = childProcess.spawn;
var procNodeRed = null;
var pid = 0;

function mySpawn() {
    console.log('spawn called');
    console.log(arguments);
    var result = oldSpawn.apply(this, arguments);
    return result;
}

childProcess.spawn = mySpawn;

var gulp = require('gulp'),
    log = require('fancy-log'),
    spawn = childProcess.spawn,
    tk = require('taskkill');

gulp.task("default", function (done) {
    gulp.watch("./nodes/**/*.*", function (obj) {
        log("Watcher executed.");
        log(obj);
        if (procNodeRed) log(procNodeRed.pid);
        log(pid);
        install_n_run();
    });

    install_n_run();

    function install_n_run() {

        //Kill any node-red process
        if (procNodeRed) {
            spawn("taskkill", ["/pid", procNodeRed.pid, '/f', '/t']);
            procNodeRed = null;
        }


        spawn('npm uninstall D:\\Work\\UnderDevelopment\\Software\\HA\\NodeRed\\sinric', [], {
                cwd: "C:\\Users\\Mayank\\.node-red",
                stdio: "inherit",
                shell: true
            })
            .on("exit", function (code) {
                console.log(`npm uninstall child exited with code ${code}`);
                if(code !== 0) return;

                const bat = spawn('npm install D:\\Work\\UnderDevelopment\\Software\\HA\\NodeRed\\sinric', [], {
                    cwd: "C:\\Users\\Mayank\\.node-red",
                    stdio: "inherit",
                    shell: true
                });

                bat.on('exit', (code) => {
                    console.log(`npm install child exited with code ${code}`);

                    if (code === 0) {
                        var pNode = 'node "C:\\Program Files\\nodejs\\node_modules\\node-red\\red.js"';
                        var pNodeRed = 'node-red';

                        procNodeRed = spawn(pNode, [], {
                            stdio: "inherit",
                            shell: true
                        });

                        log(procNodeRed);
                        pid = procNodeRed.pid;
                    }
                });
            });
    }
});