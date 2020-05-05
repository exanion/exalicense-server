const jwt = require("jsonwebtoken");
const config = require("../../config");
const express = require("express");
const Models = require("../Models");
const { AuthenticationError } = require("apollo-server-express");

const router = express.Router();
const TOKEN_EXPIRES_IN = 3600;
const TOKEN_FORMAT_VERSION = 1;

router.post("/token", async (req, res) => {
    const grantTypeReq = req.body["grant_type"] || null;
    const username = req.body.username || null;
    const password = req.body.password || null;

    if (grantTypeReq !== "password") {
        return res.status(400).json({
            error: "invalid_request",
            error_description: "Only password grant is supported",
        });
    }

    const user = await Models.Admin.findOne({ username }).populate(
        "organization"
    );
    if (user && user.checkPassword(password)) {
        const token = jwt.sign(
            {
                version: TOKEN_FORMAT_VERSION,
                organization_id: user.organization._id,
                user_id: user.id,
                username: user.username,
            },
            config.privateKey,
            {
                algorithm: "RS256",
                expiresIn: TOKEN_EXPIRES_IN,
            }
        );
        return res.json({
            access_token: token,
            type: "bearer",
            expires_in: TOKEN_EXPIRES_IN,
        });
    } else {
        return res.status(401).json({ error: "access_denied" });
    }
});

const apolloAuthContext = async ({ req }) => {
    let token = req.headers.authorization || "";
    token = token.replace(/bearer /gi, "");

    try {
        token = jwt.verify(token, config.publicKey, {
            algorithms: ["RS256"],
        });
    } catch (err) {
        throw new AuthenticationError("Authentication required (token error)");
    }

    const user = await Models.Admin.findById(token.user_id || "").populate(
        "organization"
    );
    if (
        token.version != TOKEN_FORMAT_VERSION ||
        !user ||
        user._id != token.user_id ||
        user.organization._id != token.organization_id
    ) {
        throw new AuthenticationError("Authentication required (auth error)");
    }

    //reconstruct hostname
    const basepath =
        (req.get("X-Forwarded-Proto")
            ? req.get("X-Forwarded-Proto")
            : req.protocol) +
        "://" +
        (req.get("X-Forwarded-Host")
            ? req.get("X-Forwarded-Host")
            : req.get("Host")) +
        "/api";

    return { user, organization: user.organization, basepath };
};

module.exports = {
    authRouter: router,
    apolloAuthContext,
};
