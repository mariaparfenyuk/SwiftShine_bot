function updateBotDateCache() {
  const now = new Date();
  const currentRealMonth = now.getMonth() + 1;
  let currentRealDay = now.getDate();

  const jsonMonth = (currentRealMonth % 2 !== 0) ? 1 : 2;
  if (currentRealDay > 30) {
    currentRealDay = 30;
  }

  let weekCount = 1;
  for (let i = 1; i < now.getDate(); i++) {
    const checkDate = new Date(now.getFullYear(), now.getMonth(), i);
    if (checkDate.getDay() === 1) {
      weekCount++;
    }
  }
  const flyLadyWeek = weekCount > 5 ? 5 : weekCount;

  console.log(`[КЭШ ДАТЫ] Данные успешно пересчитаны на сегодня!`);

  return {
    day: currentRealDay,
    month: jsonMonth,
    flyLadyWeek: flyLadyWeek
  };
}

module.exports = { updateBotDateCache };