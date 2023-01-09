import { generate } from "@cli"
import { getAllNextPagesPaths } from "@pipe/next"

// TODO: Extract in CLI
// eslint-disable-next-line @typescript-eslint/no-floating-promises
;(async () => {
  await generate((fp) => getAllNextPagesPaths(fp))
})()
