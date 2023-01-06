/*
  const articlesRoute = createRoute<{ queryParams: { query: string } }>({ path: "/articles" })
    .addChildRoute<{ pathParams: { $slug: string | number } }>({ path: "/$slug" })

  const rootRoute = createRoute({ path: "/" })
    .addChildRoute(articlesRoute)
    .addChildRoute({ path: "/help" })


  const routepath = generateRoutepath(rootRoute)'

  --------------------------------------------------------------

  routepath("/articles/$slug", {
    pathParams: { slug: "article-1" }
  })

  routepath("/articles", {
    searchParams: { query: "crypto" }
  })

*/

import path from "path"
import fs from "fs/promises"
import ejs from "ejs"
import ts from "typescript"

import { createRoute } from "@core"

const testRoute = createRoute({ path: "/test" })

const testRoute33 = createRoute({ path: "/test" })
  .addChildRoute(
    createRoute({
      path: "/firstInner",
    }).addChildRoute(createRoute({ path: "/firstInnerInner" }))
  )
  .addChildRoute(
    createRoute({ path: "/secondInner" }).addChildRoute(
      createRoute({ path: "/secondInnerInner" })
    )
  )

const testRoute2 = createRoute({ path: "/asdasd" })
  .addChildRoute(
    createRoute({ path: "/baba" }).addChildRoute(createRoute({ path: "/simi" }))
  )
  .addChildRoute(createRoute({ path: "/gosho" }))

const rootRoute = createRoute({ path: "/" })
  .addChildRoute(
    createRoute({ path: "/articles" }).addChildRoute(
      createRoute({ path: "/$slug" }).addChildRoute(
        createRoute({ path: "/details" })
      )
    )
  )
  .addChildRoute(
    createRoute({ path: "/legal" })
      .addChildRoute(createRoute({ path: "/gdpr" }))
      .addChildRoute(createRoute({ path: "/cookies" }))
  )
  .addChildRoute(testRoute33)
  .addChildRoute(testRoute2)

// TODO: Makes slugs required
const articleRoute = rootRoute.getRoute("/articles/$slug")

// console.log(JSON.stringify(articleRoute))

// console.log(articleRoute?.getFullPath())

// ---------------------------------------------------------------------------------------------

// TODO: Generate file structure tree

// TODO: Dynamically generate route file

const home = path.basename("./pages/home.ts")

const realRootRoute = createRoute({ path: "/" }).addChildRoute(
  createRoute({ path: home })
)

// const template = ejs.render(`asdasd <%=bag.gosho%>`, {
//   bag: { gosho: "HELLO FROM OUTSIDE" },
// })

// TODO: Fix file path for build
const template = ejs.renderFile(path.join("./src/cli/templates/route.ejs"), {
  bag: { gosho: "HELLO FROM OUTSIDE" },
})

// console.log("TEMPLATE", template)

const readAll = async (path: string) => {
  const files = await fs.readdir(path)

  console.log("FILES ARE", files)
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
;(async () => {
  await readAll(path.join(__dirname, "pages"))
})()

// eslint-disable-next-line @typescript-eslint/no-floating-promises
;(async () => {
  const filePath = path.join(__dirname, "pages/home.tss")
  const fileContentBuffer = await fs.readFile(filePath)
  const fileContentText = fileContentBuffer.toString("utf8")

  const sourceFileAst = ts.createSourceFile(
    `${filePath}.rpd`,
    fileContentText,
    ts.ScriptTarget.Latest
  )

  if (sourceFileAst == null) {
    console.log("NO SOURCE FILE AT", filePath)
  } else {
    ts.forEachChild(sourceFileAst, (node) => {
      if (!ts.canHaveModifiers(node)) return

      const modifiers = ts.getModifiers(node)
      const hasExportModifier =
        modifiers?.some((x) => x.kind === ts.SyntaxKind.ExportKeyword) ?? false

      if (!hasExportModifier) return

      if (ts.isVariableStatement(node)) {
        const variableDeclaration = node.declarationList?.declarations.find(
          (x) => ts.isVariableDeclaration(x)
        )

        // TODO: Extract
        const pageProps = ["getServerSideProps", "getStaticProps"]
        const variableName = variableDeclaration?.name.getText(sourceFileAst)

        if (variableName != null && pageProps.includes(variableName)) {
          console.log("I AM A PAGE")
        }
      }

      if (ts.isFunctionDeclaration(node)) {
        const pageProps = ["getServerSideProps", "getStaticProps"]
        const functionName = node?.name?.getText(sourceFileAst)

        if (functionName != null && pageProps.includes(functionName)) {
          console.log("I AM A PAGE")
        }
      }
    })
  }
})()
