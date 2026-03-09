import bcrypt from "bcryptjs";

export const hashPassword = async (plainPassword: string): Promise<string> =>
  bcrypt.hash(plainPassword, 10);

export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => bcrypt.compare(plainPassword, hashedPassword);
