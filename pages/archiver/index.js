import { useRouter } from "next/router";
import { NextSeo } from "next-seo";
import Image from "next/image";
import Link from "next/link";

import axios from "axios";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import { requestAuthenticated } from "@/utils/requests";
import { T, useTranslate } from "@tolgee/react";
import clientPromise from "@/utils/mongo";
import checkAuth from "@/utils/checkAuth";
import ArchiverPostComponent from "@/components/ArchiverPostComponent";
import Popup from "@/components/Popup";

import Stripe from "stripe";
import { AR } from "country-flag-icons/react/3x2";

export default function ArchiverMainPage({
    user,
    friends,
    feed,
    userData,
    archiverError,
    locale,
    includeYesterday
}) {
    const router = useRouter();
    const [ShouldShowUpdateCredsBox, setShouldShowUpdateCredsBox] = useState(archiverError);
    const [ShowCalendar, setShowCalendar] = useState(false);
    const [Loading, setLoading] = useState(false);
    const [ArchiverData, setArchiverData] = useState({
        ...userData,
        selectedDate: "today"
    });

    const toggleStatus = async () => {
        await axios.get("/api/archiver/toggle");
        setArchiverData({
            ...ArchiverData,
            active: !ArchiverData.active
        });
    };

    const fetchDate = async (date) => {
        setLoading(true);

        let getDate = date;

        if (date == "today")
            getDate = new Date().toISOString().split("T")[0];

        const res = await axios.get(`/api/archiver/date?date=${getDate}`);
        setArchiverData(o => ({
            ...o,
            selectedDate: date,
            posts: res.data.posts
        }));

        setLoading(false);
    };

    const updateCredentials = async () => {
        try {
            setLoading(true);
            await axios.get(`/api/archiver/updateCreds`);
            setShouldShowUpdateCredsBox(false);
            alert("Credentials updated succesfully!");
        } catch {
            alert("An error occured while updating credentials.");
        }
        setLoading(false);
    };

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
                        fetchDate("today");
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
                    <p className="text-sm opacity-75">{ArchiverData.archivedToday?.length} <T keyName={"posts"} /></p>
                </button>

                {
                    ArchiverData.availableDates.map((date, index) => (
                        <button
                            className={`
                                px-4 py-2 bg-white/5 rounded-lg transition-all border-2 border-white/10
                                disabled:opacity-50 disabled:cursor-not-allowed outline-none w-full
                            `}
                            onClick={() => {
                                fetchDate(date.date);
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
                ${ArchiverData.paid ? "" : "opacity-75 cursor-not-allowed"}
                px-4 py-2 bg-white/5 rounded-lg transition-all border-2 border-white/10
                disabled:opacity-50 disabled:cursor-not-allowed mt-4 outline-none w-full
            `}
            disabled={!ArchiverData.paid}
            onClick={toggleStatus}
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

        {
            ArchiverData.subscription ?
                <Link
                    href="/api/archiver/portal"
                >
                    <button
                        className={`
                            px-4 py-2 bg-white/5 rounded-lg transition-all border-2 border-white/10
                            disabled:opacity-50 disabled:cursor-not-allowed mt-4 outline-none w-full
                        `}
                    >
                        <p>
                            <T keyName="manageSubscription" />
                        </p>
                        <p className="text-sm opacity-75"><T keyName="manageSubscriptionSubtitles" /></p>
                    </button>
                </Link> :
                <Link
                    href="/api/archiver/subscribe"
                >
                    <button
                        className={`
                            px-4 py-2 bg-red-500/10 rounded-lg transition-all border-2 border-red-500/10
                            disabled:opacity-50 disabled:cursor-not-allowed mt-4 outline-none w-full
                        `}
                    >
                        <p><T keyName="archiverPaymentError" /></p>
                        <p className="text-sm opacity-75"><T keyName="archiverPaymentErrorSubtitle" /></p>
                    </button>
                </Link>
        }

        {ShouldShowUpdateCredsBox &&
            <button
                disabled={Loading}
                onClick={updateCredentials}
                className={`
                    px-4 py-2 bg-red-500/10 rounded-lg transition-all border-2 border-red-500/10
                    disabled:opacity-50 disabled:cursor-not-allowed mt-4 outline-none w-full
                `}
            >
                <p>
                    <T keyName={Loading ? "loading" : "fixLoginTitle"} />
                </p>
                <p className="text-sm opacity-75"><T keyName="fixLoginSubtitle" /></p>
            </button>
        }

        {
            Loading && <p className="text-center text-white lg:mt-8 mt-4">
                <T keyName="loading" />
            </p>
        }
        {
            !Loading && ((ArchiverData.selectedDate === "today") ?
                <div className="grid lg:grid-cols-2 gap-2 lg:mt-8 mt-4">
                    {friends?.map((friend, index) => {
                        let combined = [
                            ...userData.archivedToday,
                            ...userData.archivedYesterday
                        ];

                        if (feed?.find((post) => post.user.username == friend.username)) {
                            const posts = combined
                                .filter(p => p.id == friend.id);

                            var post = null;
                            if (posts.length > 1) {
                                let latestDate = new Date(Math.max(...posts.map(p => new Date(p.date)))).toISOString().split("T")[0];
                                post = posts.filter(p => {
                                    var d = new Date(p.date);
                                    return d.toISOString().split("T")[0] === latestDate;
                                })[0];
                            } else if (posts.length == 1) {
                                post = posts[0];
                            }
                        }

                        return (<>
                            <div
                                key={index}
                                className={!!!post ? "" : "cursor-pointer"}
                                onClick={() => {
                                    if (!ArchiverData.subscription && post) {
                                        alert("You haven't paid yet!\nClick on the button at the top of the page to go to the payment page.");
                                        return;
                                    }

                                    if (post) {
                                        router.push(`/archiver/${friend.id}/${new Date(post.date).toISOString().split("T")[0]}`);
                                    }
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
                                        ${post ?
                                                "border-green-500/10 bg-green-500/25" :
                                                feed?.find((post) => post.user.username === friend.username) ?
                                                    "border-red-500/10 bg-red-500/25" :
                                                    "border-yellow-500/10 bg-yellow-500/25"}
                                        w-[50%] flex justify-center items-center
                                    `}
                                    >
                                        <T keyName={post ? "archivedUPost" : "notArchivedUPost"} />
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
                                        <T keyName={feed?.find((post) => post.user.username == friend.username) ? "friendPosted" : "friendNotPosted"} />
                                    </p>
                                </div>

                                <p>
                                </p>
                            </div>
                        </>);
                    })}
                </div> : (
                    <div className="grid lg:gap-y-8 gap-y-4 lg:mt-8 mt-4">
                        {
                            ArchiverData.posts?.map((post, index) => (
                                <ArchiverPostComponent
                                    key={index}
                                    data={post}
                                    locale={locale}
                                    showFeedButton={true}
                                />
                            ))
                        }
                    </div>
                ))
        }

    </>)
};

export async function getServerSideProps({ req, res }) {
    // I do not understand what i did here, but it works...
    // I'll have to rewrite it, but since i have no way to get
    // a moment's data from its id this will do for now.

    const authCheck = await checkAuth(req, res);
    if (authCheck) return authCheck;

    if (process.env.NEXT_PUBLIC_NO_ARCHIVER) {
        return {
            redirect: {
                destination: "/feed",
                permanent: false
            }
        };
    }

    const friends = await requestAuthenticated("relationships/friends", req, res);
    const feed = await requestAuthenticated("feeds/friends-v1", req, res);
    const user = await requestAuthenticated("person/me", req, res);

    const db = (await clientPromise).db();
    const users = db.collection("users");
    const posts = db.collection("posts");

    var userFromDb = await users.findOne({ id: user.data.id });

    if (!userFromDb) {
        return {
            redirect: {
                destination: "/archiver/signup",
                permanent: false
            }
        }
    }

    const postsFromDb = await posts.find({ for: { $in: [user.data.id] } }).toArray();
    let availableDates = postsFromDb.reduce((acc, post) => {
        const date = new Date(post.date).toISOString().split("T")[0];
        if (acc[date]) {
            acc[date] += 1;
        } else {
            acc[date] = 1;
        }

        return acc;
    }, {})

    availableDates = Object.keys(availableDates)
        .sort((a, b) => new Date(b) - new Date(a))
        .reverse()
        .map((date) => ({ date, count: availableDates[date] }));
    availableDates = availableDates
        .filter((date) => date.date !== new Date().toISOString().split("T")[0])
        .reverse();

    let archivedToday = postsFromDb
        .filter((post) => {
            return new Date(post.date).toISOString().split("T")[0] === new Date().toISOString().split("T")[0];
        })
        .map((post) => ({ username: post.from.username, id: post.uid, moment: post.id, date: post.date.toString() }));

    let archivedYesterday = postsFromDb
        .filter((post) => {
            const yesterday = new Date();
            yesterday.setDate(new Date().getDate() - 1);
            return new Date(post.date).toISOString().split("T")[0] === yesterday.toISOString().split("T")[0];
        })
        .map((post) => ({ username: post.from.username, id: post.uid, moment: post.id, date: post.date.toString() }));

    delete userFromDb._id;

    const stripe = Stripe(process.env.STRIPE_API_KEY);
    const customer = await stripe.customers.retrieve(userFromDb.stripeCustomerId, {
        expand: ["subscriptions"],
    });

    if (customer.subscriptions?.data?.length == 0 || customer.subscriptions?.data[0]?.status !== "active") {
        await users.updateOne({ id: user.data.id }, { $set: { paid: false, active: false, showPaymentError: true } });

        userFromDb = {
            ...userFromDb,
            paid: false,
            active: false,
            showPaymentError: true
        };
    }

    let combined = [
        ...archivedToday,
        ...archivedYesterday
    ];
    archivedToday = [];

    for (const friend of friends.data.data) {
        if (feed.data.friendsPosts?.find((post) => post.user.username == friend.username)) {
            const posts = combined
                .filter(p => p.id == friend.id);

            var post = null;
            if (posts.length > 1) {
                let latestDate = new Date(Math.max(...posts.map(p => new Date(p.date)))).toISOString().split("T")[0];
                post = posts.filter(p => {
                    var d = new Date(p.date);
                    return d.toISOString().split("T")[0] === latestDate;
                })[0];
            } else if (posts.length == 1) {
                post = posts[0];
            }

            if (post)
                archivedToday.push(post);
        }
    }

    if (feed.data.friendsPosts.map(m => m.id).map(id => archivedToday.map(m => m.id).find(m => m.id === id) == id).includes(true)) {
        archivedToday = [
            ...archivedToday,
            ...archivedYesterday
        ];
        availableDates.shift();
    }

    return {
        props: {
            user: JSON.parse(getCookie("user", { req, res })),
            friends: friends.data.data,
            feed: feed.data.friendsPosts,
            userData: {
                ...userFromDb,
                availableDates,
                archivedToday,
                archivedYesterday,
                subscription: customer.subscriptions?.data?.length != 0 || customer.subscriptions?.data[0]?.status === "active"
            },
            includeYesterday: feed.data.friendsPosts.map(m => m.id).map(id => archivedToday.map(m => m.id).find(m => m.id === id) == id).includes(true),
            archiverError: !!userFromDb.shouldUpdateCredentials
        }
    };
};