import { useEffect, useRef, useState } from "react";
import ExifReader from "exifreader";
import { format, register } from "timeago.js";
import * as TimeAgoLanguages from "timeago.js/lib/lang/";
import Link from "next/link";
import { useRouter } from "next/router";
import { T, useTranslate } from "@tolgee/react";

import {
    ChevronLeftIcon,
    ChevronRightIcon,
    MusicalNoteIcon,
    PlusIcon,
    MapPinIcon,
    Bars3Icon,
} from "@heroicons/react/20/solid";
import Popup from "./Popup";
import BTSIcon from "@/assets/BTSIcon";

export default function PostComponent({ data, locale, showFeedButton }) {
    const { t } = useTranslate();
    const router = useRouter();

    for (const lang in TimeAgoLanguages) {
        register(lang, TimeAgoLanguages[lang]);
    }

    const RealMojisContainer = useRef(null);
    const CanvasRef = useRef(null);
    const BTSVideoRef = useRef(null);
    const PostRef = useRef(0);

    const [PostData, setPostData] = useState({
        ...data,
        posts: data.posts.sort((a, b) => {
            return new Date(b.takenAt) - new Date(a.takenAt);
        })
    });
    const [ViewBTS, setViewBTS] = useState(false);
    const [PostIndex, setPostIndex] = useState(0);
    const [ShowMain, setShowMain] = useState(true);
    const [ShowSecondary, setShowSecondary] = useState(true);
    const [BlobUrlPrimary, setBlobUrlPrimary] = useState(null);
    const [BlobUrlSecondary, setBlobUrlSecondary] = useState(null);
    const [IsAndroid, setIsAndroid] = useState(null);
    const [ShowOptionsMenu, setShowOptionsMenu] = useState(false);
    const [PostOptions, setPostOptions] = useState([
        {
            id: "main-download",
            name: t("mainImageDownload"),
            action: () => downloadImage(true),
        },
        {
            id: "secondary-download",
            name: t("secondaryImageDownload"),
            action: () => downloadImage(false),
        },
        {
            id: "combined-download",
            name: t("combinedImageDownload"),
            action: () => downloadCombinedImage(),
        },
        {
            id: "bts-download",
            name: t("btsDownload"),
            action: () => downloadBTSVideo(),
        },
        {
            id: "copy-link-main",
            name: t("copyMainImage"),
            action: () => {
                navigator.clipboard.writeText(PostData.posts[PostRef.current].primary.url);
                alert("Copied main image link to clipboard.");
            },
        },
        {
            id: "copy-link-secondary",
            name: t("copySecondaryImage"),
            action: () => {
                navigator.clipboard.writeText(PostData.posts[PostRef.current].secondary.url);
                alert("Copied secondary image link to clipboard.");
            }
        }
    ]);
    const [LoadingOptionIndex, setLoadingOptionIndex] = useState([]);

    const downloadImage = async (main) => {
        const url = main ? PostData.posts[PostRef.current].primary.url : PostData.posts[PostRef.current].secondary.url;
        setLoadingOptionIndex(o => [
            ...o,
            main ? "main-download" : "secondary-download"
        ]);

        const date = new Date(PostData.posts[PostRef.current].takenAt);
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
        const fileName = `${PostData.from.username}-${formattedDate}-${main ? "main" : "secondary"}.webp`;

        const response = await fetch("/_next/image?w=1920&q=100&url=" + url);
        const blobImage = await response.blob();
        const href = URL.createObjectURL(blobImage);
        const anchorElement = document.createElement("a");
        anchorElement.href = href;
        anchorElement.download = fileName;
        document.body.appendChild(anchorElement);
        anchorElement.click();
        document.body.removeChild(anchorElement);
        window.URL.revokeObjectURL(href);

        setLoadingOptionIndex(o => o.filter(i => i !== (main ? "main-download" : "secondary-download")));
    };

    const downloadCombinedImage = async () => {
        setLoadingOptionIndex(o => [
            ...o,
            "combined-download"
        ]);

        const date = new Date(PostData.posts[PostRef.current].takenAt);
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
        const fileName = `${PostData.from.username}-${formattedDate}.webp`;

        const mainRes = await fetch("/_next/image?w=1920&q=100&url=" + (PostData.posts[PostRef.current].primary.url));
        const secondaryRes = await fetch("/_next/image?w=1920&q=100&url=" + (PostData.posts[PostRef.current].secondary.url));
        const mainBlob = await mainRes.blob();
        const secondaryBlob = await secondaryRes.blob();

        // Stolen and modified from: https://github.com/s-alad/toofake/blob/main/new/client/pages/memories/index.tsx#L206
        let primaryImage = await createImageBitmap(await mainBlob);
        let secondaryImage = await createImageBitmap(await secondaryBlob);

        const canvas = CanvasRef.current;
        canvas.width = primaryImage.width;
        canvas.height = primaryImage.height;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(primaryImage, 0, 0)
        let width = secondaryImage.width * 0.3;
        let height = secondaryImage.height * 0.3;
        let x = primaryImage.width * 0.025;
        let y = primaryImage.height * 0.02;
        let radius = 30;

        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.lineWidth = 10;
        ctx.stroke();
        ctx.clip();

        ctx.drawImage(secondaryImage, x, y, width, height);

        const href = canvas.toDataURL("image/webp");
        const anchorElement = document.createElement("a");
        anchorElement.href = href;
        anchorElement.download = fileName;
        document.body.appendChild(anchorElement);
        anchorElement.click();
        document.body.removeChild(anchorElement);
        window.URL.revokeObjectURL(href);

        setLoadingOptionIndex(o => o.filter(i => i !== "combined-download"));
    };

    const downloadBTSVideo = async () => {
        setLoadingOptionIndex(o => [
            ...o,
            "bts-download"
        ]);

        const date = new Date(PostData.posts[PostRef.current].takenAt);
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
        const fileName = `${PostData.from.username}-${formattedDate}-bts.mp4`;

        const response = await fetch("/api/cors?endpoint=" + PostData.posts[PostRef.current].btsMedia?.url);
        const blobImage = await response.blob();
        const href = URL.createObjectURL(blobImage);
        const anchorElement = document.createElement("a");
        anchorElement.href = href;
        anchorElement.download = fileName;
        document.body.appendChild(anchorElement);
        anchorElement.click();
        document.body.removeChild(anchorElement);
        window.URL.revokeObjectURL(href);

        setLoadingOptionIndex(o => o.filter(i => i !== "bts-download"));
    };

    const fetchImages = async (postIndex) => {
        setBlobUrlPrimary(null);
        setBlobUrlSecondary(null);

        fetch("/_next/image?w=1920&q=75&url=" + PostData.posts[PostIndex].primary.url, {
            method: "GET",
            mode: "cors",
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        }).catch((e) => {
            setBlobUrlPrimary(false);
            console.error("Couldn't load primary image.", e);
        }).then(res => res.blob()).then(async blob => {
            const blobUrl = URL.createObjectURL(blob);
            setBlobUrlPrimary(blobUrl);

            const arrayBuffer = await blob.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            try {
                const tags = await ExifReader.load(buffer, { expanded: true });
                setIsAndroid(true);
            } catch (error) {
                setIsAndroid(false);
            }
        }).catch((e) => {
            setBlobUrlPrimary(false);
            console.error("Something happened converting the blob to blobUrl.", e);
        });

        fetch("/_next/image?w=1920&q=75&url=" + PostData.posts[PostIndex].secondary.url, {
            method: "GET",
            mode: "cors",
            headers: {
                'Access-Control-Allow-Origin': '*'
            }
        }).catch((e) => {
            setBlobUrlSecondary(false);
            console.error("Couldn't load secondary image.", e);
        }).then(res => res.blob()).then(async blob => {
            const blobUrl = URL.createObjectURL(blob);
            setBlobUrlSecondary(blobUrl);
        }).catch((e) => {
            setBlobUrlSecondary(false);
            console.error("Something happened converting the blob to blobUrl.", e);
        });;
    };

    const fetchLocation = async (postIndex) => {
        const url = new URL("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode");
        url.searchParams.append("location", `
            ${PostData.posts[PostIndex].location.longitude},
            ${PostData.posts[PostIndex].location.latitude}
        `);
        url.searchParams.append("langCode", "us");
        url.searchParams.append("outSR", "");
        url.searchParams.append("forStorage", "false");
        url.searchParams.append("f", "pjson");

        const locationData = await fetch(url).then((res) => res.json()).catch((e) => {
            console.error("Couldn't fetch location data.", e);
        });

        if (!locationData) return;

        const locationName = locationData?.address?.Match_addr;

        setPostData((prev) => {
            const newData = { ...prev };
            newData.posts[postIndex].location.name = locationName;
            return newData;
        });
    };

    const showBTS = () => {
        setViewBTS(true);
        BTSVideoRef.current.currentTime = 0;
        BTSVideoRef.current.play();
    };

    const hideBTS = () => {
        setViewBTS(false);
        BTSVideoRef.current.pause();
        BTSVideoRef.current.currentTime = 0;
    };

    useEffect(() => {
        if (!RealMojisContainer.current) return;

        const onScroll = (e) => {
            e.preventDefault();

            RealMojisContainer.current.scrollBy({
                "left": e.deltaY < 0 ? -50 : 50,
            });
        };

        RealMojisContainer.current.addEventListener("wheel", onScroll);
        fetchImages(PostIndex);
    }, [RealMojisContainer]);

    useEffect(() => {
        PostRef.current = PostIndex;
        fetchImages(PostIndex);
        if (PostData.posts[PostIndex].location && PostData.posts[PostIndex].location.name) {
            fetchLocation(PostIndex);
        }
    }, [PostIndex]);

    return (<>
        <canvas
            id="combined-render-canvas"
            className="hidden"
            ref={CanvasRef}
        />

        <Popup
            title={"postOptions"}
            titleParams={{ username: PostData.from.username }}
            show={ShowOptionsMenu}
            onClose={() => {
                if (LoadingOptionIndex.length === 0)
                    setShowOptionsMenu(false);
            }}
            loadingDisabled={LoadingOptionIndex.length !== 0}
        >
            <div className="grid gap-2">
                {
                    (
                        !PostData.posts[PostIndex].btsMedia ?
                            PostOptions.filter(o => o.id !== "bts-download")
                            : PostOptions
                    ).map((option, index) => (
                        <button
                            key={index}
                            onClick={option.action}
                            disabled={LoadingOptionIndex.includes(option.id)}
                            className={`
                                text-center py-2 px-4 w-full rounded-lg outline-none transition-colors bg-white/5 relative border-2 border-white/10
                                disabled:opacity-50 disabled:cursor-not-allowed
                                ${LoadingOptionIndex === index ? "animate-pulse" : ""}
                            `}
                        >
                            {
                                LoadingOptionIndex.includes(option.id) ?
                                    t("loading")
                                    : option.name
                            }
                        </button>
                    ))
                }
            </div>
        </Popup>

        <div
            className={`
                    flex flex-col lg:gap-y-6 gap-y-4
                    bg-white/5
                    relative border-2 border-white/10
                    rounded-lg lg:p-6 p-4 min-w-0
                `}
        >
            <div className="flex">
                <Link href={`/u/${PostData.uid}`} className={"flex gap-x-4 items-center"}>
                    {
                        PostData.from.profilePicture ?
                            <img
                                src={PostData.from.profilePicture}
                                alt={PostData.from.username}
                                className="w-14 h-14 border-black border-2 rounded-full"
                            />
                            :
                            <div className="w-14 h-14 bg-white/5 relative rounded-full border-full border-black justify-center align-middle flex">
                                <div className="m-auto text-2xl uppercase font-bold">{PostData.from.username.slice(0, 1)}</div>
                            </div>
                    }

                    <p className="text-sm leading-[1.175] my-auto">
                        <span className="font-semibold">{PostData.from.username}</span>
                        <br />
                        <span className="text-xs text-white/50">
                            {
                                PostData.posts[PostIndex].origin === "repost" ?
                                    t("reposted")
                                    : t("posted")
                            }{" "}{PostData.posts[PostIndex].isLate && t("late")}{" "}
                            {format(PostData.posts[PostIndex].takenAt, locale)}

                            {
                                PostData.posts[PostIndex].origin === "repost" ?
                                    <>
                                        {" "}
                                        <a
                                            href={`/u/${PostData.posts[PostIndex].parentPostUserId}`}
                                            className="underline decoration-dashed hover:opacity-75 transition-all"
                                        >
                                            <T keyName={"from"} /> @{PostData.posts[PostIndex].parentPostUsername}
                                        </a>
                                    </>
                                    : ""
                            }
                            {
                                PostData.posts[PostIndex].retakeCounter > 0 && <>
                                    <br />
                                    {PostData.posts[PostIndex].retakeCounter} {
                                        PostData.posts[PostIndex].retakeCounter !== 1 ?
                                            <T keyName="retakes" />
                                            :
                                            <T keyName="retake" />
                                    }
                                </>
                            }
                            {
                                typeof IsAndroid === "boolean" && <>
                                    <br />
                                    {
                                        IsAndroid ?
                                            <T keyName="postedFromAndroid" />
                                            :
                                            <T keyName="postedFromiOS" />
                                    }
                                </>
                            }
                        </span>
                    </p>
                </Link>

                <button
                    className={"ml-auto my-auto p-2 rounded-lg bg-white/5 border-2 border-white/10"}
                    onClick={() => setShowOptionsMenu(true)}
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>
            </div>

            <div className="relative mx-auto w-full">
                {
                    PostData.posts[PostIndex].btsMedia && (<>
                        <button
                            className="flex items-center justify-center bg-black/50 backdrop-blur px-2 py-1 rounded-lg absolute top-4 right-4 z-40"
                            onClick={showBTS}
                        >
                            <BTSIcon className="w-6 h-6 inline-block mr-2" onClick={showBTS} />
                            <T keyName="viewBTS" />
                        </button>
                        <video
                            ref={BTSVideoRef}
                            controls={false}
                            autoPlay={false}
                            onEnded={hideBTS}
                            onClick={hideBTS}
                            className={`
                                rounded-lg w-full h-auto aspect-[3/4] bg-white/10 absolute z-50
                                ${ViewBTS ? "block" : "hidden"}
                            `}
                            preload="auto"
                        >
                            <source src={PostData.posts[PostIndex].btsMedia?.url} type="video/mp4" />
                            <T keyName="videoNotSupported" />
                        </video>
                    </>)
                }

                {
                    typeof (ShowMain ? BlobUrlPrimary : BlobUrlSecondary) === "string" ? (
                        <img
                            // file deepcode ignore DOMXSS
                            src={ShowMain ? BlobUrlPrimary : BlobUrlSecondary}
                            alt={PostData.from.username}
                            className="rounded-lg w-full h-auto border-2 border-black aspect-[3/4] bg-white/10"
                            onClick={() => setShowSecondary(!ShowSecondary)}
                        />
                    ) : typeof (ShowMain ? BlobUrlPrimary : BlobUrlSecondary) === "boolean" ? (
                        <div
                            className="rounded-lg w-full h-auto border-2 border-black aspect-[3/4] bg-white/5"
                            onClick={() => setShowSecondary(!ShowSecondary)}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-center text-sm opacity-80 max-w-[13em]">
                                    Couldn't load this image.
                                    <br />
                                    BeReal is probably having some issues.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div
                            className="rounded-lg w-full h-auto border-2 border-black aspect-[3/4] bg-white/10 animate-pulse"
                            onClick={() => setShowMain(!ShowMain)}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx={12}
                                        cy={12}
                                        r={10}
                                        stroke="currentColor"
                                        strokeWidth={4}
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                            </div>
                        </div>
                    )
                }

                {
                    typeof (ShowMain ? BlobUrlSecondary : BlobUrlPrimary) === "string" ? (
                        <img
                            src={ShowMain ? BlobUrlSecondary : BlobUrlPrimary}
                            alt={PostData.from.username}
                            className={`
                                rounded-lg absolute top-4 left-4 w-[35%] h-auto border-2 border-black aspect-[3/4] bg-white/10
                                ${!ShowSecondary ? "hidden" : "block"}
                            `}
                            onClick={() => setShowMain(!ShowMain)}
                        />
                    ) : typeof (ShowMain ? BlobUrlSecondary : BlobUrlPrimary) === "boolean" ? (
                        <div
                            className={`
                                rounded-lg absolute top-4 left-4 w-[35%] h-auto border-2 border-black aspect-[3/4] bg-[#191919]
                                ${!ShowSecondary ? "hidden" : "block"}
                            `}
                            onClick={() => setShowMain(!ShowMain)}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-center text-sm opacity-80">
                                    Couldn't load this image.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div
                            className={`
                                rounded-lg absolute top-4 left-4 w-[35%] h-auto border-2 border-black aspect-[3/4] bg-[#191919] animate-pulse
                                ${!ShowSecondary ? "hidden" : "block"}
                            `}
                            onClick={() => setShowMain(!ShowMain)}
                        >
                            <div className="absolute inset-0 flex items-center justify-center">
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx={12}
                                        cy={12}
                                        r={10}
                                        stroke="currentColor"
                                        strokeWidth={4}
                                    />
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    />
                                </svg>
                            </div>
                        </div>
                    )
                }

                <div
                    className={`
                        absolute right-2 inset-y-0 flex
                        ${(!ShowSecondary || PostData.posts.length == 1) ? "hidden" : "block"}
                    `}
                >
                    <button
                        className={`
                            m-auto bg-white rounded-lg py-4 px-1
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                        disabled={PostIndex === PostData.posts.length - 1}
                        onClick={() => setPostIndex(PostIndex + 1)}
                    >
                        <ChevronRightIcon className="w-6 h-6 text-black m-auto" />
                    </button>
                </div>

                <div
                    className={`
                        absolute left-2 inset-y-0 flex
                        ${(!ShowSecondary || PostData.posts.length == 1) ? "hidden" : "block"}
                    `}
                >
                    <button
                        className={`
                            m-auto bg-white rounded-lg py-4 px-1
                            disabled:opacity-50 disabled:cursor-not-allowed
                        `}
                        disabled={PostIndex === 0}
                        onClick={() => setPostIndex(PostIndex - 1)}
                    >
                        <ChevronLeftIcon className="w-6 h-6 text-black m-auto" />
                    </button>
                </div>
            </div>

            {
                PostData.posts[PostIndex].location &&
                <a
                    href={`
                        https://www.google.com/maps/search/?api=1&query=
                        ${PostData.posts[PostIndex].location.latitude},
                        ${PostData.posts[PostIndex].location.longitude}
                    `}
                    target="_blank"
                    rel="noreferrer"
                >
                    <div className="bg-white/5 rounded-lg cursor-pointer p-4 relative items-center flex">
                        <MapPinIcon className="h-5 w-5 inline-flex" />
                        <p className="text-sm text-white text-center flex-grow">
                            {PostData.posts[PostIndex].location.name || "Open on Google Maps"}
                        </p>
                    </div>
                </a>
            }

            {showFeedButton &&
                <Link
                    href={`/archiver/${PostData.uid}/feed?fromUserPage=1`}
                    as={`/archiver/${PostData.uid}/feed`}
                    className={`
                    px-4 py-2 bg-white/5 rounded-lg transition-all border-2 border-white/10
                    disabled:opacity-50 disabled:cursor-not-allowed outline-none w-full text-center
                `}
                >
                    <T keyName={"archiverViewAllUsersPost"} params={{ user: PostData.from.username }} />
                </Link>
            }

            {
                PostData.posts[PostIndex].caption &&
                <div className="bg-white/5 rounded-lg py-2 px-4">
                    <p className="text-sm text-white">
                        <span className="font-semibold">{PostData.from.username}</span>{" "}
                        <span className="italic opacity-80 font-light">
                            <span dangerouslySetInnerHTML={{
                                __html:
                                    (PostData.posts[PostIndex].caption)
                                        .replace(/@([^ ]+)/g, "<span style='font-weight:500;opacity:0.8;'>@$1</span>"
                                        )
                            }} />
                        </span>
                    </p>
                </div>
            }
        </div>
    </>);
}