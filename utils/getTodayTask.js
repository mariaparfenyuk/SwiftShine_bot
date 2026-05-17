export const getTodayTask = (tasks, cachedDay, cachedMonth) => {
  try {
    if (!tasks || !Array.isArray(tasks)) return null;

    const todayTask = tasks.find(task => task.day === cachedDay && task.month === cachedMonth);
    return todayTask || null;
  } catch (error) {
    console.error(error);
    return null;
  }
};