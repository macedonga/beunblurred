import axios from "axios";
import { format } from "timeago.js";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import { NextSeo } from "next-seo";
import Link from "next/link";
import PostComponent from "@/components/PostComponent";
import { CheckBadgeIcon } from "@heroicons/react/20/solid";

export default function User(props) {
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
            {props.user.profilePicture?.url ?
                <img
                    className="w-48 h-48 rounded-lg mx-auto border-black border-2"
                    src={props.user.profilePicture?.url}
                    alt="Profile picture"
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
                        Bio: {props.user.biography}<br />
                    </>
                }
                {
                    props.user.location && <>
                        Location: {props.user.location}<br />
                    </>
                }
                {
                    props.user.createdAt && <>
                        Joined: {format(props.user.createdAt)}<br />
                    </>
                }
                {
                    props.user.birthdate && <>
                        Birthdate: {new Date(props.user.birthdate).toLocaleDateString()}<br />
                    </>
                }
                {
                    props.user.relationship?.friendedAt && <>
                        Friended: {format(props.user.relationship.friendedAt)}<br />
                    </>
                }
            </p>
        </div>

        {
            props.pinnedMemories && props.pinnedMemories.length > 0 && <>
                <div
                    className={`
                        flex flex-col
                        bg-white/5 mt-8
                        relative border-2 border-white/10
                        rounded-lg lg:p-6 p-4 min-w-0 gap-y-4
                    `}
                >
                    <h2 className="text-lg font-medium text-center">
                        {props.pinnedMemories.length} pinned memories
                    </h2>

                    {
                        props.pinnedMemories.map((memory, index) => (
                            <PostComponent
                                key={index}
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
            (props.user.relationship?.friendedAt || props.friends?.total) && <>
                <div
                    className={`
                        flex flex-col
                        bg-white/5 mt-8
                        relative border-2 border-white/10
                        rounded-lg lg:p-6 p-4 min-w-0
                    `}
                >
                    <h2 className="text-lg font-medium text-center">
                        {(props.user?.relationship?.commonFriends || props.friends)?.total} {props.user?.relationship?.commonFriends && "common"} friend{(props.user?.relationship?.commonFriends?.sample || props?.friends?.data)?.length !== 1 && "s"}
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
                                            <img
                                                className="w-12 h-12 rounded-lg border-black border-2 mr-4"
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
            </>
        }
    </>)
}

const fetchData = async (token, profileId) => {
    const reqOptions = {
        "headers": {
            "Authorization": `Bearer ${token}`,
            "bereal-app-version-code": "14549",
            "bereal-signature": "berealsignature",
            "bereal-device-id": "berealdeviceid",
        }
    };
    let url;
    if (profileId == "me") url = "https://mobile.bereal.com/api/person/me";
    else url = "https://mobile.bereal.com/api/person/profiles/" + profileId;
    const userResponse = await axios.get(url, reqOptions);

    let props = {};
    if (profileId == "me") {
        const friendsResponse = await axios.get("https://mobile.bereal.com/api/relationships/friends", reqOptions);

        props.friends = friendsResponse.data;
    } else {
        const pinnedMemoriesResponse = await axios.get("https://mobile.bereal.com/api/feeds/memories-v1/pinned-memories/for-user/" + profileId, reqOptions);

        props.pinnedMemories = pinnedMemoriesResponse?.data?.pinnedMemories || [];
    }
    return {
        ...props,
        user: userResponse.data
    };
};

export async function getServerSideProps({ req, res, params }) {
    const requiredCookies = [
        "token",
        "refreshToken",
        "tokenType",
        "tokenExpiration",
    ];
    const data = [];

    if (!hasCookie("testMode", { req, res }) && requiredCookies.map(n => hasCookie(n, { req, res })).includes(false)) {
        requiredCookies.forEach(n => deleteCookie(n, { req, res }))
        return {
            redirect: {
                destination: "/",
                permanent: false
            }
        };
    }

    requiredCookies.forEach(n => data[n] = getCookie(n, { req, res }));

    const setCookieOptions = {
        req,
        res,
        maxAge: 60 * 60 * 24 * 7 * 3600,
        path: "/",
    };

    let props;
    try {
        if (hasCookie("testMode", { req, res })) {
            props = {
                user: { "id": "8737uCPnsYeJfQgKXNb3Z1DoYuR2", "username": "testUser", "birthdate": "0", "fullname": "Test User", "profilePicture": { "url": "https://cdn.bereal.network/Photos/8737uCPnsYeJfQgKXNb3Z1DoYuR2/profile/Jsl-HFhp1J29qvNG1Xgjv.webp", "width": 1000, "height": 1000 }, "realmojis": [], "devices": [], "canDeletePost": true, "canPost": true, "canUpdateRegion": true, "phoneNumber": "+393511231234", "biography": "Dummy user", "location": "Test land, Test city", "countryCode": "IT", "region": "europe-west", "createdAt": "0", "isRealPeople": false, "userFreshness": "returning" },
            }
        } else props = await fetchData(data.token, params.id);
    } catch (e) {
        console.log(e);
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
                    "bereal-signature": "berealsignature",
                    "bereal-device-id": "berealdeviceid",
                }
            }
        );

        setCookie("token", refreshData.data.access_token, setCookieOptions);
        setCookie("refreshToken", refreshData.data.refresh_token, setCookieOptions);
        setCookie("tokenExpiration", Date.now() + (refreshData.data.expires_in * 1000), setCookieOptions);

        data.token = refreshData.data.access_token;
        data.refreshToken = refreshData.data.refresh_token;

        props = await fetchData(data.token, params.id);
    }

    if (params.id == "me") {
        setCookie("user", JSON.stringify(props.user), setCookieOptions);
    }

    return { props };
};