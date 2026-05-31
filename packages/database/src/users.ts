import type { User } from "@prisma/client";
import { prisma } from "./client";

export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } });
}

export type CreateUserInput = {
  email: string;
  name?: string;
  image?: string;
  passwordHash?: string;
};

export async function createUser(data: CreateUserInput): Promise<User> {
  return prisma.user.create({ data });
}

export type UpdateUserInput = Partial<Pick<User, "name" | "image" | "emailVerified">>;

export async function updateUser(id: string, data: UpdateUserInput): Promise<User> {
  return prisma.user.update({ where: { id }, data });
}

export async function getUserWithMemberships(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: {
      memberships: {
        where: { acceptedAt: { not: null } },
        include: { workspace: true },
      },
    },
  });
}

export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
}
