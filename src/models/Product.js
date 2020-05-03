const mongoose = require("mongoose");
const Validators = require("./validators");

const productSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            validate: Validators.validateProductName,
            required: true,
        },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        displayname: String,
    },
    {
        timestamps: true,
    }
);
productSchema.virtual("features", {
    ref: "Feature",
    foreignField: "product",
    localField: "_id",
});

module.exports = mongoose.model("Product", productSchema);
