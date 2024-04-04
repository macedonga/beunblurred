import checkAuth from "@/utils/checkAuth";
import { requestAuthenticated } from "@/utils/requests";
import { hasCookie } from "cookies-next";

export default async function handler(req, res) {
    const authCheck = await checkAuth(req, res);
    if (authCheck) {
        return res.status(401).json({
            error: "Unauthorized",
            success: false
        });
    }
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
        feedResponse = await requestAuthenticated("feeds/discovery?limit=100", req, res);
    }

    return res.status(200).json({
        data: feedResponse.data.posts,
        success: true
    });
};