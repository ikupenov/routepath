import path from "path"
import fs from "fs/promises"
import ejs from "ejs"

import { Node, DeepRecord } from "@common"
import { trim } from "@common/util/string"

export const generateTreeFromPaths = (filePaths: string[]) => {
  const nodeRecord: DeepRecord = {}

  filePaths.forEach((filePath) => {
    const segments = trim(filePath, path.sep).split(path.sep)
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

export const generateRoutepathFile = async (tree: Node) => {
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

  const template = await ejs.renderFile(
    path.join("src/cli/templates", "route.ejs"),
    {
      routepath: routepathVariable,
    },
    {
      beautify: true,
    }
  )

  const libDirPath = "src/lib"

  try {
    const libDirStat = await fs.stat(libDirPath)
    if (!libDirStat.isDirectory()) {
      await fs.mkdir(libDirPath)
    }
  } catch (error: any) {
    if (error?.code === "ENOENT") {
      await fs.mkdir(libDirPath)
    }
  }

  await fs.writeFile(path.join(libDirPath, "routepath.ts"), template, {
    flag: "w",
  })
}
