import { User } from '../entities/User';

export const pickUser = (user: User) => {
  return (({
    id,
    username,
    status,
    bio,
    threads,
    email,
    profile_pictureId,
    profile_picture,
    updatedAt,
    createdAt
  }: User) => ({
    id,
    username,
    status,
    bio,
    threads,
    email,
    profile_pictureId,
    profile_picture,
    updatedAt,
    createdAt
  }))(user);
};
