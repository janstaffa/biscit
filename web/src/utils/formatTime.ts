export const formatTime = (time: string) => {
  let date = new Date(time);
  if (Number.isNaN(Date.parse(time))) {
    date = new Date(parseInt(time));
  }
  const today = new Date();

  if (date.getDate() !== today.getDate()) {
    if (date.getFullYear() !== today.getFullYear()) {
      return `${date.getDate()}.${date.getMonth()}. ${date.getFullYear()}`;
    }
    return `${date.getDate()}.${date.getMonth()}. ${('00' + date.getHours()).slice(-2)}:${(
      '00' + date.getMinutes()
    ).slice(-2)}`;
  }
  return `${('00' + date.getHours()).slice(-2)}:${('00' + date.getMinutes()).slice(-2)}`;
};
