# loadtest-webui
A web front-end for load testing. Perfect for running on Elastic Beanstalk.

###Features
This is a web front end on top of [Alex Fernandez's loadtest](https://github.com/alexfernandez/loadtest) module. It's fairly basic, but can be easily deployed to AWS Elastic Beanstalk for cheap ad-hoc testing.

Current, features supported:
 * GET
 * Requests per second
 * Test duration
 * Password protected interface
 
###Installation
Pull the repository down, and start by running ``npm install`` (you may need sudo). Then, to start the server, run:

```javascript
npm start
```

The server will start on port 3000 unless the ``PORT`` environment property is set (which it is on Elastic Beanstalk). Access the server from your browser via ``http://localhost:3000``.

To build the client code (JS / CSS), first install the dev dependencies by running ``npm install --dev``. Then, build by calling gulp's default task:

```javascript
gulp
```

You can start a watcher with ``gulp watch``.
 
###Password Protection
Since this is a web front-end and you may want to protect your test hardware, specify a password in the ``package.json`` file under ``setts.pw``.

###Packaging for AWS Elastic Beanstalk
Perform the dev installation as described above (``npm install --dev``), then run ``gulp zip``. This will put a zip package inside the ``out/`` folder.

###Screenshots
Test console:
![Control UI](https://raw.githubusercontent.com/alexsaves/loadtest-webui/master/docs/images/testconsole.png)

Progress:
![Progress](https://raw.githubusercontent.com/alexsaves/loadtest-webui/master/docs/images/progress.png)

Results:
![Results](https://raw.githubusercontent.com/alexsaves/loadtest-webui/master/docs/images/results.png)