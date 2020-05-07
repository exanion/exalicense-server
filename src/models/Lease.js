const mongoose = require("mongoose");
const config = require("../../config");
const jwt = require("jsonwebtoken");
const {
    reverseFeatureProductObject,
} = require("../reverseFeatureProductObject");

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
            //immutable: true,
            //Problem: if license get's populated with leases, the leases won't contain the immutable field. Maybe open bug?
        },
        clientId: String,
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
leaseSchema.virtual("isValid").get(function () {
    return !this.isReleased && (!this.expiry || this.expiry > new Date());
});

leaseSchema.pre("validate", async function (next) {
    const lease = this;
    if (lease.leaseKey) return next();

    if (!lease.expiry) {
        lease.expiry = new Date(Date.now() + 30 * 60 * 1000);
    }

    const license = await require("../Models")
        .License.findById(lease.license)
        .populate({ path: "features", populate: "product" });
    let validFor;
    if(license){
        validFor = reverseFeatureProductObject(license.features || [], false);
    }

    lease.leaseKey = jwt.sign(
        {
            lease: lease._id,
            license: lease.license,
            validFor,
            exp: Math.round(lease.expiry.getTime() / 1000),
        },
        config.privateKey,
        { algorithm: "RS256" }
    );

    return next();
});

module.exports = mongoose.model("Lease", leaseSchema);
