# ember-cli-deploy-redis

> An ember-cli-deploy plugin to update a path in Firebase on activation

<hr/>
**WARNING: This plugin is only compatible with ember-cli-deploy versions >= 0.5.0**
<hr/>

This plugin updates a path in Firebase with the latest version information when the deploy is activated.

## Why would I want to do that?

The main use-case is to display a notification to your users when a version changes so they can reload to get changes.

## What is an ember-cli-deploy plugin?

A plugin is an addon that can be executed as a part of the ember-cli-deploy pipeline. A plugin will implement one or more of the ember-cli-deploy's pipeline hooks.

For more information on what plugins are and how they work, please refer to the [Plugin Documentation][1].

## Quick Start
To get up and running quickly, do the following:

- Ensure [ember-cli-deploy-build][2] is installed and configured.

- Install this plugin

```bash
$ ember install ember-cli-deploy-notify-firebase
```

- Place the following configuration into `config/deploy.js`

```javascript
ENV.firebase {
  app: '<your-firebase-app>',
  token: <your-firebase-token>
}
```

- Run the pipeline & activate a deploy

```bash
$ ember deploy --activate
```

or

```bash
$ ember deploy
$ ember activate <version>
```

## Installation
Run the following command in your terminal:

```bash
ember install ember-cli-deploy-notify-firebase
```

## ember-cli-deploy Hooks Implemented

For detailed information on what plugin hooks are and how they work, please refer to the [Plugin Documentation][1].

- `didActivate`

## Configuration Options

For detailed information on how configuration of plugins works, please refer to the [Plugin Documentation][1].

### app

The Firebase app to notify, the subdomain in https://<app>.firebaseio.com

*Default:* `null`

### token

A security token to authenticate with.

*Default:* `null`

### path

The path to update in Firebase.

*Default:* `'/release'`

### payload

The data to update in Firebase.

By default this will contain the revision key and a timestamp.

*Default:*

```json
{
  "revision": "<revisionKey>",
  "at": "<timestamp>"
}
```

### How do I activate a revision?

A user can activate a revision by either:

- Passing a command line argument to the `deploy` command:

```bash
$ ember deploy --activate=true
```

- Running the `deploy:activate` command:

```bash
$ ember deploy:activate <revision-key>
```

- Setting the `activateOnDeploy` flag in `deploy.js`

```javascript
ENV.pipeline {
  activateOnDeploy: true
}
```

## Prerequisites

The following properties are expected to be present on the deployment `context` object:

- `revisionData.revisionKey`    (provided by [ember-cli-deploy-revision-data][4])
- `commandLineArgs.revisionKey` (provided by [ember-cli-deploy][3])

## Running Tests

- `npm test`

[1]: http://ember-cli.github.io/ember-cli-deploy/plugins "Plugin Documentation"
[2]: https://github.com/ember-cli-deploy/ember-cli-deploy-build "ember-cli-deploy-build"
[3]: https://github.com/ember-cli/ember-cli-deploy "ember-cli-deploy"
[4]: https://github.com/ember-cli-deploy/ember-cli-deploy-revision-data "ember-cli-deploy-revision-data"