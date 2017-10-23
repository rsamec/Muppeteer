const Mocha = require('mocha');
const path = require('path');
const mochateerInterface = require('./test-interface');
const {browserInstance} = require('./test-controller');
const recursiveReadSync = require('recursive-readdir-sync');

module.exports = class Launcher {
    constructor(testDir, testFilter, reportDir) {
        Mocha.interfaces['mochateer'] = mochateerInterface(component => {
            return component.url;
        }, component => {
            console.log(path.join(testDir, `/screenshots/${component.name}`));
            return path.join(testDir, `/screenshots/${component.name}`);
        });

        (async function() {
            const mocha = new Mocha({timeout: 10000, ui: 'mochateer', reporter: 'mochawesome', reporterOptions: {
                reportDir: reportDir,
                reportFilename: 'test-report',
                reportTitle: 'Test Report',
                reportPageTitle: 'Test Report'
            }});

            let files = null;

            try {
                files = recursiveReadSync(testDir);
            } catch (err) {
                if (err.errno === 34){
                    console.log('Path does not exist');
                } else {
                    throw err;
                }
            }

            if (testFilter) {
                files.filter(file => {
                    return path.basename(file).substr(-(testFilter.length)) === testFilter;
                }).forEach(file =>  {
                    mocha.addFile(file);
                });
            } else {
                files.forEach(file =>  {
                    mocha.addFile(file);
                });
            }

            mocha.run(() => {
                browserInstance.closeBrowser();
            });
        })();
    }
};

