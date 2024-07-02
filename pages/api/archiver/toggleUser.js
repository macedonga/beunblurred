import jwt from "jsonwebtoken";
import checkAuth from "@/utils/checkAuth";
import clientPromise from "@/utils/mongo";

export default async function handler(req, res) {
    if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

    if (!req.query.id) return res.status(400).json({ error: "No ID provided.", success: false });

    const client = await clientPromise;
    const db = await client.db("beunblurred");
    const users = await db.collection("users");
    const archive = await db.collection("archive");

    const token = req.cookies.archiverToken;

    const isLoggedin = await checkAuth(req, res);
    if (isLoggedin) return res.status(401).json({ error: "Unauthorized", success: false });
    const { id } = jwt.decode(token, process.env.SIGNATURE_SECRET);

    const user = await users.findOne({ id });
    if (!user) return res.status(400).json({ error: "User does not exist.", success: false });

    let newUser = user;

    if (!user.enabled) return res.status(400).json({ error: "User had not enabled archiver.", success: false });
    if (!user.users.includes(req.query.id)) {
        newUser.users.push(req.query.id);
    } else {
        newUser.users = newUser.users.filter((uid) => uid !== req.query.id);
    }

    await users.updateOne({ id }, {
        $set: {
            users: newUser.users,
        },
    });

    const archivedUser = await archive.findOne({ id: req.query.id });
    if (!archivedUser) {
        await archive.insertOne({
            id: req.query.id,
            archiveDate: 0
        });
    }

    return res.status(200).json({
        success: true,
        archived: newUser.users.includes(req.query.id),
    });
}