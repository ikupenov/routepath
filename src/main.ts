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

const articleRoute = rootRoute.getRoute("/articles/$slug")

console.log(JSON.stringify(articleRoute))
