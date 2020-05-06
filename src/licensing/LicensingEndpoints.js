const express = require("express");
const Models = require("../Models");
const mongoose = require("mongoose");
const config = require("../../config");

const licensingEndpoint = express.Router();
const router = express.Router();

const ErrorCode = {
    KeyInvalid: "KEY_INVALID",
    KeyExpired: "KEY_EXPIRED",
    LeaseLimitReached: "LEASE_LIMIT_REACHED",
    LeaseInvalid: "LEASE_INVALID",
    LeaseReleased: "LEASE_RELEASED",
    LeaseExpired: "LEASE_EXPIRED",
};

/**
 * Some queries return data in form features: [{product: {...}}]
 * Map it to products: [{features: [...]}]
 */
const reverseFeatureProductObject = features => {
    let v = [];
    features.map(f => {
        if (!v.filter(x => x.product === f.product.name).length) {
            v.push({
                product: f.product.name,
                productDescription: f.product.displayname,
                features: [
                    { feature: f.name, featureDescription: f.displayname },
                ],
            });
        } else {
            for (let i = 0; i < v.length; i++) {
                if (v[i].product == f.product.name) {
                    v[i].features.push({
                        feature: f.name,
                        featureDescription: f.displayname,
                    });
                }
            }
        }
    });

    return v;
};

licensingEndpoint.use(
    "/:orgId",
    async (req, res, next) => {
        //fill in the organization
        let id;
        try {
            id = mongoose.Types.ObjectId(req.params.orgId);
        } catch (err) {
            return res.status(404).json({
                success: false,
                message: "Invalid licensing endpoint",
                code: "LICENSING_ENDPOINT_INVALID",
            });
        }

        const org = await Models.Organization.findById(id);
        if (!org) {
            return res.status(404).json({
                success: false,
                message: "Invalid licensing endpoint",
                code: "LICENSING_ENDPOINT_INVALID",
            });
        }

        req.organization = org;
        return next();
    },
    router
);

router.get("/signature.pem", (req, res) => {
    res.contentType("application/x-pem-file").send(config.publicKey);
});

router.get("/key/validate", async (req, res) => {
    let returnData = { isValid: false };

    const key = req.body.key || req.query.key || "";

    const license = await Models.License.findOne({ licenseKeys: key })
        .populate({ path: "features", populate: "product" })
        .populate("leases");

    if (!license) return res.status(404).json(returnData);

    returnData.expiry = license.expiry || null;
    returnData.leaseLimit = license.leaseCountLimit || null;
    returnData.leasesUsed = license.leases.filter(l => l.isValid).length;
    returnData.validFor = reverseFeatureProductObject(license.features);
    returnData.isValid = true;

    res.json(returnData);
});

router.post("/lease/obtain", async (req, res) => {
    let returnData = { success: false };

    const key = req.body.key || req.query.key || "";
    let expiryDuration = parseInt(req.body.expiry || req.query.expiry);
    if (isNaN(expiryDuration)) expiryDuration = 600;
    const expiry = new Date(new Date().getTime() + expiryDuration * 1000);
    let clientId = req.body.clientId || req.query.clientId || null;

    const license = await Models.License.findOne({ licenseKeys: key })
        .populate("leases")
        .populate({ path: "features", populate: "product" });

    if (!license) {
        returnData.errorCode = ErrorCode.KeyInvalid;
        return res.status(400).json(returnData);
    }
    if (license.isExpired) {
        returnData.errorCode = ErrorCode.KeyExpired;
        return res.status(400).json(returnData);
    }
    if (
        license.leaseCountLimit &&
        license.leases.filter(lease => lease.isValid).length >=
            license.leaseCountLimit
    ) {
        returnData.errorCode = ErrorCode.LeaseLimitReached;
        return res.status(400).json(returnData);
    }

    const lease = new Models.Lease({ expiry, license: license._id, clientId });
    await lease.save();

    returnData.expiry = expiry;
    returnData.lease = lease.leaseKey;
    returnData.validFor = reverseFeatureProductObject(license.features);
    returnData.success = true;

    return res.json(returnData);
});

router.get("/lease/validate", async (req, res) => {
    let returnData = { isValid: false };

    const leaseKey = req.body.lease || req.query.lease || "";
    const lease = await Models.Lease.findOne({ leaseKey }).populate({
        path: "license",
        populate: { path: "features", populate: "product" },
    });

    if (!lease) {
        returnData.errorCode = ErrorCode.LeaseInvalid;
        return res.status(400).json(returnData);
    }
    returnData.expiry = lease.expiry;
    if (lease.isReleased) {
        returnData.errorCode = ErrorCode.LeaseReleased;
        return res.status(400).json(returnData);
    }
    if (!lease.isValid) {
        returnData.errorCode = ErrorCode.LeaseExpired;
        return res.status(400).json(returnData);
    }

    returnData.validFor = reverseFeatureProductObject(lease.license.features);
    returnData.isValid = true;

    return res.json(returnData);
});

router.post("/lease/renew", async (req, res) => {
    let returnData = { success: false };

    const leaseKey = req.body.lease || req.query.lease || "";
    let expiryDuration = parseInt(req.body.expiry || req.query.expiry);
    if (isNaN(expiryDuration)) expiryDuration = 600;
    const expiry = new Date(new Date().getTime() + expiryDuration * 1000);

    const lease = await Models.Lease.findOne({ leaseKey });

    if (!lease) {
        returnData.errorCode = ErrorCode.LeaseInvalid;
        return res.status(400).json(returnData);
    }
    returnData.expiry = lease.expiry;
    if (lease.isReleased) {
        returnData.errorCode = ErrorCode.LeaseReleased;
        return res.status(400).json(returnData);
    }
    if (!lease.isValid) {
        returnData.errorCode = ErrorCode.LeaseExpired;
        return res.status(400).json(returnData);
    }

    const newLease = new Models.Lease({expiry, clientId: lease.clientId, license: lease.license});
    await newLease.save();
    lease.isReleased = true;
    await lease.save();

    returnData.expiry = expiry;
    returnData.lease = newLease.leaseKey;
    returnData.success = true;
    return res.json(returnData);
});

router.post("/lease/release", async (req, res) => {
    let returnData = { success: false };

    const leaseKey = req.body.lease || req.query.lease || "";
    const lease = await Models.Lease.findOne({ leaseKey });
    
    if(!lease){
        returnData.errorCode = ErrorCode.LeaseInvalid;
        return res.status(400).json(returnData);
    }

    lease.isReleased = true;
    await lease.save();

    returnData.success = true;
    return res.json(returnData);    
})

module.exports = licensingEndpoint;
