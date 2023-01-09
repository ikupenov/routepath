import { MaybePromise } from "@common"
import { generateRoutepathFile, generateTreeFromPaths } from "./generator"

export const generate = async (
  pipe: (filePath: string) => MaybePromise<string[]>
) => {
  const nextPages = await pipe("src")

  const nextPagesPathTree = generateTreeFromPaths(nextPages)

  if (nextPagesPathTree != null) {
    // TODO: Extract
    nextPagesPathTree.path = "/"

    await generateRoutepathFile(nextPagesPathTree)
  }
}
