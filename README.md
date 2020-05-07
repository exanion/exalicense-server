
# ExaLicense Server Instance

ExaLicense is a flexible server to manage, obtain and validate licenses for your product. It supports license pooling, that means you can allow your customer to use a license for a certain number of instances/ users/ ...

![Frontend Screenshot](https://github.com/exanion/exalicense-server/raw/master/static/exalicense-frontend-screenshot.jpg)

**How does it work?**  You can use the intuitive administration frontend to create customers, products and sub-features as well as license key codes for a set of features. You can include a client library (or directly use the licensing endpoints described below) in your application to check license keys, obtain and release leases and check your pool.

## Project Support
Exanion offers commercial support for ExaLicense, including extensive documentation, set-up guides, adminsitration hints and so on. Thanks to a flexible team, we can offer consultation tailored to your needs. Also, we offer a readily available, fully monitored, maintained and administered instance of ExaLicense that provides a hassle free implementation of licensing in your products! **Interested? Feel free to reach out to Exanion: <exalicense@exanion.de>!**

Feel free to drop a pull request if you want to cotribute a feature, documentation or a bugfix!

Donations help us to keep the work on this project up: [![Donate via PayPal](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=25X84UHCTUPBA)

## Licensing Endpoints
The following endpoints are available for validating leases, creating and checking license keys, etc.
All calls must be made to the licensing endpoint of your organization - it is displayed in the "settings" menu of the administration interface. It looks like `{hostname}/licensing/{organizationId}`

### Error Codes
The following error codes can be returned: 
* `KEY_INVALID`: The given license key is invalid or unknown
* `KEY_EXPIRED`: The given license key has expired
* `LEASE_LIMIT_REACHED`: The maximum number of leases for this license key has been reached, no more leases can be issued. 
* `LEASE_INVALID`: The given lease code is invalid or unknown
* `LEASE_RELEASED`: The lease has been released and is now invalid
* `LEASE_EXPIRED`: The given lease code has expired

### Validate a license key
```GET /key/validate```

**Request Parameters**
* `key` (String, required): License Key to check

**Response Parameters**
* `isValid` (Boolean, required): Indicates whether the key is a valid key known to the licensing server
* `expiry` (Date || null): Expiry date for the license key (or null if no expiry)
* `leaseLimit` (Integer || null): Maximum number of consecutive users/ applications using this key
* `leasesUsed` (Integer || null): Current number of leases active for this key
* `validFor` ([Object] || []): Products/ features that this key licenses
   - `product` (String, required): ID of the product the key is valid for
   - `productDescription` (String || null): Description of the product
   - `features` ([Object] || []): Features of the product that this license is valid for
       - `feature` (String, required): ID of the product sub-feature
       - `featureDescription` (String || null): Description of the sub-feature

### Obtain a lease
A lease allows the usage of the product/ feature for a certain period.

```POST /lease/obtain```

**Request Parameters**
* `key` (String, required): License key to use
* `expiry` (Integer || null): Requested validity of the lease from the time of issue in seconds - default 600 (10 minutes)
* `clientId` (String || null): Identifier of the client that obtains the lease

**Response Parameters**
* `success` (Boolean, required): Indicated whether the lease has been generated successfully
* `errorCode` (ErrorCode || null): Error that occured during generation, null || KEY_INVALID || KEY_EXPIRED || LEASE_LIMIT_REACHED
* `lease` (String || null): Lease code that can be used in future requests
* `expiry`: (Date || null): Expiry of the lease key
* `validFor`: ([Object] || null): Products/ features that this lease is valid for - see description above


### Validate a lease
Check whether the given lease code is valid

```GET /lease/validate```

**Request Parameters**
* `lease` (String, required): Lease code to validate

**Response Parameters**
* `isValid` (Boolean, required): Indicates whether the lease is currently valid
* `errorCode` (ErrorCode || null): null || LEASE_EXPIRED || LEASE_INVALID || LEASE_RELEASED
* `expiry` (Date || null): Lease expiry timestamp
* `validFor` ([Object] || null): Products/ features that this lease is valid for - see description above

### Renew a lease
Renew a lease, it is required that the current lease is yet active and valid

```POST /lease/renew```

**Request Parameters**
* `lease` (String, required): Current lease code that shall be renewed
* `expiry` (Integer || null): Requested validity of the new lease from the time of issue in seconds - default 600 (10 minutes)

**Response Parameters**
* `success` (Boolean, required): Indicates whether the lease was renewed successfully
* `errorCode` (ErrorCode || null): Problem with the current lease: LEASE_EXPIRED || LEASE_RELEASED || LEASE_INVALID || null
* `expiry` (Date || null): Lease expiry timestamp
* `lease`: (String || null): New lease code - the old one is invalidated, continue using the new one


### Release a lease
Release a lease (e.g. if the application is closed), so other users can use the license out of the pool

```POST /lease/release```

**Request Parameters**
* `lease` (String, required): Lease code to release

**Response Parameters**
* `success` (Boolean, required): Indicates whether the lease was released successfully
* `errorCode` (ErrorCode || null): Problem that has occured: LEASE_INVALID || null

### Obtain the signing key
A keychain is used by the server to sign the leases. This endpoint returns the public key that can be used to validate a lease, e.g. for offline validation of leases.

```GET /signature.pem```