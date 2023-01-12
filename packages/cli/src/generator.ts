import path from "path"
import fs from "fs/promises"
import ejs from "ejs"

import { Node, DeepRecord, trim } from "@routepath/common"

export const generateTreeFromPaths = (filePaths: string[]) => {
  const nodeRecord: DeepRecord = {}

  filePaths.forEach((filePath) => {
    const segments = trim(filePath, "/").split("/")
    segments.reduce((accumulator, segment) => {
      accumulator[segment] ??= {}
      return accumulator[segment]
    }, nodeRecord)
  })

  const getChildren = (nodeRecord: DeepRecord | {}) => {
    const nodeRecordKeys = Object.keys(nodeRecord)
    if (nodeRecordKeys.length === 0) return []

    return nodeRecordKeys.map(
      (nrk): Node => ({
        path: `/${path.parse(nrk).name}`,
        children: getChildren((nodeRecord as DeepRecord)[nrk]),
      })
    )
  }

  const [rootPath] = Object.keys(nodeRecord)
  if (rootPath == null) return null

  const rootNode: Node = {
    path: `/${path.parse(rootPath).name}`,
    children: getChildren(nodeRecord[rootPath]),
  }

  return rootNode
}

export const generateRoutepathFile = async (tree: Node, outPath: string) => {
  const generateRoutepathVariable = (node: Node) => {
    const addChildren = (innerNode: Node): string =>
      `.addChildRoute(r({ path: "${innerNode.path}" })${
        innerNode.children?.length === 0
          ? ""
          : innerNode.children.map(addChildren).join("")
      })`

    const createRoute = () =>
      `r({ path: "${node.path}" })${
        node.children?.length === 0
          ? ""
          : node.children.map(addChildren).join("")
      }`

    return createRoute()
  }

  const routepathVariable = generateRoutepathVariable(tree)

  const routepathTemplatePath = path.join(
    process.cwd(),
    "build",
    "static",
    "templates",
    "routepath.ejs"
  )

  const routepathTemplate = await ejs.renderFile(
    routepathTemplatePath,
    {
      routepath: routepathVariable,
    },
    {
      beautify: true,
    }
  )

  try {
    const libDirStat = await fs.stat(outPath)
    if (!libDirStat.isDirectory()) {
      await fs.mkdir(outPath)
    }
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      await fs.mkdir(outPath)
    }
  }

  await fs.writeFile(path.join(outPath, "routepath.ts"), routepathTemplate, {
    flag: "w",
  })
}
