# prep [![npm version](https://badge.fury.io/js/prep.svg)](https://badge.fury.io/js/prep)
Server-side rendering tool for your web app. Prerenders your app into static HTML files and supports routing.

## Install

```sh
npm install -g prep
```

## Usage

Create a script in your `package.json` and include the following command.

```sh
  Usage: prep [options] <build-dir>

  Options:

    -h, --help           output usage information
    -c, --config [path]  Config file (Default: .preprc)
    -p, --port [port]    Phantom server port (Default: 45678)
```

## Example `.preprc`

```json
{
  "routes": [
    "/",
    "/world"
  ]
}
```
