# Setup Yarn Berry Action

[![version](https://img.shields.io/github/v/release/threeal/setup-yarn-action?style=flat-square)](https://github.com/threeal/setup-yarn-action/releases)
[![license](https://img.shields.io/github/license/threeal/setup-yarn-action?style=flat-square)](./LICENSE)
[![build status](https://img.shields.io/github/actions/workflow/status/threeal/setup-yarn-action/build.yaml?branch=main&label=build&style=flat-square)](https://github.com/threeal/setup-yarn-action/actions/workflows/build.yaml)
[![test status](https://img.shields.io/github/actions/workflow/status/threeal/setup-yarn-action/test.yaml?branch=main&label=test&style=flat-square)](https://github.com/threeal/setup-yarn-action/actions/workflows/test.yaml)

The Setup Yarn Berry Action is a [GitHub action](https://github.com/features/actions) designed to set up the [Yarn](https://yarnpkg.com/) package manager in the GitHub workflows of your [Node.js](https://nodejs.org/en) projects.
This action sets up Yarn to a specified version and installs dependencies for the current Node.js project with cache support.
Cache support provides fast setup for Node.js projects by using dependencies installed from previous runs.

This action currently only supports the berry version of Yarn (Yarn 2+).
If your project still uses the classic version of Yarn, it is suggested to migrate to the berry version.
Refer to [this](https://yarnpkg.com/migration/overview) for the migration guide.

## Key Features

The Setup Yarn Berry Action offers the following key features:

- Sets up Yarn to a specified version.
- Installs dependencies for the current Node.js project with cache support.

## Usage

To begin using the Setup Yarn Berry Action, refer to the [action.yaml](./action.yaml) file for detailed configuration options.
If you are new to GitHub Actions, you can explore the [GitHub Actions guide](https://docs.github.com/en/actions/learn-github-actions/understanding-github-actions) for a comprehensive overview.

### Inputs

Here are the available input parameters for the Setup Yarn Berry Action:

| Name      | Type              | Default | Description                                                                                                                                                                           |
| --------- | ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version` | String            |         | Specifies the version of Yarn to be set up using this action. The specified version can be a tag (e.g., `stable`), a semver range (e.g., `4.x`), or a semver version (e.g., `4.1.0`). |
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

#### Specifying Yarn Version

You can specify the Yarn version to be used by providing it as an input parameter:

```yaml
- name: Setup Latest Yarn
  uses: threeal/setup-yarn-action@v1.0.0
  with:
    version: latest
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
