import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import Image from "next/image";
import Link from "next/link";

import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import { requestAuthenticated } from "@/utils/requests";
import { T, useTranslate } from "@tolgee/react";
import checkAuth from "@/utils/checkAuth";
import Popup from "@/components/Popup";

export default function Archiver({
    user,
    friends,
    feed,
    userData,
    locale
}) {
    const router = useRouter();
    const [ShowCalendar, setShowCalendar] = useState(false);
    const [ArchiverData, setArchiverData] = useState({
        ...userData,
        selectedDate: "today"
    });

    return (<>
        <NextSeo title="Manage archiver" />

        <Popup
            title={"selectDate"}
            description={"selectDateDescription"}
            show={ShowCalendar}
            onClose={() => setShowCalendar(false)}
            containerClassName="max-h-[40vh] overflow-y-auto little-scrollbar"
        >
            <div className="grid gap-y-2">
                <button
                    className={`
                        px-4 py-2 bg-white/5 rounded-lg transition-all border-2 border-white/10
                        disabled:opacity-50 disabled:cursor-not-allowed outline-none w-full
                    `}
                    onClick={() => {
                        setArchiverData({
                            ...ArchiverData,
                            selectedDate: "today"
                        });
                        setShowCalendar(false);
                    }}
                >
                    <p>
                        <T keyName="archiverToday" />
                    </p>
                    <p className="text-sm opacity-75">{ArchiverData.archivedToday.length} <T keyName={"posts"} /></p>
                </button>

                {
                    ArchiverData.availableDates.map((date, index) => (
                        <button
                            className={`
                                px-4 py-2 bg-white/5 rounded-lg transition-all border-2 border-white/10
                                disabled:opacity-50 disabled:cursor-not-allowed outline-none w-full
                            `}
                            onClick={() => {
                                setArchiverData({
                                    ...ArchiverData,
                                    selectedDate: date.date
                                });
                                setShowCalendar(false);
                            }}
                        >
                            <p>
                                {new Date(date.date).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
                            </p>
                            <p className="text-sm opacity-75">{date.count} <T keyName={"posts"} /></p>
                        </button>
                    ))
                }
            </div>
        </Popup>

        <h1 className="text-3xl font-semibold text-center">
            <T keyName="archiverTitle" />
        </h1>
        <p className="text-center mt-2">
            <T keyName="archiverSubtitle" />
        </p>

        <button
            className={`
                px-4 py-2 bg-white/5 rounded-lg transition-all border-2 border-white/10
                disabled:opacity-50 disabled:cursor-not-allowed mt-4 outline-none w-full
            `}
            onClick={() => {
                setArchiverData({
                    ...ArchiverData,
                    active: !ArchiverData.active
                });
            }}
        >
            <div className="flex items-center justify-center">
                <span class="relative flex h-3 w-3 mr-4">
                    <span class={`animate-ping absolute inline-flex h-full w-full rounded-full ${ArchiverData.active ? "bg-green-400" : "bg-red-400"} opacity-75`}></span>
                    <span class={`relative inline-flex rounded-full h-3 w-3 ${ArchiverData.active ? "bg-green-500" : "bg-red-500"}`}></span>
                </span>

                <p className="text-xl font-medium"><T keyName={ArchiverData.active ? "statusActive" : "statusDisabled"} /></p>
            </div>

            <p className="text-sm opacity-75"><T keyName="toggleStatus" /></p>
        </button>

        <button
            className={`
                px-4 py-2 bg-white/5 rounded-lg transition-all border-2 border-white/10
                disabled:opacity-50 disabled:cursor-not-allowed mt-4 outline-none w-full
            `}
            onClick={() => {
                setShowCalendar(true);
            }}
        >
            <p>
                {
                    ArchiverData.selectedDate === "today" ?
                        <T keyName="archiverToday" /> :
                        new Date(ArchiverData.selectedDate).toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })
                }
            </p>
            <p className="text-sm opacity-75"><T keyName="archiverChangeDate" /></p>
        </button>

        <div
            className={"grid lg:grid-cols-2 gap-2 mt-4"}
        >
            {
                friends?.map((friend, index) => (
                    <div
                        key={index}
                        className="cursor-pointer"
                        onClick={() => {
                            router.push(`/archiver/${friend.id}`)
                        }}
                    >
                        <div className="py-2 px-4 flex items-center bg-white/5 border-white/10 border-2 rounded-t-lg">
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

                        <div className="flex">
                            <p
                                className={`
                                    border-l-2 border-b-2 rounded-bl-lg text-sm text-white/80
                                    ${(userData.archivedToday || []).includes(friend.username) ?
                                        "border-green-500/10 bg-green-500/25" :
                                        feed?.find((post) => post.user.username === friend.username) ?
                                            "border-red-500/10 bg-red-500/25" :
                                            "border-yellow-500/10 bg-yellow-500/25"}
                                    w-[50%] flex justify-center items-center
                                `}
                            >
                                <T keyName={(userData.archivedToday || []).includes(friend.username) ? "archivedUserPost" : "notArchivedUserPost"} />
                            </p>
                            <p
                                className={`
                                    border-r-2 border-b-2 rounded-br-lg text-sm text-white/80
                                    ${feed?.find((post) => post.user.username === friend.username) ?
                                        "border-green-500/10 bg-green-500/25" :
                                        "border-yellow-500/10 bg-yellow-500/25"}
                                    w-[50%] flex justify-center items-center
                                `}
                            >
                                <T keyName={feed?.find((post) => post.user.username === friend.username) ? "friendPosted" : "friendNotPosted"} />
                            </p>
                        </div>
                        <p>
                        </p>
                    </div>
                ))
            }
        </div>
    </>)
};

export async function getServerSideProps({ req, res }) {
    const authCheck = await checkAuth(req, res);
    if (authCheck) return authCheck;

    const friends = await requestAuthenticated("relationships/friends", req, res);
    const feed = await requestAuthenticated("feeds/friends-v1", req, res);

    // fake db call for dev purposes
    const userData = {
        active: true,
        archivedToday: ["giampyzz", "filippo.enzo", "lolu3"],
        availableDates: [
            {
                date: "2024-04-17",
                count: 4
            },
            {
                date: "2024-04-16",
                count: 2
            },
            {
                date: "2024-04-15",
                count: 1
            },
            {
                date: "2024-04-14",
                count: 3
            },
            {
                date: "2024-04-13",
                count: 8
            },
            {
                date: "2024-04-12",
                count: 5
            },
            {
                date: "2024-04-11",
                count: 6
            },
            {
                date: "2024-04-10",
                count: 7
            },
        ]
    };

    return {
        props: {
            user: JSON.parse(getCookie("user", { req, res })),
            friends: friends.data.data,
            feed: feed.data.friendsPosts,
            userData
        }
    };
};