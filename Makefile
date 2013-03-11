# VARS. use to adjust paths, if necessary
NODE = nodejs
APP = app
FOREVER = forever
# forever conf: watch for changes. if it does not survive for 1s, wait 5s.
FRVR_CFG = --watch --minUptime 1000 --spinSleepTime 5000

GIT_HASH = $(shell git log -1 --pretty=format:"%H")

# TASKS.
default: run

run: # run in terminal
	${FOREVER} ${FRVR_CFG} ${APP}.js

start: # run it in the background
	${FOREVER} ${FRVR_CFG} start ${APP}.js

stop: # stop background app
	${FOREVER} stop ${APP}.js

logs: # logs from backgound
	${FOREVER} logs ${APP}.js

lint:
	jslint --node --sloppy --white ${APP}.js *.js lib/*.js

dependencies:
	# system-wide deps. only installed if not found in $PATH.
	@command -v ${NODE} && echo "^ was found" || sudo apt-get install nodejs
	@command -v npm && echo "^ was found" || sudo apt-get install npm
	@command -v forever && echo "^ was found" echo "" || sudo npm install -g forever
	@command -v jslint && echo "^ was found" || sudo npm install -g jslint
	# app deps (node_modules)
	npm install

docs:
	# generate doccs with docco
	@# !!! docco needs to be installed!
	docco ${APP}.js lib/*.js
	cp docs/${APP}.html docs/index.html
	@# !!! gh-pages clone needs to be in /docs!
	cd docs; git add --all
	cd docs; git commit -m "docs based on ${GIT_HASH}" && git push origin gh-pages
	
	
# shortcuts
deps: dependencies

s: start
	
l: logs

.PHONY : docs