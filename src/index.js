const fs = require("fs");
const config = require("../config");
config.privateKey = fs.readFileSync(config.privateKeyFile);
config.publicKey = fs.readFileSync(config.publicKeyFile);

const adminAuth = require("./admin/adminAuth");
const LicensingEndpoints = require("./licensing/LicensingEndpoints");
const express = require("express");
const mongoose = require("mongoose");
const { ApolloServer, gql } = require("apollo-server-express");
const { typeDefs, resolvers } = require("./admin/gqlSchema");

/**
 * Express HTTP server
 * Routes and Middlewares
 */
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/admin/auth", adminAuth.authRouter);
app.use("/licensing", LicensingEndpoints);

/**
 * GraphQL Server
 */
const adminServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: adminAuth.apolloAuthContext,
});
adminServer.applyMiddleware({ app, path: "/admin/graphql" });

/**
 * Express Setup
 */
app.listen(config.httpPort, () => {
    console.log(`HTTP server running at port ${config.httpPort}`);
    console.log(`Admin ready at ${adminServer.graphqlPath}`);
});

/**
 * MongoDB connection
 */
mongoose.connection.on(
    "error",
    console.error.bind(console, "database connection error:")
);
mongoose.connection.once("open", () => {
    console.log("Successfully established connection to database");
});
mongoose.connect(config.dbConnection, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
});
