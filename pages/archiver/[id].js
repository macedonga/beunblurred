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
    archivedUser,
    user,
    friends,
    feed,
    locale
}) {
    console.log(feed)
    const router = useRouter();
    const [ShowCalendar, setShowCalendar] = useState(false);
    const [ArchiverData, setArchiverData] = useState({
        ...archivedUser,
        selectedDate: "today"
    });

    return (<>
        <NextSeo title={`${archivedUser?.username}'s archived posts`} />

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
    </>)
};

export async function getServerSideProps({ req, res }) {
    const authCheck = await checkAuth(req, res);
    if (authCheck) return authCheck;

    const friends = await requestAuthenticated("relationships/friends", req, res);
    const feed = await requestAuthenticated("feeds/friends-v1", req, res);

    console.log(feed.data.friendsPosts)

    const archivedUserData = {
        username: "test",
        profilePicture: "https://via.placeholder.com/150",
        archivedToday: false,
        posts: [
            {
                date: new Date().toISOString(),
                data: [
                    {
                        id: 1,
                        primary: "https://via.placeholder.com/1500x2000",
                        secondary: "https://via.placeholder.com/1500x2000",
                        retakeCounter: 0,
                        lateInSeconds: 0,
                        visibility: "friends",
                        realMojis: [],
                        postedAt: new Date().toISOString()
                    }
                ]
            }
        ],
        availableDates: [
            {
                date: new Date().toISOString()
            }
        ]
    };

    return {
        props: {
            user: JSON.parse(getCookie("user", { req, res })),
            friends: friends.data.data,
            feed: feed.data.friendsPosts,
            archivedUser: archivedUserData
        }
    };
};