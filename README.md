# prep
Server-side rendering tool for your web app. Prerenders your app into static HTML files and supports routing.

## Install

```sh
npm install -D prep
```

## Usage

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
