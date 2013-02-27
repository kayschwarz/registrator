# VARS. use to adjust paths, if necessary
NODE = nodejs
APP = app.js
FOREVER = forever
# forever conf: watch for changes. if it does not survive for 1s, wait 5s.
FRVR_CFG = --watch --minUptime 1000 --spinSleepTime 5000

# TASKS.
default: run

run: # run in terminal
	${FOREVER} ${FRVR_CFG} ${APP}

start: # run it in the background
	${FOREVER} ${FRVR_CFG} start ${APP}

stop: # stop background app
	${FOREVER} stop ${APP}

logs: # logs from backgound
	${FOREVER} logs ${APP}

lint:
	jslint --node --sloppy --white *.js

dependencies:
	# system-wide deps. only installed if not found in $PATH.
	@command -v ${NODE} && echo "^ was found" || sudo apt-get install nodejs
	@command -v npm && echo "^ was found" || sudo apt-get install npm
	@command -v forever && echo "^ was found" echo "" || sudo npm install -g forever
	@command -v jslint && echo "^ was found" || sudo npm install -g jslint
	# app deps (node_modules)
	npm install

npm-pack:
	cd node_modules/ ; rm *.tgz ; npm pack *
	cd node_modules/ ; git add *.tgz
	@echo 'You should: $ git commit -m "updated node module packs"'

npm-unpack:
	cd node_modules/
	echo "ask eins78 if he read more doku. something with 'npm cache'."
	
# shortcuts
deps: dependencies

s: start
	
l: logs
