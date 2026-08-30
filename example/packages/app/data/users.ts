export interface User {
  id: string
  name: string
  role: string
  bio: string
}

export const users: User[] = [
  {
    id: '1',
    name: 'Ada Lovelace',
    role: 'Engineer',
    bio: 'Wrote the first published algorithm intended for a machine.',
  },
  {
    id: '2',
    name: 'Grace Hopper',
    role: 'Engineer',
    bio: 'Built the first compiler and popularized machine-independent languages.',
  },
  {
    id: '3',
    name: 'Katherine Johnson',
    role: 'Analyst',
    bio: 'Calculated orbital mechanics for the first crewed spaceflights.',
  },
  {
    id: '4',
    name: 'Margaret Hamilton',
    role: 'Director',
    bio: 'Led the team that wrote the Apollo guidance computer software.',
  },
]

export function findUser(id: string | undefined): User | undefined {
  return users.find((user) => user.id === id)
}
