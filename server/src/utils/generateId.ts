import shortid from 'shortid';

const genId = async (
  repository: any,
  resolve: (id: string) => void
): Promise<any> => {
  const id: string = shortid.generate();
  const check = await repository.findOne({ where: { id } });
  if (check) return genId(repository, resolve);
  resolve(id);
};

export const getId = async (repository: any) =>
  new Promise<string>((resolve: (id: string) => void) => {
    genId(repository, resolve);
  });
