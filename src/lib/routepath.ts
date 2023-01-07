import { createRoute } from "@core"

export const routepath = createRoute({ path: "/root" }).addChildRoute(createRoute({ path: "/root-first" }).addChildRoute(createRoute({ path: "/first-first" })).addChildRoute(createRoute({ path: "/first-second" }))).addChildRoute(createRoute({ path: "/root-second" }))

export const l = routepath.getRoute

export type Routepath = typeof routepath
export type Route = Parameters<typeof l>["0"]
