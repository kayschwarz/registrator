# VARS. use to adjust paths, if necessary
NODE = nodejs
APP = app
FOREVER = forever
# forever conf: watch for changes. if it does not survive for 1s, wait 5s.
FRVR_CFG = --watch --minUptime 1000 --spinSleepTime 5000

# ENV
#ENV = true # dont run it
ENV = export COUCH_USER=${COUCH_USER}; export COUCH_PASS=${COUCH_PASS}

GIT_HASH = $(shell git log -1 --pretty=format:"%H")

# TASKS.
default: run

run: # run in terminal
	@${ENV} && ${FOREVER} ${FRVR_CFG} ${APP}.js

start: # run it in the background
	@${ENV} && ${FOREVER} ${FRVR_CFG} start ${APP}.js

stop: # stop background app
	@${ENV} && ${FOREVER} stop ${APP}.js

logs: # logs from backgound
	@${ENV} && ${FOREVER} logs ${APP}.js

lint:
	jslint --node --sloppy --white ${APP}.js *.js lib/*.js

deps:
	# system-wide deps. only installed if not found in $PATH.
	@command -v ${NODE} && echo "^ was found" || sudo apt-get install nodejs
	@command -v npm && echo "^ was found" || sudo apt-get install npm
	@command -v forever && echo "^ was found" echo "" || sudo npm install -g forever
	@command -v jslint && echo "^ was found" || sudo npm install -g jslint
	# app deps (node_modules)
	npm install
	# appstrakt
#	curl "eins78.github.io/appstrakt/base.css" > public/appstrakt.css
#	curl "eins78.github.io/appstrakt/app.css" >> public/appstrakt.css

docs:
	# generate doccs with docco
	# !!! docco needs to be installed!
	docco ${APP}.js lib/*.js public/jquery-client.js
	cp docs/${APP}.html docs/index.html
	open docs/index.html

docs-pub:
	# !!! gh-pages clone needs to be in /docs!
	cd docs; git add --all
	cd docs; git commit -m "docs based on ${GIT_HASH}" && git push origin gh-pages
	
	
.PHONY : docs