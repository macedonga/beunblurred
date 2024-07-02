import { requestAuthenticated } from "@/utils/requests";
import { hasCookie, getCookie } from "cookies-next";
import clientPromise from "@/utils/mongo";
import checkAuth from "@/utils/checkAuth";
import jwt from "jsonwebtoken";

import { T } from "@tolgee/react";
import { useState } from "react";
import Image from "next/image";

export default function ArchiverManage({
    user,
    archiveData,
    friends
}) {
    const [User, setUser] = useState({ ...user });
    const [ArchiveData, setArchiveData] = useState([...archiveData]);
    const [Friends, setFriends] = useState([...friends]);

    const toggle = async () => {
        const response = await fetch("/api/archiver/toggle");
        const data = await response.json();

        if (data.success) {
            setUser({
                ...User,
                enabled: data.enabled,
            });
        } else {
            alert("An error occurred. Please try again.");
        }
    };

    const toggleUser = async (id) => {
        if (!User.enabled) return alert("You must enable the archiver to archive users.");

        const response = await fetch(`/api/archiver/toggleUser?id=${id}`);
        const data = await response.json();

        if (data.success) {
            if (data.archived) {
                setArchiveData(o => [...o, { id }]);
            } else {
                setArchiveData(o => o.filter((data) => data.id !== id));
            }
        } else {
            alert("An error occurred. Please try again.");
        }
    };

    return (<>
        <h1 className="text-3xl font-semibold text-center">
            <T keyName="archiverManageTitle" />
        </h1>
        <p className="text-center mt-2">
            <T keyName="archiverManageDescription" />
        </p>

        <div className="grid gap-4 mt-4">
            <button
                onClick={toggle}
                className={`
                    text-center py-2 px-4 w-full rounded-lg outline-none transition-colors bg-white/5 relative border-2 border-white/10
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
            >
                <T keyName="archiveToggleButton" />
                <br />
                <span className="opacity-75 text-sm">
                    <T keyName={User.enabled ? "enabled" : "disabled"} />
                </span>
            </button>

            <div className="grid grid-cols-2 gap-4">
                {
                    Friends.map((friend) => (
                        <button
                            key={friend.id}
                            onClick={() => toggleUser(friend.id)}
                            className={`
                                py-2 px-4 w-full rounded-lg outline-none transition-colors bg-white/5 relative border-2 border-white/10
                                disabled:opacity-50 disabled:cursor-not-allowed flex text-left
                            `}
                        >
                            {
                                friend.profilePicture?.url ?
                                    <Image
                                        className="w-12 h-12 rounded-lg border-black border-2 mr-4"
                                        height={48}
                                        width={48}
                                        src={friend.profilePicture?.url}
                                        alt="Profile picture"
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = "https://cdn.caards.co/assets/default-avatar.png";
                                        }}
                                    /> :
                                    <div className="w-12 h-12 rounded-lg bg-white/5 relative border-full border-black justify-center align-middle flex mr-4">
                                        <div className="m-auto text-2xl uppercase font-bold">{friend.username.slice(0, 1)}</div>
                                    </div>
                            }
                            <p>
                                {friend.username}
                                <br />
                                <span className="opacity-75 text-sm">
                                    {
                                        ArchiveData.find((data) => data.id === friend.id) ?
                                            <T keyName="archived" /> :
                                            <T keyName="notArchived" />
                                    }
                                </span>
                            </p>
                        </button>
                    ))
                }
            </div>
        </div>
    </>);
}

export async function getServerSideProps(context) {
    const db = await (await clientPromise).db("beunblurred");
    const archive = await db.collection("archive");
    const users = await db.collection("users");

    const { req, res } = context;
    const authCheck = await checkAuth(req, res);
    if (authCheck) return authCheck;

    const token = getCookie("archiverToken", { req, res });
    if (!token) {
        return {
            redirect: {
                destination: "/archiver/signup",
                permanent: false,
            }
        };
    }

    const decoded = jwt.decode(token, process.env.SIGNATURE_SECRET);

    const user = await users.findOne({ id: decoded.id });
    if (!user) {
        return {
            redirect: {
                destination: "/archiver/signup",
                permanent: false,
            }
        };
    }

    let archiveData = [];
    if (user.enabled) {
        for (const uid of user.users) {
            const userData = await archive.findOne({ id: uid });
            if (userData) {
                archiveData.push(userData);
            }
        }
    }

    const friends = await requestAuthenticated("relationships/friends", req, res);

    return {
        props: {
            user: JSON.parse(JSON.stringify(user)),
            archiveData: JSON.parse(JSON.stringify(archiveData)),
            friends: JSON.parse(JSON.stringify(friends.data?.data)),
        },
    };
}