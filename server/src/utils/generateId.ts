import shortid from 'shortid';

const genId = async (repository: any, field: string, resolve: (id: string) => void): Promise<any> => {
  const id: string = shortid.generate();
  const check = await repository.findOne({ where: { [field]: id } });
  if (check) return genId(repository, field, resolve);
  resolve(id);
};

export const getId = async (repository: any, field: string) =>
  new Promise<string>((resolve: (id: string) => void) => {
    genId(repository, field, resolve);
  });
