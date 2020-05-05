const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
    {
        displayname: {
            type: String,
            required: true,
        },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true
        },
        contactName: String,
        contactMail: String,
        contactPhone: String,
        comment: String,
    },
    { timestamps: true }
);
customerSchema.virtual("licenses", {
    ref: "License",
    foreignField: "customer",
    localField: "_id",
});

module.exports = mongoose.model("Customer", customerSchema);
