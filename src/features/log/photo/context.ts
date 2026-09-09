export function buildPhotoContext(
  ingredients: string[],
  trailingIngredient: string,
  note: string,
): string {
  const suppliedIngredients = [...ingredients, trailingIngredient]
    .map((name) => name.trim())
    .filter(Boolean)
    .filter(
      (name, index, all) =>
        all.findIndex((candidate) => candidate.toLowerCase() === name.toLowerCase()) === index,
    );

  return [
    suppliedIngredients.length
      ? `Confirmed ingredients from the user: ${suppliedIngredients.join(', ')}. Include each of these in the estimate even if hidden or hard to see.`
      : '',
    note.trim() ? `Additional context: ${note.trim()}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}
