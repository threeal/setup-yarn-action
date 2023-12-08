# Yarn Install Action

[![version](https://img.shields.io/github/v/release/threeal/yarn-install-action?style=flat-square)](https://github.com/threeal/yarn-install-action/releases)
[![license](https://img.shields.io/github/license/threeal/yarn-install-action?style=flat-square)](./LICENSE)
[![build status](https://img.shields.io/github/actions/workflow/status/threeal/yarn-install-action/build.yaml?branch=main&label=build&style=flat-square)](https://github.com/threeal/yarn-install-action/actions/workflows/build.yaml)
[![test status](https://img.shields.io/github/actions/workflow/status/threeal/yarn-install-action/test.yaml?branch=main&label=test&style=flat-square)](https://github.com/threeal/yarn-install-action/actions/workflows/test.yaml)

The Yarn Install Action is a [GitHub Action](https://github.com/features/actions) designed to install [Node.js](https://nodejs.org/en) dependencies using [Yarn](https://yarnpkg.com/) with cache support .

## Key Features

The Yarn Install Action provides the following key features:

- Install dependencies for a Node.js package using Yarn.
- Automatic Yarn enablement using [Corepack](https://nodejs.org/api/corepack.html) before installation.
- Support for caching dependencies installation, enhancing workflow speed.

## Usage

To begin using the Yarn Install Action, refer to the [action.yaml](./action.yaml) file for detailed configuration options.
If you are new to GitHub Actions, you can explore the [GitHub Actions guide](https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions) for a comprehensive overview.

### Example

Here's a basic example demonstrating how to utilize the Yarn Install Action to install dependencies for a Node.js package using Yarn in your GitHub Actions workflow:

```yaml
name: Build
on:
  push:
jobs:
  build:
    name: Build Package
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4.1.1

      - name: Install Dependencies
        uses: threeal/yarn-install-action@v1.0.0

      # Add more steps as needed for your workflow
```

## License

This project is licensed under the terms of the [MIT License](./LICENSE).

Copyright © 2023 [Alfi Maulana](https://github.com/threeal/)
