export const formatTime = (time: string) => {
  const date = new Date(time);
  const today = new Date();

  if (date.getDate() !== today.getDate()) {
    if (date.getFullYear() !== today.getFullYear()) {
      return `${date.getDate()}.${date.getMonth()}. ${date.getFullYear()}`;
    }
    return `${date.getDate()}.${date.getMonth()}. ${(
      '00' + date.getHours()
    ).slice(-2)}:${('00' + date.getMinutes()).slice(-2)}`;
  }
  return `${('00' + date.getHours()).slice(-2)}:${(
    '00' + date.getMinutes()
  ).slice(-2)}`;
};