export const getTodayTask = () => {
  try {
    const filePath = path.join(__dirname, 'everydayTasks.json');
    const rawData = fs.readFileSync(filePath, 'utf-8');
    const tasks = JSON.parse(rawData);

    const now = new Date();
    const currentRealMonth = now.getMonth() + 1;
    let currentRealDay = now.getDate();

    const jsonMonth = (currentRealMonth % 2 !== 0) ? 1 : 2;

    if (currentRealDay > 30) {
      currentRealDay = 30;
    }

    const todayTask = tasks.find(task => task.day === currentRealDay && task.month === jsonMonth);
    return todayTask || null;
  } catch (error) {
    console.error(error);
    return null;
  }
}