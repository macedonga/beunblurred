require("dotenv").config();

const axios = require("axios");
const { MongoClient } = require("mongodb");
const { requestAuthenticated } = require("./requests");

const client = new MongoClient(process.env.MONGODB_URI);
const { DEBUG } = process.env;

const updateUser = async (user) => {
    const db = client.db();
    const usersCollection = db.collection("users");
    const postsCollection = db.collection("posts");

    const result = await requestAuthenticated("feeds/friends-v1", user);

    if (result.error === 1) {
        await usersCollection.updateOne(
            { id: user.id },
            {
                $set: {
                    shouldUpdateCredentials: true,
                }
            }
        );
        if (DEBUG) console.log(`[ERROR] [${user.id}] Couldn't refresh token.`);
        return;
    }

    if (result.error === 2) {
        if (DEBUG) console.log(`[ERROR] [${user.id}] Couldn't fetch request signature from server.`);
        return;
    }

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
        
        if (DEBUG) console.log(`[INFO] [${user.id}] Refreshed token`);
    }

    const insertMoments = [];

    if (DEBUG) console.log(`[INFO] [${user.id}] Found ${result.res.data.friendsPosts.length} moments`);

    for (const moment of result.res.data.friendsPosts) {
        const data = {
            id: moment.momentId,
            uid: moment.user.id,
            region: moment.region,
            // since I don't know what endpoint returns the day of the moment id, i'm using the time of the first post...
            date: new Date(moment.posts[0].creationDate),
            from: {
                username: moment.user.username,
                profilePicture: moment.user?.profilePicture?.url,
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
                location: post.location,
            };

            data.posts.push(postData);
        }

        insertMoments.push(data);
    }

    for (const moment of insertMoments) {
        const existingMoment = await postsCollection.findOne({ uid: moment.uid, id: moment.id });

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
                    { uid: moment.uid, id: moment.id },
                    {
                        $set: {
                            posts: existingMoment.posts.concat(newPosts),
                            for: momentFor
                        }
                    }
                );

                if (DEBUG) console.log(`[INFO] [${user.id}] Updated ${moment.id}.${moment.uid} (${newPosts.length} new posts)`);
            } else {
                if (DEBUG) console.log(`[INFO] [${user.id}] Moment ${moment.id}.${moment.uid} is up to date`);
            }
        } else {
            await postsCollection.insertOne(moment);
            if (DEBUG) console.log(`[INFO] [${user.id}] Inserted moment ${moment.id}.${moment.uid} (${moment.posts.length} posts)`);
        }
    }
};

(async () => {
    try {
        await client.connect();

        const db = client.db();
        const usersCollection = db.collection("users");
        const users = await usersCollection.find({ active: true, paid: true }).toArray();
        
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