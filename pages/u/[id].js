import axios from "axios";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import dynamic from "next/dynamic";
import { NextSeo } from "next-seo";
import { format, register } from "timeago.js";
import * as TimeAgoLanguages from "timeago.js/lib/lang/";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import checkAuth from "@/utils/checkAuth";
import clientPromise from "@/utils/mongo";
import { requestAuthenticated } from "@/utils/requests";

import { T, useTranslate } from "@tolgee/react";
import { CheckBadgeIcon } from "@heroicons/react/20/solid";

const PostComponent = dynamic(() => import("@/components/PostComponent"), {
    loading: () => <p>Loading...</p>,
    ssr: false,
});

export default function User(props) {
    const { t } = useTranslate();

    const [AddFriendClicked, setAddFriendClicked] = useState(false);
    for (const lang in TimeAgoLanguages) {
        register(lang, TimeAgoLanguages[lang]);
    }

    const addFriend = async () => {
        setAddFriendClicked(true);

        try {
            const res = await axios.post("/api/addFriend", {
                userId: props.user.id
            });

            if (res.data.success) {
                alert("Friend request sent!");
            } else {
                alert("An error occurred while trying to send the friend request. Please try again later.");
            }
        } catch (e) {
            console.error(e);
            alert("An error occurred while trying to send the friend request. Please try again later.");
        }
    };

    return (<>
        <NextSeo title={`${props.user.username}'s profile`} />

        <div
            className={`
                flex flex-col
                bg-white/5
                relative border-2 border-white/10
                rounded-lg lg:p-6 p-4 min-w-0
            `}
        >
            {props?.user?.profilePicture?.url ?
                <Image
                    className="w-48 h-48 rounded-lg mx-auto border-black border-2"
                    src={props?.user?.profilePicture?.url}
                    alt="Profile picture"
                    width={192}
                    height={192}
                    loading="eager"
                />
                :
                <div className="w-48 h-48 rounded-lg bg-white/5 relative border-full border-black justify-center align-middle flex mx-auto">
                    <div className="m-auto text-2xl uppercase font-bold">{props.user.username.slice(0, 1)}</div>
                </div>
            }

            <h1 className="text-2xl font-bold text-center mt-4">
                {props.user.fullname || "@" + props.user.username}
            </h1>
            {props.user.fullname &&
                <p className="text-lg font-medium text-center opacity-75">
                    {"@" + props.user.username}
                </p>
            }
            {props.user.isRealPeople &&
                <p className="bg-white rounded-lg text-black font-bold inline-flex mx-auto px-4 mt-2 items-center">
                    <CheckBadgeIcon className="w-4 h-4 mr-2" />
                    RealPeople
                </p>
            }

            {!props.user.phoneNumber && !["accepted", "rejected"].includes(props.user.relationship?.status) &&
                <button
                    onClick={addFriend}
                    className={
                        "bg-white/5 border-2 border-white/10 rounded-lg inline-flex mx-auto text-sm px-6 py-1 mt-2" + 
                        ((AddFriendClicked || props.user.relationship?.status == "sent") ? " opacity-50 cursor-not-allowed" : "")
                    }
                >
                    {
                        (AddFriendClicked || props.user.relationship?.status == "sent") ? "Friend request sent" : "Add as friend"
                    }
                </button>
            }

            <p className="text-base text-center opacity-75 mt-2">
                {
                    props.user.biography && <>
                        <T keyName={"bio"} />: {props.user.biography}<br />
                    </>
                }
                {
                    props.user.location && <>
                        <T keyName={"location"} />: {props.user.location}<br />
                    </>
                }
                {
                    props.user.createdAt && <>
                        <T keyName={"joined"} />: {format(props.user.createdAt, props.locale)}<br />
                    </>
                }
                {
                    props.user.birthdate && <>
                        <T keyName={"birthdate"} />: {new Date(props.user.birthdate).toLocaleDateString(props.locale)}<br />
                    </>
                }
                {
                    props.user.relationship?.status == "accepted" && props.user.relationship?.friendedAt && <>
                        <T keyName={"friended"} />: {format(props.user.relationship.friendedAt, props.locale)}<br />
                    </>
                }
                {
                    props.user.streakLength ? <>
                        Streak: {props.user.streakLength}<br />
                    </> : <></>
                }
            </p>
        </div>

        {
            (props.posts && props.posts.length > 0) && <>
                <div
                    className={`
                        flex flex-col
                        bg-white/5 mt-8
                        relative border-2 border-white/10
                        rounded-lg lg:p-6 p-4 min-w-0 gap-y-4
                        overflow-y-auto max-h-64
                    `}
                >
                    <h2 className="text-lg font-medium text-center">
                        <T keyName={"archiverPostTitleUserPages"} params={{ count: props.posts.length }} />
                    </h2>

                    <Link
                        href={`/archiver/${props.user.id}/feed?fromUserPage=1`}
                        as={`/archiver/${props.user.id}/feed`}
                        className={`
                                    px-4 py-2 bg-white/5 rounded-lg transition-all border-2 border-white/10
                                    disabled:opacity-50 disabled:cursor-not-allowed outline-none w-full text-center
                                `}
                    >
                        <T keyName={"archiverViewAllUsersPost"} params={{ user: props.user.username }} />
                    </Link>

                    {
                        props.posts.map((p, index) => (
                            <Link
                                href={`/archiver/${props.user.id}/${p.date}?fromUserPage=1`}
                                as={`/archiver/${props.user.id}/${p.date}`}
                                className={`
                                    px-4 py-2 bg-white/5 rounded-lg transition-all border-2 border-white/10
                                    disabled:opacity-50 disabled:cursor-not-allowed outline-none w-full text-center
                                `}
                            >
                                {new Date(p.date).toLocaleDateString(props.locale, { year: "numeric", month: "long", day: "numeric" })}
                            </Link>
                        ))
                    }
                </div>
            </>
        }

        {
            (props.pinnedMemories && props.pinnedMemories.length > 0) && <>
                <div
                    className={`
                        flex flex-col
                        bg-white/5 mt-8
                        relative border-2 border-white/10
                        rounded-lg lg:p-6 p-4 min-w-0 gap-y-4
                    `}
                >
                    <h2 className="text-lg font-medium text-center">
                        {props.pinnedMemories.length} <T keyName={"pinnedMemories"} />
                    </h2>

                    {
                        props.pinnedMemories.map((memory, index) => (
                            <PostComponent
                                key={index}
                                locale={props.locale}
                                isMemory={true}
                                data={{
                                    posts: [
                                        {
                                            primary: memory.primary,
                                            takenAt: memory.takenAt,
                                            secondary: memory.secondary,
                                            id: memory.id,
                                            location: memory.location,
                                            isLate: memory.isLate,
                                            isMain: memory.isMain,
                                            lateInSeconds: memory.lateInSeconds,
                                            caption: memory.caption,
                                        }
                                    ],
                                    ...memory,
                                    user: {
                                        ...props.user,
                                        relationship: null
                                    }
                                }}
                            />
                        ))
                    }
                </div>
            </>
        }

        {
            (props.user.relationship?.status == "accepted" || props.friends?.total) ? <>
                <div
                    className={`
                        flex flex-col
                        bg-white/5 mt-8
                        relative border-2 border-white/10
                        rounded-lg lg:p-6 p-4 min-w-0
                    `}
                >
                    <h2 className="text-lg font-medium text-center">
                        {(props.user?.relationship?.commonFriends || props.friends)?.total}{" "}
                        {!props.user?.relationship?.commonFriends
                            ?
                            props?.friends?.data?.length !== 1 ? <T keyName={"friends"} /> : <T keyName={"friend"} />
                            :
                            props.user?.relationship?.commonFriends?.sample?.length !== 1 ? <T keyName={"commonFriends"} /> : <T keyName={"commonFriend"} />
                        }
                    </h2>

                    {
                        (props.user?.relationship?.commonFriends?.sample || props?.friends?.data).map((friend, index) => (
                            <Link
                                key={friend.id}
                                href={"/u/" + friend.id}
                            >
                                <div className="bg-white/5 rounded-lg py-2 px-4 mt-2 flex items-center">
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
                                    <p className="text-sm text-white">
                                        {friend.fullname || "@" + friend.username}
                                        {
                                            friend.fullname && <>
                                                <br />
                                                <span className="text-xs opacity-75">
                                                    {"@" + friend.username}
                                                </span>
                                            </>
                                        }
                                    </p>
                                </div>
                            </Link>
                        ))
                    }
                </div>
            </> : <></>
        }
    </>)
}

const fetchAllFriends = async (req, res, next) => {
    let url = "relationships/friends";

    if (next) url = url + "?next=" + next;
    let friends = await requestAuthenticated(url, req, res);

    if (friends.data.next) friends.data.data = friends.data.data.concat(await fetchAllFriends(req, res, friends.data.next));

    return friends;
};

export async function getServerSideProps({ req, res, params, ...ctx }) {
    const authCheck = await checkAuth(req, res);
    if (authCheck) return authCheck;

    const loggedInUser = JSON.parse(getCookie("user", { req, res }));

    if (params.id == loggedInUser.id) {
        return {
            redirect: {
                destination: "/u/me",
                permanent: false,
                locale: ctx.locale
            },
        };
    }

    let props;
    if (hasCookie("testMode", { req, res })) {
        props = {
            user: { "id": "8737uCPnsYeJfQgKXNb3Z1DoYuR2", "username": "testUser", "birthdate": "0", "fullname": "Test User", "profilePicture": { "url": "https://cdn.bereal.network/Photos/8737uCPnsYeJfQgKXNb3Z1DoYuR2/profile/Jsl-HFhp1J29qvNG1Xgjv.webp", "width": 1000, "height": 1000 }, "realmojis": [], "devices": [], "canDeletePost": true, "canPost": true, "canUpdateRegion": true, "phoneNumber": "+393511231234", "biography": "Dummy user", "location": "Test land, Test city", "countryCode": "IT", "region": "europe-west", "createdAt": "0", "isRealPeople": false, "userFreshness": "returning" },
        }
    } else {
        let path = "person/profiles/" + params.id;
        if (params.id == "me") path = "person/me";

        let data = await requestAuthenticated(path, req, res);
        props = {
            user: data?.data
        };

        if (params.id == "me") {
            let friends = await fetchAllFriends(req, res);
            setCookie("user", JSON.stringify(data?.data), {
                req,
                res,
                maxAge: 60 * 60 * 24 * 7 * 3600,
                path: "/",
            });

            props = {
                friends: friends.data,
                user: data?.data
            };
        } else {
            try {
                let pm = await requestAuthenticated("feeds/memories-v1/pinned-memories/for-user/" + params.id, req, res);
                props.pinnedMemories = pm.data?.pinnedMemories || [];
            } catch (e) {}
        }
    }

    if (!process.env.NEXT_PUBLIC_NO_ARCHIVER) {
        const db = (await clientPromise).db();
        const users = db.collection("users");
        const posts = db.collection("posts");

        if (params.id == "me")
            return { props: JSON.parse(JSON.stringify(props)) };

        const user = await requestAuthenticated("person/me", req, res);
        var userFromDb = await users.findOne({ id: user.data.id });

        if (!userFromDb)
            return { props: JSON.parse(JSON.stringify(props)) };

        const postsFromDb = await posts.find({
            for: { $in: [user.data.id] },
            uid: params.id
        }).toArray();
        var availableDates = postsFromDb.reduce((acc, post) => {
            const date = new Date(post.date).toISOString().split("T")[0];
            if (acc[date]) {
                acc[date] += 1;
            } else {
                acc[date] = 1;
            }

            return acc;
        }, {});
        availableDates = Object.keys(availableDates)
            .sort((a, b) => new Date(b) - new Date(a))
            .reverse()
            .map((date) => ({ date, count: availableDates[date] }));
    }

    return {
        props: JSON.parse(JSON.stringify({
            ...props,
            posts: availableDates?.reverse()
        }))
    }
};