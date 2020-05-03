const Models = require("../Models");
const { ForbiddenError } = require("apollo-server-express");

module.exports = {
    async admins(parent, args, context, info) {
        return (
            await Models.Organization.findById(
                context.organization._id
            ).populate("admins")
        ).admins;
    },
    async admin(parent, args, context, info) {
        return await Models.Admin.findOne({
            organization: context.organization._id,
            _id: args.id,
        });
    },
    async adminSelf(parent, args, context, info) {
        return await Models.Admin.findById(context.user._id);
    },
    async customers(parent, args, context, info) {
        return (
            await Models.Organization.findById(
                context.organization._id
            ).populate("customers")
        ).customers;
    },
    async customer(parent, args, context, info) {
        return await Models.Customer.findOne({
            organization: context.organization._id,
            _id: args.id,
        });
    },
    async organization(parent, args, context, info) {
        return await Models.Organization.findById(context.organization._id);
    },
    async products(parent, args, context, info) {
        return (
            await Models.Organization.findById(
                context.organization._id
            ).populate("products")
        ).products;
    },
    async product(parent, args, context, info) {
        return await Models.Product.findOne({
            organization: context.organization._id,
            _id: args.id,
        });
    },
    async productByName(parent, args, context, info) {
        return await Models.Product.findOne({
            organization: context.organization._id,
            name: args.name,
        });
    },
    async features(parent, args, context, info) {
        const products = await Models.Product.find({
            organization: context.organization._id,
        }).populate("features");
        if (!products) return null;

        let features = [];
        products.forEach((p) => {
            features = features.concat(p.features);
        });
        return features;
    },
    async feature(parent, args, context, info) {
        const feature = await Models.Feature.findById(args.id).populate(
            "product"
        );
        if (!feature) return null;
        if (
            context.organization._id.equals(
                (feature.product || {}).organization
            )
        ) {
            return feature;
        } else {
            throw new ForbiddenError("Forbidden");
        }
    },
    async featureByName(parent, args, context, info) {
        const feature = await Models.Feature.findOne({
            name: args.name,
        }).populate("product");
        if (!feature) return null;
        if (
            context.organization._id.equals(
                (feature.product || {}).organization
            )
        ) {
            return feature;
        } else {
            throw new ForbiddenError("Forbidden");
        }
    },
    async licenses(parent, args, context, info) {
        const users = await Models.Customer.find({
            organization: context.organization._id,
        }).populate("licenses");
        if (!users) return null;

        let licenses = [];
        users.forEach((p) => {
            licenses = licenses.concat(p.licenses);
        });
        return licenses;
    },
    async license(parent, args, context, info) {
        const license = await Models.License.findById(args.id).populate(
            "customer"
        );
        if (!license) return null;
        if (
            context.organization._id.equals(
                (license.customer || {}).organization
            )
        ) {
            return license;
        } else {
            throw new ForbiddenError("Forbidden");
        }
    },
    async licenseByKey(parent, args, context, info) {
        const license = await Models.License.findOne({
            licenseKeys: args.licenseKey,
        }).populate("customer");

        if (!license) return null;
        if (
            context.organization._id.equals(
                (license.customer || {}).organization
            )
        ) {
            return license;
        } else {
            throw new ForbiddenError("Forbidden");
        }
    },
    async leases(parent, args, context, info) {
        const users = await Models.Customer.find({
            organization: context.organization._id,
        }).populate({
            path: "licenses",
            populate: {
                path: "leases",
            },
        });
        if (!users) return null;

        let licenses = [];
        users.forEach((p) => {
            licenses = licenses.concat(p.licenses);
        });

        if (!licenses) return null;
        let leases = [];
        licenses.forEach((l) => {
            leases = leases.concat(l.leases);
        });
        return leases;
    },
    async lease(parent, args, context, info) {
        const lease = await Models.Lease.findById(args.id).populate({
            path: "license",
            populate: { path: "customer" },
        });
        if (!lease) return null;
        if (
            context.organization._id.equals(
                ((lease.license || {}).customer || {}).organization
            )
        ) {
            return lease;
        } else {
            throw new ForbiddenError("Forbidden");
        }
    },
    async leaseByKey(parent, args, context, info) {
        const lease = await Models.Lease.findOne({
            leaseKey: args.leaseKey,
        }).populate({
            path: "license",
            populate: { path: "customer" },
        });
        if (!lease) return null;
        if (
            context.organization._id.equals(
                ((lease.license || {}).customer || {}).organization
            )
        ) {
            return lease;
        } else {
            throw new ForbiddenError("Forbidden");
        }
    },
};
