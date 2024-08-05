import axios from "axios";
import { format, register } from "timeago.js";
import * as TimeAgoLanguages from "timeago.js/lib/lang/";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import { NextSeo } from "next-seo";
import Link from "next/link";
import PostComponent from "@/components/PostComponent";
import { CheckBadgeIcon } from "@heroicons/react/20/solid";
import { T, useTranslate } from "@tolgee/react";
import { requestAuthenticated } from "@/utils/requests";
import checkAuth from "@/utils/checkAuth";
import Image from "next/image";

export default function User(props) {
    const { t } = useTranslate();

    for (const lang in TimeAgoLanguages) {
        register(lang, TimeAgoLanguages[lang]);
    }

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
                    props.user.relationship?.friendedAt && <>
                        <T keyName={"friended"} />: {format(props.user.relationship.friendedAt, props.locale)}<br />
                    </>
                }
            </p>
        </div>

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
            (props.user.relationship?.friendedAt || props.friends?.total) ? <>
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

        if (params.id == "me") {
            let friends = await requestAuthenticated("relationships/friends", req, res);
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
            let pm = await requestAuthenticated("feeds/memories-v1/pinned-memories/for-user/" + params.id, req, res);
            props = {
                pinnedMemories: pm?.data?.pinnedMemories || [],
                user: data?.data
            };
        }
    }

    return {
        props: JSON.parse(JSON.stringify(props))
    };
};