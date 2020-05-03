const Models = require("../Models");
const {
    ForbiddenError,
    UserInputError,
    ApolloError,
} = require("apollo-server-express");

module.exports = {
    async organizationSetName(parent, { input }, context, info) {
        const org = await Models.Organization.findById(
            context.organization._id
        );
        if (!org) {
            throw new ApolloError("internal inconsistency");
        }
        org.displayname = input.displayname || null;
        await org.save();

        return { success: true, organization: org };
    },
    async adminCreate(parent, { input }, context, info) {
        const admin = new Models.Admin({
            username: input.username,
            organization: context.organization._id,
        });
        if (input.displayname) admin.displayname = input.displayname;
        if (input.password) admin.password = input.password;
        if (input.email) admin.email = input.email;
        await admin.save();

        return { success: true, admin };
    },
    async adminUpdate(parent, { input }, context, info) {
        const admin = await Models.Admin.findOne({
            _id: input.id,
            organization: context.organization._id,
        });
        if (!admin) throw new UserInputError("Admin not found");

        if (input.username) admin.username = input.username;
        if (input.displayname) admin.displayname = input.displayname;
        if (input.email) admin.email = input.email;
        await admin.save();

        return { success: true, admin };
    },
    async adminDelete(parent, { input }, context, info) {
        if (input.id === context.user._id)
            throw new UserInputError("Cannot delete self!");
        const admin = await Models.Admin.findOne({
            _id: input.id,
            organization: context.organization._id,
        });
        if (!admin) throw new UserInputError("Admin not found");
        await admin.remove();
        return { success: true };
    },
    async setOwnPassword(parent, { input }, context, info) {
        const admin = await Models.Admin.findById(context.user._id);
        if (!admin) throw new UserInputError("Auth invalid");

        if (input.newPassword) admin.password = input.newPassword;
        await admin.save();
        return { success: true, admin };
    },
    async customerCreate(parent, { input }, context, info) {
        const customer = new Models.Customer({
            username: input.username,
            organization: context.organization._id,
        });
        if (input.displayname) customer.displayname = input.displayname;
        if (input.contactName) customer.contactName = input.contactName;
        if (input.contactMail) customer.contactMail = input.contactMail;
        if (input.contactPhone) customer.contactPhone = input.contactPhone;
        if (input.comment) customer.comment = input.comment;
        await customer.save();

        return { success: true, customer };
    },
    async customerUpdate(parent, { input }, context, info) {
        const customer = await Models.Customer.findOne({
            _id: input.id,
            organization: context.organization._id,
        });
        if (!customer) throw new UserInputError("Customer not found");

        if (input.displayname) customer.displayname = input.displayname;
        if (input.contactName) customer.contactName = input.contactName;
        if (input.contactMail) customer.contactMail = input.contactMail;
        if (input.contactPhone) customer.contactPhone = input.contactPhone;
        if (input.comment) customer.comment = input.comment;
        await customer.save();

        return { success: true, customer };
    },
    async customerDelete(parent, { input }, context, info) {
        const customer = await Models.Customer.findOne({
            _id: input.id,
            organization: context.organization._id,
        }).populate("licenses");
        if (!customer) throw new UserInputError("Customer not found");
        if (customer.licenses && customer.licenses.length)
            return {
                success: false,
                message:
                    "Can't delete customer since there are attached licenses left!",
            };
        await customer.remove();
        return { success: true };
    },
    async productCreate(parent, { input }, context, info) {
        const product = new Models.Product({
            name: input.name,
            organization: context.organization._id,
        });
        if (input.displayname) product.displayname = input.displayname;
        await product.save();

        return { success: true, product };
    },
    async productUpdate(parent, { input }, context, info) {
        const product = await Models.Product.findOne({
            _id: input.id,
            organization: context.organization._id,
        });
        if (!product) throw new UserInputError("Product not found");

        if (input.name) product.name = input.name;
        if (input.displayname) product.displayname = input.displayname;
        await product.save();

        return { success: true, product };
    },
    async productDelete(parent, { input }, context, info) {
        const product = await Models.Product.findOne({
            _id: input.id,
            organization: context.organization._id,
        }).populate("features");
        if (!product) throw new UserInputError("Customer not found");
        if (product.features && product.features.length)
            return {
                success: false,
                message:
                    "Can't delete product since there are features attached!",
            };
        await product.remove();
        return { success: true };
    },
    async featureCreate(parent, { input }, context, info) {
        const product = await Models.Product.findOne({
            _id: input.product,
            organization: context.organization._id,
        });
        if (!product) throw new UserInputError("Given product wasn't found");

        const feature = new Models.Feature({
            name: input.name,
            product: product._id,
        });
        if (input.displayname) feature.displayname = input.displayname;
        await feature.save();

        return { success: true, feature };
    },
    async featureUpdate(parent, { input }, context, info) {
        const feature = await Models.Feature.findOne({
            _id: input.id,
        }).populate("product");
        if (
            !feature ||
            !context.organization._id.equals(
                (feature.product || {}).organization
            )
        )
            throw new UserInputError("Feature not found");

        if (input.name) feature.name = input.name;
        if (input.displayname) feature.displayname = input.displayname;
        await feature.save();

        return { success: true, feature };
    },
    async featureDelete(parent, { input }, context, info) {
        const feature = await Models.Feature.findOne({
            _id: input.id,
        })
            .populate("product")
            .populate("licenses");
        if (
            !feature ||
            !context.organization._id.equals(
                (feature.product || {}).organization
            )
        )
            throw new UserInputError("Feature not found");

        if (feature.licenses && feature.licenses.length)
            return {
                success: false,
                message:
                    "Can't delete feature since there are licenses attached!",
            };
        await feature.remove();
        return { success: true };
    },
    async leaseCreate(parent, { input }, context, info) {
        const license = await Models.License.findById(input.license).populate(
            "customer"
        );
        
        if (
            !license ||
            !context.organization._id.equals(
                (license.customer || {}).organization
            )
        )
            throw new UserInputError("Given license wasn't found");

        const defaultExpiry = () => {
            return new Date(Date.now() + 60 * 60 * 1000);
        };

        const lease = new Models.Lease({
            license: license._id,
            expiry: input.expiry ? input.expiry : defaultExpiry(),
        });
        if (input.expiry) lease.expiry = input.expiry;
        await lease.save();

        return { success: true, lease };
    },
    async leaseSetReleased(parent, { input }, context, info) {
        const lease = await Models.Lease.findOne({
            _id: input.id,
        }).populate({
            path: "license",
            populate: {
                path: "customer",
            },
        });

        if (
            !lease ||
            !context.organization._id.equals(
                (((lease || {}).license || {}).customer || {}).organization
            )
        )
            throw new UserInputError("Lease not found");

        if (isReleased in input)
            lease.isReleased = input.isReleased ? true : false;
        await lease.save();

        return { success: true, lease };
    },
    async licenseCreate(parent, { input }, context, info) {
        const customer = await Models.Customer.findOne({
            _id: input.customer,
            organization: context.organization._id,
        });
        if (!customer) throw new UserInputError("Given customer wasn't found");

        const license = new Models.License({
            customer: customer._id,
        });

        if (input.features && input.features.isArray()) {
            let features = input.features;
            features = await Promise.all(
                features.map(async (id) => {
                    const feature = await Models.Feature.findById(id).populate(
                        "product"
                    );
                    if (
                        !feature ||
                        (feature.product || {}).organization !==
                            context.organization._id
                    ) {
                        throw new UserInputError(
                            `Given feature with id ${id} does not exist!`
                        );
                    }
                    return feature;
                })
            );

            license.features = features.map((k) => k._id);
        }
        if (input.leaseCountLimit)
            license.leaseCountLimit = input.leaseCountLimit;
        if (input.expiry) license.expiry = input.expiry;
        if (input.licenseKeys)
            license.licenseKey = input.licenseKeys.map((k) => k.toString());
        if (input.comment) license.comment = input.comment;
        await license.save();

        return { success: true, license };
    },
    async licenseUpdate(parent, { input }, context, info) {
        const license = await Models.License.findOne({
            _id: input.id,
        }).populate("customer");
        if (
            !license ||
            !context.organization._id.equals(
                (license.customer || {}).organization
            )
        )
            throw new UserInputError("License not found");

        if (input.features && input.features.isArray()) {
            let features = input.features;
            features = await Promise.all(
                features.map(async (id) => {
                    const feature = await Models.Feature.findById(id).populate(
                        "product"
                    );
                    if (
                        !feature ||
                        !context.organization._id.equals(
                            (feature.product || {}).organization
                        )
                    ) {
                        throw new UserInputError(
                            `Given feature with id ${id} does not exist!`
                        );
                    }
                    return feature;
                })
            );

            license.features = features.map((k) => k._id);
        }
        if (input.leaseCountLimit)
            license.leaseCountLimit = input.leaseCountLimit;
        if (input.expiry) license.expiry = input.expiry;
        if (input.licenseKeys)
            license.licenseKey = input.licenseKeys.map((k) => k.toString());
        if (input.comment) license.comment = input.comment;
        await license.save();

        return { success: true, license };
    },
    async licenseDelete(parent, { input }, context, info) {
        const license = await Models.License.findById(input.id)
            .populate("leases")
            .populate("customer");
        if (
            !license ||
            !context.organization._id.equals(
                (license.customer || {}).organization
            )
        )
            throw new UserInputError("License not found");

        for (lease of license.leases) {
            await lease.remove();
        }
        await license.remove();
        return { success: true };
    },
};
