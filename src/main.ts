import path from "path"
import fs from "fs/promises"
import ejs from "ejs"
import ts from "typescript"

import { Node, DeepRecord } from "@common"
import { trim } from "@util/string"

// TODO: Extract in a pipe
const NEXT_PAGE_EXPORTS: Readonly<string[]> = [
  "getServerSideProps",
  "getStaticProps",
]

// TODO: Extract in a pipe
const isNextPage = async (filePath: string) => {
  const fileContentBuffer = await fs.readFile(filePath)
  const fileContentText = fileContentBuffer.toString("utf8")

  const sourceFileAst = ts.createSourceFile(
    `${filePath}.rpd`,
    fileContentText,
    ts.ScriptTarget.Latest
  )

  if (sourceFileAst == null) {
    // TODO: Throw
    console.log("NO SOURCE FILE AT", filePath)
    return false
  }

  let isPage = false

  ts.forEachChild(sourceFileAst, (node) => {
    if (isPage) return

    if (!ts.canHaveModifiers(node)) return

    const modifiers = ts.getModifiers(node)
    const hasExportModifier =
      modifiers?.some((x) => x.kind === ts.SyntaxKind.ExportKeyword) ?? false

    if (!hasExportModifier) return

    if (ts.isVariableStatement(node)) {
      const variableDeclaration = node.declarationList?.declarations.find((x) =>
        ts.isVariableDeclaration(x)
      )

      const variableName = variableDeclaration?.name.getText(sourceFileAst)
      if (variableName != null && NEXT_PAGE_EXPORTS.includes(variableName)) {
        isPage = true
        return
      }
    }

    if (ts.isFunctionDeclaration(node)) {
      const functionName = node?.name?.getText(sourceFileAst)
      if (functionName != null && NEXT_PAGE_EXPORTS.includes(functionName)) {
        isPage = true
        return
      }
    }
  })

  return isPage
}

// TODO: Extract in a pipe
const getAllNextPagesPaths = async (dirPath: string) => {
  const nextPages: string[] = []

  const files = await fs.readdir(dirPath)

  for (const file of files) {
    const itemPath = path.join(dirPath, file)
    const itemStat = await fs.stat(itemPath)

    if (itemStat.isDirectory()) {
      const nestedNextPages = await getAllNextPagesPaths(itemPath)
      nextPages.push(...nestedNextPages)

      continue
    }

    const isPage = await isNextPage(itemPath)
    if (isPage) {
      nextPages.push(itemPath)
    }
  }

  return nextPages
}

// TODO: Extract in core
const createTreeFromPaths = (filePaths: string[]) => {
  const nodeRecord: DeepRecord = {}

  filePaths.forEach((filePath) => {
    const segments = trim(filePath, path.sep).split(path.sep)
    segments.reduce((accumulator, segment) => {
      accumulator[segment] ??= {}
      return accumulator[segment]
    }, nodeRecord)
  })

  // TODO: Remove file extension from "path"

  const gen = (nodeRecord: DeepRecord | {}) => {
    const nodeRecordKeys = Object.keys(nodeRecord)
    if (nodeRecordKeys.length === 0) return []

    return nodeRecordKeys.map(
      (nrk): Node => ({
        path: `/${path.parse(nrk).name}`,
        children: gen((nodeRecord as DeepRecord)[nrk]),
      })
    )
  }

  const [rootPath] = Object.keys(nodeRecord)
  if (rootPath == null) return null

  const rootNode: Node = {
    path: `/${path.parse(rootPath).name}`,
    children: gen(nodeRecord[rootPath]),
  }

  return rootNode
}

// TODO: Extract in core
const generateRoutepathFile = async (tree: Node) => {
  const generateRoutepathVariable = (node: Node) => {
    const addChildren = (innerNode: Node): string =>
      `.addChildRoute(createRoute({ path: "${innerNode.path}" })${
        innerNode.children?.length === 0
          ? ""
          : innerNode.children.map(addChildren).join("")
      })`

    const createRoute = () =>
      `createRoute({ path: "${node.path}" })${
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

// TODO: Extract in CLI
// eslint-disable-next-line @typescript-eslint/no-floating-promises
;(async () => {
  const nextPages = await getAllNextPagesPaths("src")
  const nextPagesPathTree = createTreeFromPaths(nextPages)

  console.log("TREE", JSON.stringify(nextPagesPathTree))

  if (nextPagesPathTree != null) {
    await generateRoutepathFile(nextPagesPathTree)
  }
})()
