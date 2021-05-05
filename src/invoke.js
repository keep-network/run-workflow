const core = require("@actions/core")
const { config, Module, validateUpstreamBuilds } = require("@keep-network/ci")

/**
 * @param {string} environment
 * @param {UpstreamBuilds} upstreamBuilds
 * @param {string} ref
 */
async function invoke(environment, upstreamBuilds, ref) {
  if (!upstreamBuilds) {
    const module = config.defaultModule

    core.info(
      `upstream builds not provided; invoking default module: ${module.id}`
    )

    try {
      await module.invoke(environment, upstreamBuilds, ref)
    } catch (err) {
      throw new Error(`failed to invoke default module: ${err.message}`)
    }
  } else {
    const { isValid, errors } = validateUpstreamBuilds(upstreamBuilds)

    if (!isValid) {
      throw new Error(`invalid upstream_builds: ${JSON.stringify(errors)}`)
    }

    upstreamBuilds = JSON.parse(upstreamBuilds)

    if (upstreamBuilds.length < 1) {
      throw new Error(
        `invalid length of upstream_builds provided: ${upstreamBuilds}`
      )
    }

    const latestBuild = upstreamBuilds.slice(-1)[0]

    try {
      await invokeDownstream(
        latestBuild.module,
        environment,
        upstreamBuilds,
        ref
      )
    } catch (err) {
      throw new Error(
        `failed to invoke downstream for ${latestBuild.module}: ${err.message}`
      )
    }
  }
}

/**
 * @param {string} moduleID
 * @param {string} environment
 * @param {UpstreamBuilds} upstreamBuilds
 * @param {string} ref
 */
async function invokeDownstream(
  moduleID,
  environment,
  upstreamBuilds,
  ref = "master"
) {
  const moduleConfig = config.getModuleConfig(moduleID)

  const { downstream } = moduleConfig
  if (!downstream) {
    core.info("no downstream modules defined; exiting")
    return
  }

  core.info(`invoking downstream builds for module ${moduleID}`)
  for (const downstreamModuleID of downstream) {
    const downstreamModule = new Module(downstreamModuleID)
    try {
      await downstreamModule.invoke(environment, upstreamBuilds, ref)
    } catch (err) {
      throw new Error(
        `failed to invoke downstream module ${downstreamModuleID}: ${err.message}`
      )
    }
  }
}

module.exports = { invoke }
