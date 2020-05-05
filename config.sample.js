module.exports = {
    /** HTTP Port for the API to listen on */
    httpPort: process.env.httpPort || 3040,
    /** mongoose db connection string with method, port, auth, ... */
    dbConnection:
        process.env.dbConnection || "mongodb://localhost:27017/exalictest",
    /** private key file for signing license leases - use util/createKeyPair.sh */
    privateKeyFile: process.env.privateKeyFile || "./keys/demo.key",
    /** public key file for signing license leases */
    publicKeyFile: process.env.publicKeyFile || "./keys/demo.pem",
};
