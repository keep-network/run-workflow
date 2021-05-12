const core = require("@actions/core")
const { invoke } = require("./src/invoke.js")

async function run() {
  const environment = core.getInput("environment")
  const upstreamBuilds = core.getInput("upstream_builds")
  const ref = core.getInput("ref")

  try {
    await invoke(environment, upstreamBuilds, ref)
  } catch (err) {
    throw err
  }

  core.info(
    `dispatched run for environment: ${environment} with upstream builds: ${upstreamBuilds} and ref: ${ref}`
  )
}

run().catch(core.setFailed)
