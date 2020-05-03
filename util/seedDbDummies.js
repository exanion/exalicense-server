const mongoose = require("mongoose");
const config = require("../config");
const Models = require("../src/Models");

mongoose.connection.on(
    "error",
    console.error.bind(console, "database connection error:")
);
mongoose.connection.once("open", function () {
    console.log("Successfully established connection to database");

    (async () => {
        console.log("Seeding admin user..");
        const upsertAndNew = { upsert: true, new: true };
        const org = await Models.Organization.findOneAndUpdate(
            {
                _id: "56cb91bdc3464f14678934ca",
            },
            { displayname: "org1" },
            upsertAndNew
        );
        const user = await Models.Admin.findOneAndUpdate(
            {
                username: "admin",
            },
            {
                email: "kappelt.peter+user3@gmail.com",
                organization: org._id,
                password: "",
            },
            upsertAndNew
        );
        user.password = "passw0rd=";
        await user.save();

        const prod1 = await Models.Product.findOneAndUpdate(
            {
                name: "prod1",
            },
            {
                displayname: "Product 1",
                organization: org._id,
            },
            upsertAndNew
        );
        const prod2 = await Models.Product.findOneAndUpdate(
            {
                name: "prod2",
            },
            {
                displayname: "Product 2",
                organization: org._id,
            },
            upsertAndNew
        );
        const feature1 = await Models.Feature.findOneAndUpdate(
            {
                name: "p1_f1",
            },
            {
                product: prod1._id,
            },
            upsertAndNew
        );
        const feature2 = await Models.Feature.findOneAndUpdate(
            {
                name: "p1_f2",
            },
            {
                product: prod1._id,
            },
            upsertAndNew
        );
        const feature3 = await Models.Feature.findOneAndUpdate(
            {
                name: "p2_f1",
            },
            {
                product: prod2._id,
            },
            upsertAndNew
        );
        const feature4 = await Models.Feature.findOneAndUpdate(
            {
                name: "p2_f2",
            },
            {
                product: prod2._id,
            },
            upsertAndNew
        );

        const customer = await Models.Customer.findOneAndUpdate(
            {
                displayname: "customer1",
                organization: org._id,
            },
            { comment: "comment" },
            upsertAndNew
        );

        const lic1 = await Models.License.findOneAndUpdate(
            {
                features: [feature2._id],
            },
            {
                customer: customer._id,
                licenseKeys: ["lic1", "lic1_alt"],
            },
            upsertAndNew
        );
        const lic2 = await Models.License.findOneAndUpdate(
            {
                features: [feature1._id, feature3._id, feature4._id],
            },
            {
                customer: customer._id,
                licenseKeys: ["lic2", "lic2_alt"],
            },
            upsertAndNew
        );

        const lease1 = await Models.Lease.findOneAndUpdate(
            {
                leaseKey: "lease1",
            },
            {
                license: lic1._id,
            },
            upsertAndNew
        );
        console.log("Done");
        process.exit(0);
    })();
});
mongoose.connect(config.dbConnection, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    useFindAndModify: false,
});
