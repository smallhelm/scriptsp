# scriptsp
Run multiple package.json scripts in parallel (for development)

## How to use it
install
```sh
$ npm install --save-dev scriptsp
```
package.json
```js
  ...
  "scripts": {
    "dev-server": "nodemon ....",
    "watch-test": "...some test watching script...",
    "watch-js": "watchify ...",

    "dev": "scriptsp dev-server watch-test watch-js"
  }
  ...
```
run it
```sh
$ npm run dev
```
![scriptsp demo](https://raw.githubusercontent.com/smallhelm/scriptsp/master/demo.png)


## Usage
```

USAGE: scriptsp [--raw] <script1> <script2> ...

    -r, --raw
        simply pipe the output from the scripts, no fancy output stuff

i.e.
    $ scriptsp start test watch-js

```

## License
MIT
