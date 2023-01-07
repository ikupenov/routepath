import { createRoute } from "@core"

export const routepath = createRoute({ path: "/src" }).addChildRoute(createRoute({ path: "/pages" }).addChildRoute(createRoute({ path: "/home.tss" })).addChildRoute(createRoute({ path: "/legal" }).addChildRoute(createRoute({ path: "/cookies.tss" })).addChildRoute(createRoute({ path: "/help.tss" }))))

export const l = routepath.getRoute

export type Routepath = typeof routepath
export type Route = Parameters<typeof l>["0"]
