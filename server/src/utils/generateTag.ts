import { random } from './random';

const genTag = async (repository: any, field: string, resolve: (id: string) => void): Promise<any> => {
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += random(0, 9);
  }
  const check = await repository.findOne({ where: { [field]: id } });
  if (check) return genTag(repository, field, resolve);
  resolve(id);
};

export const getTag = async (repository: any, field: string) =>
  new Promise<string>((resolve: (id: string) => void) => {
    genTag(repository, field, resolve);
  });
