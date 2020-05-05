const mongoose = require("mongoose");

const licenseSchema = new mongoose.Schema(
    {
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "Customer",
        },
        features: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Feature",
            },
        ],
        leaseCountLimit: Number,
        expiry: Date,
        licenseKeys: [String],
        comment: String,
    },
    {
        timestamps: true,
    }
);
licenseSchema.virtual("leases", {
    ref: "Lease",
    foreignField: "license",
    localField: "_id",
});
licenseSchema.virtual("isExpired").get(function () {
    return (this.expiry && this.expiry < new Date()) ? true:false;
});

module.exports = mongoose.model("License", licenseSchema);
