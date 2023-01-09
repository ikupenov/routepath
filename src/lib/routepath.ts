import { createRoute } from "@core"

export const routepath = createRoute({ path: "/" }).addChildRoute(createRoute({ path: "/home" })).addChildRoute(createRoute({ path: "/legal" }).addChildRoute(createRoute({ path: "/cookies" })).addChildRoute(createRoute({ path: "/help" })))

export const l = routepath.getRoute

export type Routepath = typeof routepath
export type Route = Parameters<typeof l>["0"]
