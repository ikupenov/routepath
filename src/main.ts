import path from "path"
import fs from "fs/promises"
import ejs from "ejs"
import ts from "typescript"

// TODO: Extract as a pipe
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

      // TODO: Extract
      const pageProps = ["getServerSideProps", "getStaticProps"]
      const variableName = variableDeclaration?.name.getText(sourceFileAst)

      if (variableName != null && pageProps.includes(variableName)) {
        isPage = true
        return
      }
    }

    if (ts.isFunctionDeclaration(node)) {
      const pageProps = ["getServerSideProps", "getStaticProps"]
      const functionName = node?.name?.getText(sourceFileAst)

      if (functionName != null && pageProps.includes(functionName)) {
        isPage = true
        return
      }
    }
  })

  return isPage
}

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

const generateRoutepathFile = async () => {
  interface Node {
    path: string
    children: Node[]
  }

  // TODO: Generate tree from file paths
  const tree = {
    path: "/root" as const,
    children: [
      {
        path: "/root-first" as const,
        children: [
          {
            path: "/first-first",
            children: [],
          },
          {
            path: "/first-second",
            children: [],
          },
        ],
      },
      {
        path: "/root-second" as const,
        children: [],
      },
    ],
  }

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

// eslint-disable-next-line @typescript-eslint/no-floating-promises
;(async () => {
  await generateRoutepathFile()
})()
