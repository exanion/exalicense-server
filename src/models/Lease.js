const mongoose = require("mongoose");
const config = require("../../config");
const jwt = require("jsonwebtoken");

const leaseSchema = new mongoose.Schema(
    {
        leaseKey: {
            type: String,
            required: true,
            unique: true,
        },
        expiry: {
            type: Date,
            required: true,
            immutable: true,
        },
        license: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "License",
            required: true,
        },
        isReleased: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

leaseSchema.pre("validate", async function (next) {
    const lease = this;
    if (lease.leaseKey) return next();

    lease.leaseKey = jwt.sign(
        {
            lease: lease._id,
            license: lease.license,
            exp: Math.round(lease.expiry.getTime() / 1000),
        },
        config.privateKey,
        { algorithm: "RS256" }
    );

    return next();
});

module.exports = mongoose.model("Lease", leaseSchema);
