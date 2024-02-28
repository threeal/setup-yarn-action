# Setup Yarn Berry Action

[![version](https://img.shields.io/github/v/release/threeal/setup-yarn-action?style=flat-square)](https://github.com/threeal/setup-yarn-action/releases)
[![license](https://img.shields.io/github/license/threeal/setup-yarn-action?style=flat-square)](./LICENSE)
[![build status](https://img.shields.io/github/actions/workflow/status/threeal/setup-yarn-action/build.yaml?branch=main&label=build&style=flat-square)](https://github.com/threeal/setup-yarn-action/actions/workflows/build.yaml)
[![test status](https://img.shields.io/github/actions/workflow/status/threeal/setup-yarn-action/test.yaml?branch=main&label=test&style=flat-square)](https://github.com/threeal/setup-yarn-action/actions/workflows/test.yaml)

The Setup Yarn Berry Action is a [GitHub Action](https://github.com/features/actions) crafted for effortless installation of dependencies in a [Node.js](https://nodejs.org/en) package utilizing the [Yarn](https://yarnpkg.com/) package manager.
Yarn is a fast, reliable, and secure dependency management tool for Node.js projects, offering features such as deterministic dependency resolution and offline capabilities.

This action is designed to streamline GitHub workflows for Node.js projects, enabling quick and efficient installation by supporting the caching of dependencies. Whether you're working on a small project or a complex application, the Setup Yarn Berry Action ensures a smooth and accelerated dependency setup for your Node.js packages.

## Key Features

The Setup Yarn Berry Action provides the following key features:

- Install dependencies for a Node.js package using Yarn.
- Automatic Yarn enablement using [Corepack](https://nodejs.org/api/corepack.html) before installation.
- Support for caching dependencies installation, enhancing workflow speed.

## Usage

To begin using the Setup Yarn Berry Action, refer to the [action.yaml](./action.yaml) file for detailed configuration options.
If you are new to GitHub Actions, you can explore the [GitHub Actions guide](https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions) for a comprehensive overview.

### Inputs

Here are the available input parameters for the Setup Yarn Berry Action:

| Name      | Type              | Default | Description                                                                                                                                                                           |
| --------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version` | String            |         | Specifies the version of Yarn to be set up using this action. The version specifier can be a tag (e.g., `stable`), a semver range (e.g., `4.x`), or a semver version (e.g., `4.1.0`). |
| `cache`   | `true` or `false` | `true`  | Indicates whether to use caching during Yarn installation.                                                                                                                            |

### Example

Here's a basic example demonstrating how to utilize the Setup Yarn Berry Action to install dependencies for a Node.js package using Yarn in your GitHub Actions workflow:

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

      - name: Setup Yarn
        uses: threeal/setup-yarn-action@v1.0.0

      # Add more steps as needed for your workflow
```

#### Disabling Caching

By default, caching is enabled. To disable caching, set the `cache` input parameter to `false` as shown below:

```yaml
- name: Setup Yarn Without Caching
  uses: threeal/setup-yarn-action@v1.0.0
  with:
    cache: false
```

## License

This project is licensed under the terms of the [MIT License](./LICENSE).

Copyright © 2023-2024 [Alfi Maulana](https://github.com/threeal/)
