# Node Modules Cleaner

A simple desktop application for finding and removing `node_modules` folders from your system to free up disk space.

## Features

- Scan any directory for `node_modules` folders
- See the size of each `node_modules` folder
- Delete all found `node_modules` folders with a single click
- Cross-platform support (macOS, Windows, Linux)

## Screenshots

(Screenshots will be added here)

## Installation

### Download

Download the latest version from the [Releases](https://github.com/KindCoder-no/node-cleaner/releases) page.

### Build from Source

```bash
# Clone the repository
git clone https://github.com/KindCoder-no/node-cleaner.git
cd node-cleaner

# Install dependencies
npm install

# Build and run the app
npm start

# Build distributable
npm run dist
```

## Development

```bash
# Run in development mode with hot reload
npm run dev
```

## Technologies Used

- [Electron](https://www.electronjs.org/) - Desktop application framework
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Electron Builder](https://www.electron.build/) - Packaging and distribution

## License

ISC © [Emre Sanden](https://github.com/KindCoder-no)


## Notes
Create new release:
```
git tag v{{version}}

git push origin v{{version}}
```