const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const Validators = require("./validators");

const adminSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            validate: Validators.validateUsername,
        },
        organization: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
        },
        password: {
            type: String,
            required: true,
        },
        displayname: String,
        email: {
            type: String,
            validate: Validators.validateEmail,
        },
    },
    { timestamps: true }
);

const hashPassword = async function () {
    const user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified("password")) return;

    user.password = await bcrypt.hash(user.password, 10);
};

adminSchema.pre("save", hashPassword);
adminSchema.pre("updateOne", hashPassword);

adminSchema.methods.checkPassword = function (candidatePassword) {
    return bcrypt.compareSync(candidatePassword, this.password);
};

module.exports = mongoose.model("Admin", adminSchema);
