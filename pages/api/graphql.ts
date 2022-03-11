import { NextApiRequest, NextApiResponse } from "next";
import { ApolloServer, gql } from "apollo-server-micro";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "apollo-server-core";

const typesHello = gql`
  type Query {
    hello: String
    hello2(name: String): String
  }
`;

const resolversHello = {
  Query: {
    hello: () => "Hello world!",
    hello2: (_: any, { name }: any) => `Hello ${name}!`,
  },
};

type User = {
  id?: number;
  name?: string;
};

const users: User[] = [];
const typesCrudUsers = gql`
  type User {
    id: Int
    name: String
  }

  type Query {
    users: [User]
  }

  type Mutation {
    createUser(name: String): User
    updateUser(id: Int, name: String): User
    deleteUser(id: Int): User
  }
`;

const resolverCrud = {
  Query: {
    users: () => users,
  },
  Mutation: {
    createUser: (_: any, { name }: User, { auth }: any) => {
      console.log({ auth });
      const user = {
        id: users.length + 1,
        name,
      };
      users.push(user);
      return user;
    },
    updateUser: (_: any, { id, name }: User) => {
      const user = users.find((u) => u.id === id);
      if (user) {
        user.name = name;
      }
      return user;
    },
    deleteUser: (_: any, { id }: User) => {
      const user = users.find((u) => u.id === id);
      if (user) {
        users.splice(users.indexOf(user), 1);
      }
      return user;
    },
  },
};

const apolloServer = new ApolloServer({
  typeDefs: [typesHello, typesCrudUsers],
  resolvers: [resolversHello, resolverCrud],
  plugins: [ApolloServerPluginLandingPageGraphQLPlayground],
  context: ({ req }: { req: NextApiRequest }) => {
    const auth = req.headers.authorization || "";
    return { auth };
  },
});

const startServer = apolloServer.start();

export const config = { api: { bodyParser: false } };

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse
) {
  await startServer;
  await apolloServer.createHandler({
    path: "/api/graphql",
  })(request, response);
}
