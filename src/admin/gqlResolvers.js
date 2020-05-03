const Models = require("../Models");
const { ForbiddenError } = require("apollo-server-express");

const Query = require("./gqlQuery");
const Mutation = require("./gqlMutation")

module.exports = {
    Query,
    Mutation,
    Admin: {
        async organization(parent, args, context, info) {
            return (
                await Models.Admin.findById(parent.id).populate("organization")
            ).organization;
        },
    },
    Customer: {
        async organization(parent, args, context, info) {
            return (
                await Models.Customer.findById(parent.id).populate(
                    "organization"
                )
            ).organization;
        },
        async licenses(parent, args, context, info) {
            return (
                await Models.Customer.findById(parent.id).populate("licenses")
            ).licenses;
        },
    },
    Feature: {
        async product(parent, args, context, info) {
            const product = await Models.Product.findById(parent.product);
            if (product.organization.equals(context.organization._id)) {
                return product;
            } else {
                throw new ForbiddenError("Forbidden");
            }
        },
        async licenses(parent, args, context, info) {
            return (
                await Models.Feature.findById(parent.id).populate("licenses")
            ).licenses;
        },
    },
    Lease: {
        async license(parent, args, context, info) {
            return (await Models.Lease.findById(parent.id).populate("license"))
                .license;
        },
    },
    License: {
        async customer(parent, args, context, info) {
            return (
                await Models.License.findById(parent.id).populate("customer")
            ).customer;
        },
        async features(parent, args, context, info) {
            return (
                await Models.License.findById(parent.id).populate("features")
            ).features;
        },
        async leases(parent, args, context, info) {
            return (await Models.License.findById(parent.id).populate("leases"))
                .leases;
        },
    },
    Organization: {
        async admins(parent, args, context, info) {
            return await Models.Admin.find({organization: parent.id});
        },
        async products(parent, args, context, info) {
            return await Models.Product.find({organization: parent.id});
        },
        async customers(parent, args, context, info) {
            return await Models.Customer.find({organization: parent.id});
        },
    },
    Product: {
        async organization(parent, args, context, info) {
            return (await Models.Product.findById(parent.id).populate("organization"))
                .organization;
        },
        async features(parent, args, context, info) {
            return (await Models.Product.findById(parent.id).populate("features"))
                .features;
        },
    }
};
