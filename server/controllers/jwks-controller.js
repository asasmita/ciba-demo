class JwksController {

    constructor() {}

    // The jwks_uri of the OB directory, the private key is ob.pem
    obdirectory = async (req, res) => {
        let jwks = {"keys":[{
            "kty": "EC",
            "use": "sig",
            "crv": "P-256",
            "kid": "ob",
            "x": "JclkCiqDm3iX9aXG_QdmH18_ydZFa-6SIu6oaKcSvzc",
            "y": "PQj2wnCCZbLOSQmNNACtLpZ6NoSzhMj4qe29euJkwjk",
        }]};
        res.status(200).send(jwks);
    }

    // The jwks_uri of the relying party, the private key is cibarsa.pem and cibaec521.pem
    relyingparty = async (req, res) => {
        let jwks = {"keys":[{
            "kty": "RSA",
            "e": "AQAB",
            "use": "sig",
            "kid": "cibarsa",
            "n": "mP6Zt6qN3YEE4asCoMmvVEJcXTv00I1AamJvmkUx0Ax9-w_AcBa7zeEgysEK0CQG2jXLGaRQ-W0D74Z5K_aAnx7dbRSmArxe-dlGm08_KoOwErh2dHq5_GezYURTWddv_2hjObJcoxQtzKmQQCbcLH_8_AGdVO6KZYfPElPqsEW1VEdiFkOgL3LPw2KRVPB3g6yj3t2Ot9edB8AnKwyD8eFDpV48Q-w9DfgqY_XlOYTDgtpBDGADP_XScL5Le7wZRfZp1N4qRYeak2NjKMDUpxPt0tX5d-GHjTG6ph9J-hzBFnSbUUpQEHol7fAVy6GFOwVbY9-yJkoV7CebstDryQ"
        },{
            "kty": "EC",
            "use": "sig",
            "crv": "P-521",
            "kid": "cibaec521",
            "x": "AVnfaEpeCrVt8mozqVaJ37hW7JBhHVu9q8BK0w6-wTAhJ8FBoWFxOPGT-Kc0-h0weNTh1UMGEoXmXFArN6qGp1yz",
            "y": "AN6HK2bqfD2Y_3r6_WZa5Z6IyZao8Aw9OZBJ0IMrbnmay6z0-Oghqd7NChR6BORkizLetSe-4HbOxllPSztHFP2d",
        }]};
        res.status(200).send(jwks);
    }
}

module.exports = JwksController;