require("dotenv").config();

const axios = require("axios");
const { MongoClient } = require("mongodb");
const { requestAuthenticated } = require("./requests");
const { ca } = require("timeago.js/lib/lang");

const client = new MongoClient(process.env.MONGODB_URI);

const updateUser = async (user) => {
    const result = await requestAuthenticated("feeds/friends-v1", user);

    const db = client.db();
    const usersCollection = db.collection("users");
    const postsCollection = db.collection("posts");

    if (result.refreshed) {
        await usersCollection.updateOne(
            { id: user.id },
            {
                $set: {
                    token: result.token,
                    refreshToken: result.refreshToken
                }
            }
        );
        console.log(`[INFO] [${user.id}] Refreshed token`);
    }

    const insertMoments = [];

    console.log(`[INFO] [${user.id}] Found ${result.res.data.friendsPosts.length} moments`);

    for (const moment of result.res.data.friendsPosts) {
        const data = {
            id: moment.momentId,
            uid: moment.user.id,
            region: moment.region,
            // since I don't know what endpoint returns the day of the moment id, i'm using the time of the first post...
            date: new Date(moment.posts[0].creationDate),
            from: {
                username: moment.user.username,
                profilePicture: moment.user.profilePicture.url,
            },
            for: [
                user.id
            ],
            posts: []
        };

        for (const post of moment.posts) {
            const postData = {
                id: post.id,
                primary: post.primary,
                secondary: post.secondary,
                retakeCounter: post.retakeCounter,
                lateInSeconds: post.lateInSeconds,
                isLate: post.isLate,
                isMain: post.isMain,
                takenAt: post.takenAt,
                btsMedia: post.btsMedia,
            };

            data.posts.push(postData);
        }

        insertMoments.push(data);
    }

    for (const moment of insertMoments) {
        const existingMoment = await postsCollection.findOne({ uid: moment.uid });

        if (existingMoment) {
            let newPosts = moment.posts.filter((post) => {
                return !existingMoment.posts.some((existingPost) => existingPost.id === post.id);
            });
            let momentFor = existingMoment.for;

            if (momentFor.indexOf(user.id) === -1) {
                momentFor.push(user.id);
            }

            if (newPosts.length !== 0 || momentFor.length !== existingMoment.for.length) {
                await postsCollection.updateOne(
                    { uid: moment.uid },
                    {
                        $set: {
                            posts: existingMoment.posts.concat(newPosts),
                            for: momentFor
                        }
                    }
                );

                console.log(`[INFO] [${user.id}] Updated ${moment.id}.${moment.uid} (${newPosts.length} new posts)`);
            } else {
                console.log(`[INFO] [${user.id}] Moment ${moment.id}.${moment.uid} is up to date`);
            }
        } else {
            await postsCollection.insertOne(moment);
            console.log(`[INFO] [${user.id}] Inserted moment ${moment.id}.${moment.uid} (${moment.posts.length} posts)`);
        }
    }
};

(async () => {
    try {
        await client.connect();

        const db = client.db();
        const usersCollection = db.collection("users");
        const users = await usersCollection.find({ active: true }).toArray();
        
        for (const user of users) {
            try {
                console.log(`[INFO] [${user.id}] Fetching feed...`);
                await updateUser(user);
                console.log(`[SUCCESS] [${user.id}] Done!`);
            } catch (e) {
                console.error(`[ERROR] [${user.id}] ${e.stack}`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.close();
    }
})();