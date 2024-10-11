import { useEffect, useRef, useState } from "react";
import ExifReader from "exifreader";
import { format, register } from "timeago.js";
import * as TimeAgoLanguages from "timeago.js/lib/lang/";
import Link from "next/link";
import { useRouter } from "next/router";
import { T, useTranslate } from "@tolgee/react";
import cookieCutter from "cookie-cutter";
import Notification from "./Notification";
import { useSwipeable } from "react-swipeable";

import {
    ChevronLeftIcon,
    ChevronRightIcon,
    MusicalNoteIcon,
    PlusIcon,
    MapPinIcon,
    Bars3Icon,
    ArchiveBoxIcon,
} from "@heroicons/react/20/solid";
import Popup from "./Popup";
import BTSIcon from "@/assets/BTSIcon";
import Image from "next/image";

export default function PostComponent({ data, isDiscovery, isMemory, locale }) {
    const isClient = typeof window !== "undefined";

    const { t } = useTranslate();
    const router = useRouter();

    for (const lang in TimeAgoLanguages) {
        if (lang === "ja") register("jp", TimeAgoLanguages[lang]);
        else register(lang, TimeAgoLanguages[lang]);
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
                navigator.clipboard.writeText(isDiscovery ? PostData.photoURL : PostData.posts[PostRef.current].primary.url);
                alert("Copied main image link to clipboard.");
            },
        },
        {
            id: "copy-link-secondary",
            name: t("copySecondaryImage"),
            action: () => {
                navigator.clipboard.writeText(isDiscovery ? PostData.secondaryPhotoURL : PostData.posts[PostRef.current].secondary.url);
                alert("Copied secondary image link to clipboard.");
            }
        }
    ]);
    const [ViewBTS, setViewBTS] = useState(false);
    const [PostIndex, setPostIndex] = useState(0);
    const [ShowMain, setShowMain] = useState(true);
    const [IsAndroid, setIsAndroid] = useState(null);
    const [BlobUrlPrimary, setBlobUrlPrimary] = useState(new Array(PostData.posts.length).fill(null));
    const [ShowSecondary, setShowSecondary] = useState(true);
    const [ErrorData, setErrorData] = useState({ show: false });
    const [BlobUrlSecondary, setBlobUrlSecondary] = useState(new Array(PostData.posts.length).fill(null));
    const [ShowOptionsMenu, setShowOptionsMenu] = useState(false);
    const [LoadingOptionIndex, setLoadingOptionIndex] = useState([]);
    const [ShowRealmojisMenu, setShowRealmojisMenu] = useState(false);
    const [SelectedRealmojiIndex, setSelectedRealmojiIndex] = useState(0);
    const [LoadingPostingComment, setLoadingPostingComment] = useState(false);

    const handlers = useSwipeable({
        onSwipedLeft: () => {
            if (PostIndex < PostData.posts.length - 1) {
                setPostIndex(PostIndex + 1);
            }
        },
        onSwipedRight: () => {
            if (PostIndex > 0) {
                setPostIndex(PostIndex - 1);
            }
        },
        preventDefaultTouchmoveEvent: true,
        trackMouse: true,
    });

    const downloadImage = async (main) => {
        const url = main ? (isDiscovery ? PostData.photoURL : PostData.posts[PostRef.current].primary.url) : (isDiscovery ? PostData.secondaryPhotoURL : PostData.posts[PostRef.current].secondary.url);
        setLoadingOptionIndex(o => [
            ...o,
            main ? "main-download" : "secondary-download"
        ]);

        const date = new Date(isDiscovery ? PostData.creationDate._seconds * 1000 : PostData.posts[PostRef.current].takenAt);
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
        const fileName = `${PostData.user.username}-${formattedDate}-${main ? "main" : "secondary"}.webp`;

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

        const date = new Date(isDiscovery ? PostData.creationDate._seconds * 1000 : PostData.posts[PostRef.current].takenAt);
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
        const fileName = `${PostData.user.username}-${formattedDate}.webp`;

        const mainRes = await fetch("/_next/image?w=1920&q=100&url=" + (isDiscovery ? PostData.photoURL : PostData.posts[PostRef.current].primary.url));
        const secondaryRes = await fetch("/_next/image?w=1920&q=100&url=" + (isDiscovery ? PostData.secondaryPhotoURL : PostData.posts[PostRef.current].secondary.url));
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

        const date = new Date(isDiscovery ? PostData.creationDate._seconds * 1000 : PostData.posts[PostRef.current].takenAt);
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
        const fileName = `${PostData.user.username}-${formattedDate}-bts.mp4`;

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

    const checkIfPostedFromAndroid = async (blob) => {
        const arrayBuffer = await blob.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        try {
            const tags = await ExifReader.load(buffer, { expanded: true });
            return true;
        } catch {
            return false;
        }
    };

    const fetchImages = async (postIndex) => {
        try {
            const primaryResponse = await fetch("/_next/image?w=1920&q=75&url=" + (isDiscovery ? PostData.photoURL : PostData.posts[postIndex].primary.url), {
                method: "GET",
                mode: "cors",
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            });

            const blob = await primaryResponse.blob();
            const blobUrl = URL.createObjectURL(blob);

            setBlobUrlPrimary((o) => {
                let newO = [...o]
                newO[postIndex] = blobUrl;
                return newO;
            });
            // setIsAndroid(await checkIfPostedFromAndroid(blob));
        } catch (e) {
            setBlobUrlPrimary((o) => {
                let newO = [...o]
                newO[postIndex] = false;
                return newO;
            });
            console.error("Couldn't load primary image.", e);
        }

        try {
            const secondaryResponse = await fetch("/_next/image?w=1920&q=75&url=" + (isDiscovery ? PostData.secondaryPhotoURL : PostData.posts[postIndex].secondary.url), {
                method: "GET",
                mode: "cors",
                headers: {
                    'Access-Control-Allow-Origin': '*'
                }
            })

            const blob = await secondaryResponse.blob();
            const blobUrl = URL.createObjectURL(blob);

            setBlobUrlSecondary((o) => {
                let newO = [...o]
                newO[postIndex] = blobUrl;
                return newO;
            });
        } catch (e) {
            setBlobUrlSecondary((o) => {
                let newO = [...o]
                newO[postIndex] = false;
                return newO;
            });
            console.error("Couldn't load secondary image.", e);
        }
    };

    const fetchLocation = async (postIndex) => {
        if (isMemory) return;

        const url = new URL("https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode");
        url.searchParams.append("location", `
            ${isDiscovery ? PostData.location._longitude : PostData.posts[PostIndex].location.longitude},
            ${isDiscovery ? PostData.location._latitude : PostData.posts[PostIndex].location.latitude}
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
            if (!isDiscovery) newData.posts[postIndex].location.name = locationName;
            else newData.location.name = locationName;
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

    const sendComment = async (e) => {
        e.preventDefault();

        let newPostData = { ...PostData };
        if (!isDiscovery) {
            newPostData = PostData.posts[PostIndex];
        }

        const comment = e.target.comment.value;
        const user = JSON.parse(cookieCutter.get("user"));

        if (!comment)
            return setErrorData({
                show: true,
                message: "Please enter a comment."
            });

        try {
            setLoadingPostingComment(true);
            await fetch("/api/comment", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    postId: newPostData.id,
                    postUserId: PostData.user.id,
                    comment: comment
                })
            });
            setLoadingPostingComment(false);

            newPostData.comments.push({
                id: new Date().getTime(),
                user: {
                    username: user.username,
                },
                content: comment
            });

            setPostData((prev) => {
                let newData = { ...prev };
                if (!isDiscovery) newData.posts[PostIndex] = newPostData;
                else newData = newPostData;
                return newData;
            });

            e.target.comment.value = "";

        } catch (e) {
            setLoadingPostingComment(false);
            setErrorData({
                show: true,
                message: e.response?.data?.error || "An error occurred while trying to post the comment. Please try again later."
            });
            console.error("Error occured while commenting!", e);
        }
    };

    const loadData = async () => {
        if (isDiscovery) {
            fetchImages(0);
        } else {
            for (let i in PostData.posts) {
                await fetchImages(i);
            }
        }
    };

    useEffect(() => {
        loadData();
    }, [data]);

    if (!isClient) return null;

    return (<>
        <Notification
            type={"error"}
            message={ErrorData.message}
            show={ErrorData.show}
            timeout={3}
            exit={() => setErrorData(o => ({ ...o, show: false }))}
        />

        <Popup
            title={"postOptions"}
            titleParams={{ username: PostData.user.username }}
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

        <Popup
            title={"realmojisMenu"}
            description={"realmojisMenuDescription"}
            titleParams={{ username: PostData.user.username }}
            descriptionParams={{ count: (isDiscovery ? PostData : PostData.posts[PostIndex]).realMojis?.length }}
            show={ShowRealmojisMenu}
            onClose={() => setShowRealmojisMenu(false)}
        >
            <div className="grid gap-2">
                {
                    (() => {
                        let realmojiArray = (isDiscovery ? PostData : PostData.posts[PostIndex]).realMojis || [];

                        if (PostData.user.relationship?.commonFriends) {
                            realmojiArray = PostData.posts[PostIndex].realmojis.sample;
                        }

                        return (<>
                            <div className="grid place-content-center">
                                <div className="relative overflow-visible my-4">
                                    <Image
                                        src={isDiscovery ? realmojiArray[SelectedRealmojiIndex]?.uri : realmojiArray[SelectedRealmojiIndex]?.media?.url}
                                        alt={`${realmojiArray[SelectedRealmojiIndex]?.user?.username} realmoji's`}
                                        className="rounded-full border-2 border-white/20 aspect-square"
                                        width={192}
                                        height={192}
                                    />
                                    <span className="absolute text-5xl bottom-2 -right-4 select-none">
                                        {realmojiArray[SelectedRealmojiIndex]?.emoji}
                                    </span>
                                </div>

                                <Link href={`/u/${realmojiArray[SelectedRealmojiIndex]?.user?.id}`}>
                                    <p className="text-center text-white text-lg font-semibold">
                                        {realmojiArray[SelectedRealmojiIndex]?.user?.username}
                                    </p>
                                </Link>

                                <p className="text-center text-white/75 font-medium text-sm">
                                    <T keyName={"reacted"} />{" "}{format(realmojiArray[SelectedRealmojiIndex]?.postedAt, locale)}
                                </p>
                            </div>

                            <div className="relative overflow-hidden">
                                {
                                    realmojiArray.length > 4 && (
                                        <div className="lg:grid items-center absolute inset-0 hidden z-10 pointer-events-none">
                                            <button
                                                className="absolute h-full left-0 pr-2 bg-gradient-to-r from-[#0d0d0d] to-transparent pointer-events-auto"
                                                onClick={() => {
                                                    RealMojisContainer.current.scrollBy({
                                                        "left": -200,
                                                        "behavior": "smooth"
                                                    });
                                                }}
                                            >
                                                <ChevronLeftIcon className="h-6 w-6" />
                                            </button>
                                            <button
                                                className="absolute h-full right-0 pl-2 bg-gradient-to-l from-[#0d0d0d] to-transparent pointer-events-auto"
                                                onClick={() => {
                                                    RealMojisContainer.current.scrollBy({
                                                        "left": 200,
                                                        "behavior": "smooth"
                                                    });
                                                }}
                                            >
                                                <ChevronRightIcon className="h-6 w-6" />
                                            </button>
                                        </div>
                                    )
                                }

                                <div
                                    ref={RealMojisContainer}
                                    className={`
                                        flex mt-4 mb-2 overflow-x-auto scrollbar-hide
                                        ${realmojiArray.length > 4 ? "lg:px-8" : "justify-evenly"}
                                    `}
                                >
                                    {
                                        realmojiArray.map((realmoji, index) => (
                                            <div
                                                key={realmoji.id}
                                                className={`w-[72px] cursor-pointer ${index === 0 ? "mr-2" : "mx-2"}`}
                                                onClick={() => {
                                                    setSelectedRealmojiIndex(index);
                                                }}
                                            >
                                                <div className="relative overflow-visible w-[72px]">
                                                    <Image
                                                        src={(isDiscovery ? realmoji.uri : realmoji.media.url)}
                                                        alt={`${PostData.user.username} realmoji's`}
                                                        title={`Reacted ${format(realmoji.postedAt)}`}
                                                        className="rounded-full border-2 border-white/50 aspect-square"
                                                        width={72}
                                                        height={72}
                                                    />

                                                    <span className="absolute text-2xl -right-2 bottom-0">
                                                        {realmoji.emoji}
                                                    </span>
                                                </div>

                                                <div className={`border-2 ${index === SelectedRealmojiIndex ? "border-white/50" : "border-transparent"} rounded-lg w-1 h-1 mx-auto mt-2`} />
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        </>);
                    })()
                }
            </div>
        </Popup>

        <div
            suppressHydrationWarning={true}
            className={
                isMemory ? "relative" : `
                    flex flex-col lg:gap-y-6 gap-y-4
                    bg-white/5
                    relative border-2 border-white/10
                    rounded-lg lg:p-6 p-4 min-w-0 overflow-hidden
                `
            }
        >
            <canvas
                id="combined-render-canvas"
                className="hidden"
                ref={CanvasRef}
            />

            <div className={!isMemory ? "flex gap-x-4 items-center" : "hidden"}>
                <Link href={`/u/${PostData.user.id}`} className="flex-shrink-0 flex">
                    {
                        PostData.user.profilePicture?.url ?
                            <Image
                                src={PostData.user.profilePicture?.url}
                                alt={PostData.user.username}
                                className="w-14 h-14 border-black border-2 rounded-full"
                                width={56}
                                height={56}
                                loading="eager"
                            />
                            :
                            <div className="w-14 h-14 bg-white/5 relative rounded-full border-full border-black justify-center align-middle flex">
                                <div className="m-auto text-2xl uppercase font-bold">{PostData.user.username.slice(0, 1)}</div>
                            </div>
                    }
                </Link>

                <p className="text-sm leading-[1.175] my-auto">
                    <span className="font-semibold">{PostData.user.username}</span>
                    <br />
                    <span className="text-xs text-white/50">
                        {
                            PostData.posts[PostIndex].origin === "repost" ?
                                t("reposted")
                                : t("posted")
                        }{" "}{(isDiscovery ? PostData : PostData.posts[PostIndex]).isLate && t("late")}{" "}
                        {format(isDiscovery ? PostData.creationDate._seconds * 1000 : PostData.posts[PostIndex].takenAt, locale)}

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
                            (isDiscovery ? PostData : PostData.posts[PostIndex]).retakeCounter > 0 && <>
                                {" • "}
                                {(isDiscovery ? PostData : PostData.posts[PostIndex]).retakeCounter} {
                                    (isDiscovery ? PostData : PostData.posts[PostIndex]).retakeCounter !== 1 ?
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
                        {
                            data.archived && <>
                                {typeof IsAndroid === "boolean" ? " • " : <br />}
                                <T keyName={"archivedUPost"} />
                            </>
                        }
                    </span>
                </p>

                <button
                    className="ml-auto my-auto p-2 rounded-lg bg-white/5 border-2 border-white/10"
                    onClick={() => setShowOptionsMenu(true)}
                >
                    <Bars3Icon className="h-6 w-6" />
                </button>
            </div>

            {
                isMemory && (
                    <div className="absolute bottom-0 inset-x-0 z-50 p-8 bg-gradient-to-t from-black/75 to-transparent">
                        <p>
                            <span className="text-4xl font-black">
                                {new Date(PostData.memoryDay).toLocaleDateString(locale, {
                                    day: "numeric",
                                    month: "long",
                                })}
                            </span>
                            <br />
                            <span className="opacity-80 text-3xl font-bold">{new Date(PostData.memoryDay).getFullYear()}</span>
                        </p>
                    </div>
                )
            }
            {
                PostData.posts.length > 1 && (<>
                    <div className="absolute left-0 inset-y-0 w-4 bg-gradient-to-r from-black to-transparent z-50" />
                    <div className="absolute right-0 inset-y-0 w-4 bg-gradient-to-l from-black to-transparent z-50" />
                </>)
            }

            <div {...handlers} className="relative mx-auto w-full">
                {
                    !isDiscovery && PostData.posts[PostIndex].btsMedia && (<>
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

                <div
                    className="flex"
                    style={{ transform: `translateX(-${PostIndex * 100}%)`, transition: "transform 0.25s ease-in-out" }}
                >
                    {PostData.posts.map((p, i) => (
                        <div key={p.id} className="relative min-w-full aspect-[3/4]">
                            {
                                typeof (ShowMain ? BlobUrlPrimary[i] : BlobUrlSecondary[i]) === "string" && (
                                    <img
                                        // file deepcode ignore DOMXSS
                                        src={ShowMain ? BlobUrlPrimary[i] : BlobUrlSecondary[i]}
                                        alt={PostData.user.username}
                                        className="rounded-lg w-full h-auto border-2 border-black aspect-[3/4] bg-white/10"
                                        onClick={() => setShowSecondary(!ShowSecondary)}
                                    />
                                )
                            }
                            {
                                typeof (ShowMain ? BlobUrlPrimary[i] : BlobUrlSecondary[i]) === "boolean" && (
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
                                )
                            }
                            {
                                !["object", "string"].includes(typeof (ShowMain ? BlobUrlPrimary[i] : BlobUrlSecondary[i])) && (
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
                                typeof (ShowMain ? BlobUrlSecondary[i] : BlobUrlPrimary[i]) === "string" ? (
                                    <img
                                        src={ShowMain ? BlobUrlSecondary[i] : BlobUrlPrimary[i]}
                                        alt={PostData.user.username}
                                        className={`
                                            rounded-lg absolute top-4 left-4 w-[35%] h-auto border-2 border-black aspect-[3/4] bg-white/10
                                            ${!ShowSecondary ? "hidden" : "block"}
                                        `}
                                        onClick={() => setShowMain(!ShowMain)}
                                    />
                                ) : typeof (ShowMain ? BlobUrlSecondary[i] : BlobUrlPrimary[i]) === "boolean" ? (
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

                            {
                                ShowSecondary && (((isDiscovery ? PostData : PostData.posts[i]).realMojis?.length > 0)
                                    || (PostData.user.relationship?.commonFriends && PostData.posts[i].realmojis.sample.length > 0)) && (<>
                                        <div className="absolute bottom-4 left-4 flex cursor-pointer" onClick={() => setShowRealmojisMenu(true)}>
                                            {
                                                (
                                                    (isDiscovery ? PostData : PostData.posts[i]).realMojis ||
                                                    PostData.posts[i].realmojis.sample
                                                ).slice(0, 3)
                                                    .map((realmoji, index) => (
                                                        <div key={realmoji.id} className={index == 0 ? "" : "-ml-4"}>
                                                            <Image
                                                                src={(isDiscovery ? realmoji.uri : realmoji.media.url)}
                                                                alt={`${realmoji.user.username} realmoji's`}
                                                                title={`${t("reacted")} ${format(realmoji.postedAt, locale)}`}
                                                                className="rounded-full border-2 border-black aspect-square"
                                                                width={48}
                                                                height={48}
                                                            />
                                                        </div>
                                                    ))
                                            }

                                            {
                                                ((isDiscovery ? PostData : PostData.posts[i]).realMojis
                                                    || PostData.posts[i].realmojis.sample).length > 3 && (
                                                    <div className="w-12 h-12 rounded-full border-2 border-black bg-[#191919] flex items-center justify-center -ml-4">
                                                        <p className="text-white/75 text-xl">
                                                            +{(((isDiscovery ? PostData : PostData.posts[i]).realMojis || PostData.posts[i].realmojis.sample).length - 3)}
                                                        </p>
                                                    </div>
                                                )
                                            }
                                        </div>
                                    </>)
                            }
                        </div>
                    ))}
                </div>

                {
                    ShowSecondary && PostData.posts.length > 1 && (
                        <div className="absolute bottom-0 inset-x-0 flex justify-center gap-x-1 pb-4">
                            {
                                PostData.posts.map((_, index) => (
                                    <div
                                        key={index}
                                        className={`w-2 h-2 rounded-full ${PostIndex === index ? "bg-white" : "bg-white/50"}`}
                                    />
                                ))
                            }
                        </div>
                    )
                }

                {
                    !isDiscovery && (<>
                        <div
                            className={`
                                absolute right-2 inset-y-0
                                ${(!ShowSecondary || PostData.posts.length == 1) ? "hidden" : "lg:flex hidden"}
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
                                absolute left-2 inset-y-0
                                ${(!ShowSecondary || PostData.posts.length == 1) ? "hidden" : "lg:flex hidden"}
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
                    </>)
                }
            </div>

            {
                (isDiscovery ? PostData : PostData.posts[PostIndex]).music &&
                <div
                    className={`
                        bg-gradient-to-r from-[#FF0080] to-[#7928CA]
                        rounded-lg cursor-pointer border-2 border-black
                    `}
                    style={{
                        backgroundImage: `url(${(isDiscovery ? PostData : PostData.posts[PostIndex])?.music?.artwork})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                    onClick={() => window.open((isDiscovery ? PostData : PostData.posts[PostIndex])?.music?.openUrl, "_blank")}
                >
                    <div
                        className="bg-black/50 p-4 rounded backdrop-blur"
                    >
                        <p className="text-sm text-white text-center relative items-center flex justify-center">
                            <MusicalNoteIcon className="h-5 w-5 inline-flex" />
                            {" "}
                            <span className="font-medium flex-grow">
                                {(isDiscovery ? PostData : PostData.posts[PostIndex])?.music?.track}{" - "}
                                {(isDiscovery ? PostData : PostData.posts[PostIndex])?.music?.artist}
                            </span>
                        </p>
                    </div>
                </div>
            }

            {
                PostData.user.relationship?.commonFriends &&
                <div className="bg-white/5 rounded-lg divide-y-2 divide-white/10 flex flex-col">
                    <p className="px-4 py-2 font-medium opacity-75">
                        {PostData.user.relationship?.commonFriends.length} <T keyName="commonFriends" />
                    </p>
                    {
                        PostData.user.relationship?.commonFriends?.map((friend, index) => (
                            <Link
                                key={friend.id}
                                href={"/u/" + friend.id}
                            >
                                <div className="rounded-lg py-2 px-4 flex items-center">
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
            }

            {
                !isMemory && (isDiscovery ? PostData : PostData.posts[PostIndex]).location &&
                <a
                    href={`
                        https://www.google.com/maps/search/?api=1&query=
                        ${(isDiscovery ? PostData : PostData.posts[PostIndex]).location.latitude},
                        ${(isDiscovery ? PostData : PostData.posts[PostIndex]).location.longitude}
                    `}
                    target="_blank"
                    rel="noreferrer"
                >
                    <div className="bg-white/5 rounded-lg cursor-pointer p-4 relative items-center flex">
                        <MapPinIcon className="h-5 w-5 inline-flex" />
                        <p className="text-sm text-white text-center flex-grow">
                            {(isDiscovery ? PostData : PostData.posts[PostIndex]).location.name || "Open on Google Maps"}
                        </p>
                    </div>
                </a>
            }

            {
                !isMemory &&
                <div className="bg-white/5 rounded-lg">
                    <div className="py-2 px-4">
                        <p className="text-sm text-white">
                            <span className="font-semibold">{PostData.user.username}</span>{" "}
                            <span className={!(isDiscovery ? PostData : PostData.posts[PostIndex]).caption ? "italic opacity-80 font-light" : "not-italic"}>
                                <span dangerouslySetInnerHTML={{
                                    __html:
                                        ((isDiscovery ? PostData : PostData.posts[PostIndex]).caption || t("noCaption"))
                                            .replace(/@([^ ]+)/g, "<span style='font-weight:500;opacity:0.8;'>@$1</span>"
                                            )
                                }} />
                            </span>
                        </p>

                        {
                            (isDiscovery ? PostData : PostData.posts[PostIndex]).comments?.map(c => (
                                <p className="text-sm text-white ml-4" key={c.id}>
                                    <span className="font-semibold">{c.user?.username}</span>{" "}
                                    <span dangerouslySetInnerHTML={{ __html: c.content.replace(/@([^ ]+)/g, "<span style='font-weight:500;opacity:0.8;'>@$1</span>") }} />
                                </p>
                            ))
                        }
                    </div>

                    <form
                        onSubmit={sendComment}
                        className="bg-white/5 rounded-b-lg relative flex border-t-2 border-white/10 divide-x-2 divide-white/10"
                    >
                        <input
                            id="comment"
                            placeholder={t("commentPlaceholder")}
                            className={`
                                bg-transparent placeholder:text-white/50 text-sm py-2 px-4 w-full
                                outline-none focus:placeholder:text-white/75 transition-colors
                            `}
                        />
                        <button className={`px-4 text-sm min-w-max font-semibold${LoadingPostingComment ? " animate-pulse" : ""}`} type="submit" disabled={LoadingPostingComment}>
                            <T keyName={LoadingPostingComment ? "loading" : "comment"} />
                        </button>
                    </form>
                </div>
            }
        </div>
    </>);
}