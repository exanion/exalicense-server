const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Validators = require("./validators");

const SALT_WORK_FACTOR = 10;

const organizationSchema = new mongoose.Schema(
    {
        displayname: String,
    },
    { timestamps: true }
);
organizationSchema.virtual("products", {
    ref: "Product",
    foreignField: "organization",
    localField: "_id",
});
organizationSchema.virtual("admins", {
    ref: "Admin",
    foreignField: "organization",
    localField: "_id",
});
organizationSchema.virtual("customers", {
    ref: "Customer",
    foreignField: "organization",
    localField: "_id",
});

module.exports = mongoose.model("Organization", organizationSchema);
