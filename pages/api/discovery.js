import axios from "axios";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

export default async function handler(req, res) {
    const requiredCookies = [
        "token",
        "refreshToken",
        "tokenType",
        "tokenExpiration"
    ];
    const data = [];

    if (!hasCookie("testMode", { req, res }) && requiredCookies.map(n => hasCookie(n, { req, res })).includes(false)) {
        return res.status(401).json({
            error: "Unauthorized",
            success: false
        });
    }

    requiredCookies.forEach(n => data[n] = getCookie(n, { req, res }));

    let feedResponse;

    if (hasCookie("testMode", { req, res })) {
        feedResponse = {
            data: {
                posts: [{
                    "id": "i2mdHNJ8fEFzC6VAbmqPS",
                    "bucket": "storage.bere.al",
                    "creationDate": {
                        "_seconds": 1694174302,
                        "_nanoseconds": 401000000
                    },
                    "imageHeight": 2000,
                    "imageWidth": 1500,
                    "isPublic": true,
                    "lateInSeconds": 15217,
                    "mediaType": "late",
                    "notificationID": "uAO8afPsyxbIMnpN2zfoc",
                    "ownerID": "bDZ6ap6FJDSPCHtlSymkJw9MoQ82",
                    "photoURL": "https://cdn.bereal.network/Photos/bDZ6ap6FJDSPCHtlSymkJw9MoQ82/post/87aFQd6AfL1HVTIe.webp",
                    "region": "europe-west",
                    "realMojis": [],
                    "retakeCounter": 1,
                    "secondaryImageHeight": 2000,
                    "secondaryImageWidth": 1500,
                    "secondaryPhotoURL": "https://cdn.bereal.network/Photos/bDZ6ap6FJDSPCHtlSymkJw9MoQ82/post/87aFQd6AfL1HVTIe.webp",
                    "takenAt": {
                        "_seconds": 1694174291,
                        "_nanoseconds": 462000000
                    },
                    "updatedAt": 1694174302401,
                    "user": {
                        "id": "bDZ6ap6FJDSPCHtlSymkJw9MoQ82",
                        "username": "testUser",
                        "profilePicture": {
                            "url": "https://cdn.bereal.network/Photos/8737uCPnsYeJfQgKXNb3Z1DoYuR2/profile/Jsl-HFhp1J29qvNG1Xgjv.webp",
                            "width": 500,
                            "height": 500
                        }
                    },
                    "userName": "testUser",
                    "visibility": [
                        "friends",
                        "friends-of-friends",
                        "public"
                    ]
                }]
            }
        };
    } else {
        if (data.tokenExpiration < Date.now()) {
            // deepcode ignore HardcodedNonCryptoSecret
            const refreshData = await axios.post(
                "https://auth.bereal.team/token?grant_type=refresh_token",
                {
                    "grant_type": "refresh_token",
                    "client_id": "ios",
                    "client_secret": "962D357B-B134-4AB6-8F53-BEA2B7255420",
                    "refresh_token": data.refreshToken
                },
                {
                    headers: {
                        "Accept": "*/*",
                        "User-Agent": "BeReal/8586 CFNetwork/1240.0.4 Darwin/20.6.0",
                        "x-ios-bundle-identifier": "AlexisBarreyat.BeReal",
                        "Content-Type": "application/json",
                        "bereal-app-version-code": "14549",
                        "bereal-signature": "MToxNzEyMTY2NzczOvl1SHcS47AGyc37sOQn/a9BZPOuhM2pDajsGQz0I6rF",
                        "bereal-device-id": "937v3jb942b0h6u9",
                        "bereal-timezone": "Europe/Paris",
                    }
                }
            );

            const setCookieOptions = {
                req,
                res,
                maxAge: 60 * 60 * 24 * 7 * 3600,
                path: "/",
            };

            setCookie("token", refreshData.data.access_token, setCookieOptions);
            setCookie("refreshToken", refreshData.data.refresh_token, setCookieOptions);
            setCookie("tokenExpiration", Date.now() + (refreshData.data.expires_in * 1000), setCookieOptions);

            data.token = refreshData.data.access_token;
            data.refreshToken = refreshData.data.refresh_token;
        }

        feedResponse = await axios.get(
            "https://mobile.bereal.com/api/feeds/discovery?limit=100",
            {
                "headers": {
                    "Authorization": `Bearer ${data.token}`,
                    "bereal-app-version-code": "14549",
                    "bereal-signature": "MToxNzEyMTY2NzczOvl1SHcS47AGyc37sOQn/a9BZPOuhM2pDajsGQz0I6rF",
                    "bereal-device-id": "937v3jb942b0h6u9",
                    "bereal-timezone": "Europe/Paris",
                }
            }
        );
    }

    return res.status(200).json({
        data: feedResponse.data.posts,
        success: true
    });
};