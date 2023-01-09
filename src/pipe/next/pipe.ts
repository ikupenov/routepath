import path from "path"
import fs from "fs/promises"
import ts from "typescript"

const NEXT_PAGE_EXPORTS: Readonly<string[]> = [
  "getServerSideProps",
  "getStaticProps",
]

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

// TODO: Make abstract
export const getAllNextPagesPaths = async (dirPath: string) => {
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
      // TODO: Replace --in path with __pages__
      const plainItemPath = itemPath.replace(
        path.join("src", "pages"),
        "__pages__"
      )

      nextPages.push(plainItemPath)
    }
  }

  return nextPages
}
