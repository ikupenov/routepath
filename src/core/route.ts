import { Concat, TrimRight, StartsWith } from "@common"

type Path<S extends string> = S extends "/"
  ? S
  : TrimRight<StartsWith<S, "/">, "/">

class Route<TPath extends string, TRoot extends string = TPath> {
  path: Path<TPath>
  children: Route<Path<TPath>>[]

  constructor(path: Path<TPath>, children: Route<Path<TPath>>[] = []) {
    this.path = path
    this.children = children
  }

  addChildRoute<TChildPath extends string>(
    childRoute: Route<Path<TChildPath>>
  ): Route<TPath | Concat<TrimRight<TRoot, "/">, TChildPath>, TRoot> {
    return new Route<TPath | Concat<TrimRight<TRoot, "/">, TChildPath>, TRoot>(
      this.path,
      [
        ...this.children,
        childRoute as Route<Path<Concat<TrimRight<TRoot, "/">, TChildPath>>>,
      ]
    )
  }

  getRoute(path: TPath) {
    if (this.path === path) {
      return this
    }

    const queue = this.children.slice()

    while (queue.length > 0) {
      const childRoute = queue.shift()

      if (childRoute?.path === path) {
        return childRoute
      } else {
        if (childRoute?.children != null) {
          queue.push(
            ...(childRoute.children as Route<Path<TPath>, Path<TPath>>[])
          )
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
