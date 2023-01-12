import yargs, { ArgumentsCamelCase } from "yargs"

import { generateRoutepathFile, generateTreeFromPaths } from "./generator"

yargs.usage("\nUsage: $0 [cmd] <args>").alias("h", "help")

yargs.command({
  command: "generate",
  aliases: ["gen"],
  describe: "Generate routepath",
  builder: (yargs) =>
    yargs
      .option("pipe", { type: "string", describe: "Specify which pipe to use" })
      .option("source", {
        type: "string",
        alias: "src",
        describe: "Specify the folder for which you want to generate routepath",
      })
      .option("out", {
        type: "string",
        describe:
          "Specify the folder where you'd like to generate the routepath",
      })
      .demandOption(["pipe", "source", "out"]),
  handler: async ({
    pipe,
    source,
    out,
  }: ArgumentsCamelCase<{ pipe: string; source: string; out: string }>) => {
    const module = await import(pipe)
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    const getPagePaths = module?.getPagePaths || module?.default?.getPagePaths

    if (getPagePaths == null) {
      throw Error(
        "The specified pipe couldn't be resolved. Make sure the file specified exists and exports a 'getPagePaths' function."
      )
    }

    if (typeof getPagePaths !== "function") {
      throw Error(
        "The pipe was found but it was not of the correct type. Make sure 'getPagePaths' is a function."
      )
    }

    const pagePaths = (await getPagePaths(source)) as string[]
    const pagePathsTree = generateTreeFromPaths(pagePaths)

    if (pagePathsTree != null) {
      await generateRoutepathFile(pagePathsTree, out)
    }
  },
})

// eslint-disable-next-line @typescript-eslint/no-floating-promises
;(async () => {
  await yargs.demandCommand().parse()
})()
