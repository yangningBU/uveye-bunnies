export const calculateHappinessAverage = (results) => {
  return results.reduce((sum, bunny) => sum += bunny.happinessCount, 0) / results.length;
};

