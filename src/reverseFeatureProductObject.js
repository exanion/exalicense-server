/**
 * Some queries return data in form features: [{product: {...}}]
 * Map it to products: [{features: [...]}]
 */
const reverseFeatureProductObject = (features, withDescription = true) => {
    let v = [];
    features.map(f => {
        if (!v.filter(x => x.product === f.product.name).length) {
            let newProduct = {
                product: f.product.name,
                features: [{ feature: f.name }],
            };
            if (withDescription) {
                newProduct.productDescription = f.product.displayname;
                newProduct.features[0].featureDescription = f.displayname;
            }
            v.push(newProduct);
        } else {
            for (let i = 0; i < v.length; i++) {
                if (v[i].product == f.product.name) {
                    let newFeature = { feature: f.name };
                    if (withDescription) {
                        newFeature.featureDescription = f.displayname;
                    }
                    v[i].features.push(newFeature);
                }
            }
        }
    });
    return v;
};

module.exports.reverseFeatureProductObject = reverseFeatureProductObject;
