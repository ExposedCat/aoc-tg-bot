export const formatItem = (
  item: string | number,
  maxLength: number,
  brackets = false,
  convert = true
) => {
  const value = item !== '' ? (brackets ? `(${item})` : item.toString()) : ''
  return `${value}${' '.repeat(
    (convert ? maxLength.toString().length : maxLength) - value.length
  )}`
}
