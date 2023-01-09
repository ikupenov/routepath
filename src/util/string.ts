export const trim = (value: string, char: string) => {
  const escape = (value: string) =>
    // eslint-disable-next-line no-useless-escape
    value.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&")

  const escapedChar = escape(char)
  const regEx = new RegExp(
    "^[" + escapedChar + "]+|[" + escapedChar + "]+$",
    "g"
  )

  return value.replace(regEx, "")
}
