import { Concat, TrimRight, StartsWith } from "@common"

type Path<S extends string> = S extends "/"
  ? S
  : TrimRight<StartsWith<S, "/">, "/">

class Route<TPath extends string, TRoot extends string = TPath> {
  path: Path<TPath>
  // TODO: Parent should not include children
  parent: Route<Path<TPath>> | null
  children?: Route<Path<TPath>>[]

  constructor(
    path: Path<TPath>,
    parent: Route<Path<TPath>> | null = null,
    children: Route<Path<TPath>>[] = []
  ) {
    this.path = path
    this.parent = parent
    this.children = children
  }

  addChildRoute<TChildPath extends string>(
    childRoute: Route<Path<TChildPath>>
  ): Route<TPath | Concat<TrimRight<TRoot, "/">, TChildPath>, TRoot> {
    const innerChildRoute = new Route(
      childRoute.path,
      // TODO: Fix type
      this as any,
      childRoute.children
    )

    return new Route<TPath | Concat<TrimRight<TRoot, "/">, TChildPath>, TRoot>(
      this.path,
      this.parent,
      [
        ...(this.children ?? []),
        innerChildRoute as Route<
          Path<Concat<TrimRight<TRoot, "/">, TChildPath>>
        >,
      ]
    )
  }

  getFullPath() {
    const parentPaths = (() => {
      const innerParentPaths: TPath[] = []

      let childParentRoute = this?.parent as Route<TPath, TPath>
      while (childParentRoute != null) {
        innerParentPaths.unshift(childParentRoute.path as TPath)
        childParentRoute = childParentRoute.parent as Route<TPath, TPath>
      }

      return innerParentPaths
    })()

    const fullPath = [...parentPaths, this.path].join("")

    return fullPath
  }

  getRoute(path: TPath) {
    if (this.path === path) {
      return this
    }

    const queue = this.children?.slice() as Route<TPath, TPath>[]

    while (queue?.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const childRoute = queue.shift()!

      if (childRoute.getFullPath() === path) {
        return childRoute
      } else {
        if (childRoute?.children != null) {
          queue.push(...(childRoute.children as Route<TPath, TPath>[]))
        }
      }
    }

    return null
  }
}

export interface CreateRouteOptions<TPath extends string> {
  path: TPath
}

export const createRoute = <TPath extends string>({
  path,
}: CreateRouteOptions<Path<TPath>>) => {
  return new Route<TPath>(path)
}
