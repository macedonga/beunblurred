import axios from "axios";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import { requestAuthenticated } from "@/utils/requests";
import { NextSeo } from "next-seo";
import Link from "next/link";
import { T, useTranslate } from "@tolgee/react";
import checkAuth from "@/utils/checkAuth";

const PostComponent = dynamic(() => import("../components/PostComponent"), {
    loading: () => <p>Loading...</p>,
    ssr: false,
});

export default function Feed(props) {
    console.log(props?.feed?.friendsPosts)
    const { t } = useTranslate();
    const [Greeting, setGreeting] = useState(t("gm"));
    const [ShouldShowDonationBox, setShouldShowDonationBox] = useState(false);
    const [ShowArchiverBox, setShowArchiverBox] = useState(false);
    const [Data, setData] = useState({
        ...props.feed,
        friendsPosts: props?.feed?.friendsPosts.reverse()
    });

    useEffect(() => {
        if (window) {
            setShouldShowDonationBox(!!!localStorage.getItem("donationDismissed"));
            setShowArchiverBox(!!!localStorage.getItem("archiverDismissed"));
        }

        var today = new Date()
        var curHr = today.getHours()
        let greeting;

        if (curHr < 12) greeting = "gm";
        else if (curHr < 18) greeting = "ga";
        else if (curHr < 21) greeting = "ge";
        else greeting = "gn";

        setGreeting(greeting);
    }, []);

    return (<>
        <NextSeo title="Friends - Feed" />

        {
            ShouldShowDonationBox && (
                <div className="rounded-lg bg-white/5 border-2 border-white/10 flex flex-col items-center lg:mb-8 mb-4">
                    <div className="p-4">
                        <p className="text-center text-xl font-semibold">
                            <T keyName="donationTitleFeed" />
                        </p>

                        <p className="text-center text-sm mt-2">
                            <T keyName="donationTitle" />
                        </p>
                    </div>
                    <div className="flex w-full divide-white/5 border-t-2 border-white/10 divide-x-2">
                        <Link
                            href="/donate"
                            className="bg-white/5 p-2 rounded-bl-md text-center w-full grid place-items-center text-sm font-semibold"
                        >
                            <T keyName="donateNow" />
                        </Link>
                        <button
                            onClick={() => {
                                localStorage.setItem("donationDismissed", "true");
                                setShouldShowDonationBox(false);
                            }}
                            className="bg-white/5 p-2 rounded-br-md text-center w-full grid place-items-center text-sm"
                        >
                            <T keyName="dontDonate" />
                        </button>
                    </div>
                </div>
            )
        }

        {
            ShowArchiverBox && (
                <div className="rounded-lg bg-white/5 border-2 border-white/10 flex flex-col items-center lg:mb-8 mb-4">
                    <div className="p-4">
                        <p className="text-center text-xl font-semibold">
                            <T keyName="archiverTitleFeed" />
                        </p>

                        <p className="text-center text-sm mt-2">
                            <T keyName="archiverTitleFeedSubtitle" />
                        </p>
                    </div>
                    <div className="flex w-full divide-white/5 border-t-2 border-white/10 divide-x-2">
                        <Link
                            href="/archiver"
                            className="bg-white/5 p-2 rounded-bl-md text-center w-full grid place-items-center text-sm font-semibold"
                        >
                            <T keyName="archiveSubscribeNow" />
                        </Link>
                        <button
                            onClick={() => {
                                localStorage.setItem("archiverDismissed", "true");
                                setShowArchiverBox(false);
                            }}
                            className="bg-white/5 p-2 rounded-br-md text-center w-full grid place-items-center text-sm"
                        >
                            <T keyName="dontDonate" />
                        </button>
                    </div>
                </div>
            )
        }

        <div
            className="relative p-4 rounded-lg bg-white/10"
            style={{
                backgroundImage: `url(/_next/image?url=${props?.user?.profilePicture?.url}&q=1&w=128)`,
                backgroundSize: "cover",
                backgroundPosition: "center",
            }}
        >
            <div className="backdrop-blur-3xl bg-black/25 absolute inset-0 rounded-lg z-[1]" />
            <div className="z-[2] relative">
                <h1 className="text-xl font-medium"><T keyName={Greeting} /> {props?.user?.fullname || props?.user?.username}!</h1>
                <p className="text-sm text-white/70">
                    {Data?.friendsPosts?.length} <T keyName="friendsPostedBereal" />
                </p>
            </div>
        </div>

        <div
            className={"grid lg:gap-y-8 gap-y-4 lg:mt-8 mt-4"}
        >
            {
                Data?.friendsPosts?.map((friendPost, index) => (
                    <PostComponent
                        key={index}
                        data={friendPost}
                        locale={props.locale}
                    />
                ))
            }
        </div>
    </>)
};

export async function getServerSideProps({ req, res }) {
    const authCheck = await checkAuth(req, res);
    if (authCheck) return authCheck;

    let props;
    if (hasCookie("testMode", { req, res })) {
        props = {
            feed: {
                friendsPosts: [{
                    "user": {
                        "id": "8737uCPnsYeJfQgKXNb3Z1DoYuR2",
                        "username": "testUser",
                        "profilePicture": null
                    },
                    "momentId": "8737uCPnsYeJfQgKXNb3Z1DoYuR2",
                    "region": "europe-west",
                    "moment": {
                        "id": "8737uCPnsYeJfQgKXNb3Z1DoYuR2",
                        "region": "europe-west"
                    },
                    "posts": [
                        {
                            "id": "8737uCPnsYeJfQgKXNb3Z1DoYuR2-U1Kg",
                            "primary": {
                                "url": "https://i.marco.win/XgzbOhrMmxOopuyj.webp",
                                "width": 1500,
                                "height": 2000
                            },
                            "secondary": {
                                "url": "https://i.marco.win/XgzbOhrMmxOopuyj.webp",
                                "width": 1500,
                                "height": 2000
                            },
                            "retakeCounter": 0,
                            "lateInSeconds": 9723,
                            "isLate": true,
                            "isMain": true,
                            "takenAt": "2023-09-08T10:26:36.967Z"
                        }
                    ]
                }]
            },
            user: JSON.parse(getCookie("user", { req, res }))
        };
    } else {
        props = {
            feed: await (requestAuthenticated("feeds/friends-v1", req, res).then(r => r.data)),
            user: JSON.parse(getCookie("user", { req, res }))
        };
    }

    return { props };
};