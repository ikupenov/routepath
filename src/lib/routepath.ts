import { r } from "@core"

export const routepath = r({ path: "/" })
  .addChildRoute(r({ path: "/home" }))
  .addChildRoute(
    r({ path: "/legal" })
      .addChildRoute(r({ path: "/cookies" }))
      .addChildRoute(r({ path: "/help" }))
  )

export const l = routepath.getRoute

export type Routepath = typeof routepath
export type Route = Parameters<typeof l>["0"]
