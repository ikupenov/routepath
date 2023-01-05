export type Concat<S1 extends string, S2 extends string> = `${S1}${S2}`

export type TrimLeft<
  V extends string,
  C extends string = " "
> = V extends `${C}${infer R}` ? TrimLeft<R> : V

export type TrimRight<
  V extends string,
  C extends string = " "
> = V extends `${infer R}${C}` ? TrimRight<R> : V

export type Trim<V extends string, C extends string> = TrimLeft<
  TrimRight<V, C>,
  C
>

export type StartsWith<
  S extends string,
  C extends string
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
> = S extends `${C}${infer R}` ? S : never
