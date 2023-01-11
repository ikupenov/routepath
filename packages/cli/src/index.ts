import yargs from "yargs"

yargs.usage("\nUsage: $0 [cmd] <args>").alias("h", "help")

yargs.command({
  command: "add",
  describe: "Add a new note",
  handler: () => {
    console.log("Adding a new note")
  },
})

yargs.command({
  command: "remove",
  describe: "Remove a Note",
  handler: () => {
    console.log("removing note")
  },
})

yargs.parse()

// yargs
//   .usage("HELLO FROM CLI")
//   .option("l", {
//     alias: "language",
//     describe: "Translate to language",
//     type: "string",
//     demandOption: false,
//   })
//   .option("s", {
//     alias: "sentence",
//     describe: "Sentence to be translated",
//     type: "string",
//     demandOption: false,
//   })
//   .help(true)
//   .parse()
