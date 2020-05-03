const { gql } = require('apollo-server-express');
const { importSchema } = require('graphql-import');
const resolvers = require('./gqlResolvers');

const typeDefs = importSchema('./src/admin/schema.graphql');

module.exports = {
    typeDefs,
    resolvers,
}