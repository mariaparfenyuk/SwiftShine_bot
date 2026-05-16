export const getCurrentDate = () => {
  const now = new Date();
  return {
    day: now.getDate(),
    month: now.getMonth() + 1
  };
}