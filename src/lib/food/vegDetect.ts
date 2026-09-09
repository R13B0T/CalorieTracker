const VEG_FRUIT =
  /\b(apple|banana|orange|mandarin|pear|grape|berry|berries|strawberr|blueberr|raspberr|mango|pineapple|melon|watermelon|kiwi|peach|plum|apricot|cherry|cherries|avocado|tomato|cucumber|lettuce|spinach|kale|rocket|salad|broccoli|cauliflower|carrot|capsicum|pepper|onion|zucchini|courgette|pumpkin|sweet potato|potato|corn|peas|beans|bean|lentil|chickpea|mushroom|celery|cabbage|bok choy|asparagus|beetroot|eggplant|aubergine|leek|garlic|ginger|herbs|coleslaw|veg|vegetable|fruit)\b/i;

export function isVegOrFruit(name: string): boolean {
  return VEG_FRUIT.test(name);
}
