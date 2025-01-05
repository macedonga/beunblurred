import axios from "axios";
import dynamic from "next/dynamic";
import { Fragment, useEffect, useState } from "react";
import { getCookie, hasCookie, deleteCookie, setCookie } from "cookies-next";

import Link from "next/link";
import jszip from "jszip";
import { NextSeo } from "next-seo";
import checkAuth from "@/utils/checkAuth";
import { T, useTranslate } from "@tolgee/react";
import { requestAuthenticated } from "@/utils/requests";
import { Transition } from "@headlessui/react";

const PostComponent = dynamic(() => import("../components/PostComponent"), {
    loading: () => (
        <div
            className={`
                flex flex-col lg:gap-y-6 gap-y-4
                bg-white/5
                relative border-2 border-white/10
                rounded-lg lg:p-6 p-4 min-w-0
            `}
        >
            <div className="flex justify-center">
                <div className="w-8 h-8 border-2 border-white/50 rounded-full animate-spin" />
            </div>

            <p className="text-xl text-center mt-4">
                <T keyName={"loading"} />
            </p>
        </div>
    ),
    ssr: false,
});

export default function Memories(props) {
    const { t } = useTranslate();
    const [showZipProgress, setShowZipProgress] = useState(false);
    const [currentZippingImage, setCurrentZippingImage] = useState(1);
    const [Greeting, setGreeting] = useState(t("gm"));
    const [Data, setData] = useState(
        // really lazy way to fix the sorting issue lol
        (props?.feed || [])?.sort((a, b) => {
            return new Date(b.memoryDay) + new Date(a.memoryDay);
        })?.map((post) => ({
            ...post,
            posts: [
                post
            ],
            user: props?.user,
        }))
    );

    useEffect(() => {
        var today = new Date()
        var curHr = today.getHours()
        let greeting;

        if (curHr < 12) greeting = "gm";
        else if (curHr < 18) greeting = "ga";
        else if (curHr < 21) greeting = "ge";
        else greeting = "gn";

        setGreeting(greeting);
    }, []);

    const downloadMemoriesAsZip = async () => {
        setCurrentZippingImage(1);
        setShowZipProgress(true);

        let zipFolder = new jszip();

        for (const index in Data) {
            const Memory = Data[index];

            try {
                const primaryImage = await fetch("/_next/image?w=1920&q=100&url=" + Memory.primary.url);
                const primaryBuffer = await primaryImage.arrayBuffer();
                const primaryFileType = Memory.primary.url.split(".").pop() || "webp";
                const primaryFileName = `${Memory.memoryDay}-primary-${Memory.id}.${primaryFileType}`;
                zipFolder.file(primaryFileName, primaryBuffer);
            } catch (error) {
                console.error(`Error fetching primary image:`, error);
            }

            try {
                const secondaryImage = await fetch("/_next/image?w=1920&q=100&url=" + Memory.secondary.url);
                const secondaryBuffer = await secondaryImage.arrayBuffer();
                const secondaryFileType = Memory.secondary.url.split(".").pop() || "webp";
                const secondaryFileName = `${Memory.memoryDay}-secondary-${Memory.id}.${secondaryFileType}`;
                zipFolder.file(secondaryFileName, secondaryBuffer);
            } catch (error) {
                console.error(`Error fetching secondary image:`, error);
            }

            setCurrentZippingImage(Number(index) + 1);

            console.log(index + 1, Data.length);
        }

        try {
            const zipBlob = await zipFolder.generateAsync({ type: "blob" });
            const downloadLink = document.createElement("a");
            downloadLink.href = URL.createObjectURL(zipBlob);
            downloadLink.download = "memories.zip";
            downloadLink.click();
            URL.revokeObjectURL(downloadLink.href);
        } catch (error) {
            console.error("Error generating or downloading the ZIP file:", error);
        }

        setShowZipProgress(false);
    };

    return (<>
        <NextSeo title="Memories - Feed" />

        <Transition appear show={showZipProgress} as={Fragment}>
            <Transition.Child
                as={Fragment}
                enter="ease-out duration-100"
                enterFrom="bottom-0 opacity-0 lg:scale-95 translate-y-10 lg:translate-y-0 translate-x-0"
                enterTo="opacity-100 lg:scale-100 translate-y-0 translate-x-0"
                leave="ease-in duration-75"
                leaveFrom="opacity-100 lg:scale-100 translate-y-0 translate-x-0"
                leaveTo="opacity-0 lg:scale-95 translate-y-10 lg:translate-y-0 translate-x-0"
            >
                <div
                    className="z-[51] backdrop-blur inset-0 fixed flex items-center justify-center"
                >
                    <div
                        className={`
                            lg:max-w-lg max-w-none w-full z-[70] rounded-lg lg:mx-auto mx-4
                            border-2 border-white/10 bg-[#0d0d0d] shadow-xl p-6
                        `}
                    >
                        <h2 className={"m-0 text-center text-2xl font-bold"}>
                            <T keyName={"zipProgressTitle"} />
                        </h2>
                        <p className={"m-0 text-center opacity-75 text-sm mt-2"}>
                            <T keyName={"zipProgressSteps"} params={{ max: Data.length, current: currentZippingImage }} />
                        </p>

                        <div className="flex items-center mt-4">
                            <p className="text-white/70 text-sm mr-4">
                                {Math.ceil((currentZippingImage / Data.length) * 100)}%
                            </p>
                            <div className="w-full bg-white/10 h-2 rounded-lg">
                                <div
                                    className="bg-white/50 h-full rounded-lg"
                                    style={{
                                        width: `${(currentZippingImage / Data.length) * 100}%`
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </Transition.Child>
        </Transition>

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
                    {Data.length} <T keyName="userMemoriesSubtitle" />
                </p>
            </div>
        </div>

        <button
            className={`
                text-center py-2 px-4 w-full rounded-lg outline-none transition-colors bg-white/5 relative border-2 border-white/10
                disabled:opacity-50 disabled:cursor-not-allowed lg:mt-8 mt-4
            `}
            onClick={downloadMemoriesAsZip}
        >
            <T keyName={"downloadMemoriesAsZip"} />
        </button>

        <div
            className={"grid lg:gap-y-8 gap-y-4 lg:mt-8 mt-4"}
        >
            {
                Data?.map((friendPost, index) => (
                    <PostComponent
                        key={index}
                        data={friendPost}
                        locale={props.locale}
                        isMemory={true}
                    />
                ))
            }
        </div>
    </>)
}

export async function getServerSideProps({ req, res }) {
    let authCheck = await checkAuth(req, res);
    if (authCheck) return authCheck;

    let feed = (await (requestAuthenticated("feeds/memories-v1", req, res).then(r => r.data.data))).map(e => ({
        id: e.mainPostMemoryId,
        memoryDay: e.memoryDay,
        isLate: e.isLate,
        primary: e.mainPostPrimaryMedia,
        secondary: e.mainPostSecondaryMedia,
        thumbnail: e.mainPostThumbnail,
        momentId: e.momentId,
        numPostsForMoment: e.numPostsForMoment,
    }));

    for (const post of feed.filter(e => e.numPostsForMoment > 1)) {
        let posts = (await (requestAuthenticated("feeds/memories-v1/" + post.momentId, req, res).then(r => r.data.posts))).reverse();
        let i = feed.findIndex(e => e.id === post.id);
        feed.splice(i, 1, ...posts);
    }

    return {
        props: {
            feed: JSON.parse(JSON.stringify(feed)),
            user: JSON.parse(getCookie("user", { req, res }))
        }
    };
};