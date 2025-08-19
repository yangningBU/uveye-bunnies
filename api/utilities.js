export const calculateHappinessAverage = (results) => {
  const happinessFoldLeft = (sum, bunny) => sum += bunny.happinessCount;
  const totalHappiness = results.reduce(happinessFoldLeft, 0);
  return totalHappiness / results.length;
};

export function getRandomInt(lower, upper) {
  const min = Math.ceil(lower);
  const max = Math.floor(upper);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
