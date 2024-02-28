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

| Name      | Type    | Description                                                                                                                                                                                                                            |
| --------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `version` | String  | Specifies the version of Yarn to set up using this action. The specified version can be a tag (e.g., `stable`), a semver range (e.g., `4.x`), or a semver version (e.g., `4.1.0`). If not specified, it uses the default Yarn version. |
| `cache`   | Boolean | Indicates whether to enable caching during Yarn installation. It defaults to `true`.                                                                                                                                                   |

### Example

Here's a basic example demonstrating how to utilize the Setup Yarn Berry Action to set up the default version of Yarn and install dependencies for the current Node.js project in the GitHub workflow:

```yaml
name: Node.js CI
on:
  push:
jobs:
  build:
    name: Build Project
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4.1.1

      - name: Setup Yarn
        uses: threeal/setup-yarn-action@v2.0.0

      # Add more steps as needed for your workflow
```

#### Specifying Yarn Version

By default, this action will set up Yarn to the default version specified by the current Node.js project.
However, you can override it by specifying it in the `version` input parameter as shown below:

```yaml
- name: Setup Latest Yarn
  uses: threeal/setup-yarn-action@v2.0.0
  with:
    version: latest
```

Refer to [this](https://yarnpkg.com/cli/set/version) for more information on the available versions that can be set up by this action.

#### Disabling Caching

By default, caching is always enabled when installing dependencies of the current Node.js project.
To disable it, set the `cache` input parameter to `false` as shown below:

```yaml
- name: Setup Yarn Without Caching
  uses: threeal/setup-yarn-action@v2.0.0
  with:
    cache: false
```

## License

This project is licensed under the terms of the [MIT License](./LICENSE).

Copyright © 2023-2024 [Alfi Maulana](https://github.com/threeal/)
