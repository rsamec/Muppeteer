const Mocha = require('mocha');
const path = require('path');
const mochateerInterface = require('../lib/test-interface');
const {browserInstance} = require('../lib/test-controller');
const recursiveReadSync = require('recursive-readdir-sync');

module.exports = class Launcher {
    constructor({
                    testDir,
                    testFilter,
                    reportDir,
                    componentTestUrlFactory,
                    componentTestVisualPathFactory,
                    visualThreshold,
                    afterHook
                }) {
        componentTestUrlFactory = componentTestUrlFactory || (component => {
            return component.url;
        });

        componentTestVisualPathFactory = componentTestVisualPathFactory || (component => {
            return path.join(testDir, `/screenshots/${component.name}`);
        });

        Mocha.interfaces['mochateer'] = mochateerInterface(componentTestUrlFactory, componentTestVisualPathFactory, visualThreshold);

        const mocha = new Mocha({
            timeout: 10000, ui: 'mochateer', reporter: 'mochawesome', reporterOptions: {
                reportDir: reportDir,
                reportFilename: 'test-report',
                reportTitle: 'Test Report',
                reportPageTitle: 'Test Report'
            }
        });

        let files = null;

        try {
            files = recursiveReadSync(testDir);
        } catch (err) {
            if (err.errno === 34) {
                throw Error('Path does not exist');
            } else {
                throw err;
            }
        }

        if (testFilter) {
            files.filter(file => {
                return path.basename(file).substr(-(testFilter.length)) === testFilter;
            }).forEach(file => {
                mocha.addFile(file);
            });
        } else {
            files.forEach(file => {
                mocha.addFile(file);
            });
        }
        
        (async function() {
            await browserInstance.launch();

            mocha.run(async () => {
                await browserInstance.close();
                afterHook && afterHook();
            });
        })();
    }
};

