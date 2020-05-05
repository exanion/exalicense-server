const mongoose = require("mongoose");
const Validators = require("./validators");

const featureSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            validate: Validators.validateFeatureName,
            required: true,
        },
        displayname: String,
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
        },
    },
    {
        timestamps: true,
    }
);
featureSchema.virtual("licenses", {
    ref: "License",
    foreignField: "features",
    localField: "_id",
});

module.exports = mongoose.model("Feature", featureSchema);
