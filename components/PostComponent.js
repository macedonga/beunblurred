import { useEffect, useRef, useState } from "react";
import ExifReader from "exifreader";
import { format } from "timeago.js";
import Link from "next/link";

import {
    ChevronLeftIcon,
    ChevronRightIcon,
    MusicalNoteIcon,
    PlusIcon,
    MapPinIcon,
    Bars3Icon,
} from "@heroicons/react/20/solid";
import Popup from "./Popup";

export default function PostComponent({ data, isDiscovery, isMemory }) {
    const RealMojisContainer = useRef(null);
    const CanvasRef = useRef(null);
    const PostRef = useRef(0);

    const [PostData, setPostData] = useState({ ...data });
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
            name: "Download main image",
            action: () => downloadImage(true),
        },
        {
            id: "secondary-download",
            name: "Download secondary image",
            action: () => downloadImage(false),
        },
        {
            id: "combined-download",
            name: "Download combined image",
            action: () => downloadCombinedImage(),
        },
        {
            id: "copy-link-main",
            name: "Copy main image link",
            action: () => {
                navigator.clipboard.writeText(isDiscovery ? PostData.photoURL : PostData.posts[PostRef.current].primary.url);
                alert("Copied main image link to clipboard.");
            },
        },
        {
            id: "copy-link-secondary",
            name: "Copy secondary image link",
            action: () => {
                navigator.clipboard.writeText(isDiscovery ? PostData.secondaryPhotoURL : PostData.posts[PostRef.current].secondary.url);
                alert("Copied secondary image link to clipboard.");
            }
        }
    ]);
    const [LoadingOptionIndex, setLoadingOptionIndex] = useState([]);

    const downloadImage = async (main) => {
        const url = main ? (isDiscovery ? PostData.photoURL : PostData.posts[PostRef.current].primary.url) : (isDiscovery ? PostData.secondaryPhotoURL : PostData.posts[PostRef.current].secondary.url);
        setLoadingOptionIndex(o => [
            ...o,
            main ? "main-download" : "secondary-download"
        ]);

        const date = new Date(isDiscovery ? PostData.creationDate._seconds * 1000 : PostData.posts[PostRef.current].takenAt);
        const formattedDate = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}-${date.getMinutes()}`;
        const fileName = `${PostData.user.username}-${formattedDate}-${main ? "main" : "secondary"}.webp`;

        const response = await fetch("/api/cors?endpoint=" + url);
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

        const mainRes = await fetch("/api/cors?endpoint=" + (isDiscovery ? PostData.photoURL : PostData.posts[PostRef.current].primary.url));
        const secondaryRes = await fetch("/api/cors?endpoint=" + (isDiscovery ? PostData.secondaryPhotoURL : PostData.posts[PostRef.current].secondary.url));
        const mainBlob = await mainRes.blob();
        const secondaryBlob = await secondaryRes.blob();

        // Stole and modified from: https://github.com/s-alad/toofake/blob/main/new/client/pages/memories/index.tsx#L206
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

    const fetchImages = async (postIndex) => {
        setBlobUrlPrimary(null);
        setBlobUrlSecondary(null);

        fetch("/api/cors?endpoint=" + (isDiscovery ? PostData.photoURL : PostData.posts[PostIndex].primary.url), {
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

        fetch("/api/cors?endpoint=" + (isDiscovery ? PostData.secondaryPhotoURL : PostData.posts[PostIndex].secondary.url), {
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
        const locationName = locationData.address.Match_addr;

        setPostData((prev) => {
            const newData = { ...prev };
            if (!isDiscovery) newData.posts[postIndex].location.name = locationName;
            else newData.location.name = locationName;
            return newData;
        });
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
        if ((isDiscovery ? PostData : PostData.posts[PostIndex]).location && !(isDiscovery ? PostData : PostData.posts[PostIndex]).location.name) {
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
            title="Post options"
            show={ShowOptionsMenu}
            onClose={() => {
                if (LoadingOptionIndex.length === 0)
                    setShowOptionsMenu(false);
            }}
            loadingDisabled={LoadingOptionIndex.length !== 0}
        >
            <div className="grid gap-2">
                {
                    PostOptions.map((option, index) => (
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
                                    "Loading..."
                                    : option.name
                            }
                        </button>
                    ))
                }
            </div>
        </Popup>

        <div
            className={
                isMemory ? "relative" : `
                    flex flex-col lg:gap-y-6 gap-y-4
                    bg-white/5
                    relative border-2 border-white/10
                    rounded-lg lg:p-6 p-4 min-w-0
                `
            }
        >
            <div className="flex">
                <Link href={`/u/${PostData.user.id}`} className={!isMemory ? "flex gap-x-4 items-center" : "hidden"}>
                    {
                        PostData.user.profilePicture?.url ?
                            <img
                                src={PostData.user.profilePicture?.url}
                                alt={PostData.user.username}
                                className="w-14 h-14 border-black border-2 rounded-full"
                            />
                            :
                            <div className="w-14 h-14 bg-white/5 relative rounded-full border-full border-black justify-center align-middle flex">
                                <div className="m-auto text-2xl uppercase font-bold">{PostData.user.username.slice(0, 1)}</div>
                            </div>
                    }

                    <p className="text-sm leading-[1.175] my-auto">
                        <span className="font-semibold">{PostData.user.username}</span>
                        <br />
                        <span className="text-xs text-white/50">
                            Posted {(isDiscovery ? PostData : PostData.posts[PostIndex]).isLate && "late"} {format(isDiscovery ? PostData.creationDate._seconds * 1000 : PostData.posts[PostIndex].takenAt)}
                            {
                                (isDiscovery ? PostData : PostData.posts[PostIndex]).retakeCounter > 0 && <>
                                    <br />
                                    {(isDiscovery ? PostData : PostData.posts[PostIndex]).retakeCounter} retake{(isDiscovery ? PostData : PostData.posts[PostIndex]).retakeCounter !== 1 && "s"}
                                </>
                            }
                            {
                                typeof IsAndroid === "boolean" && <>
                                    <br />
                                    Posted from an {IsAndroid ? "Android" : "iOS"} device
                                </>
                            }
                        </span>
                    </p>
                </Link>

                <button
                    className={!isMemory ? "ml-auto my-auto p-2 rounded-lg bg-white/5 border-2 border-white/10" : "hidden"}
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
                                {new Date(PostData.memoryDay).toLocaleDateString("en-US", {
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

            <div className="relative mx-auto w-full">
                {
                    typeof (ShowMain ? BlobUrlPrimary : BlobUrlSecondary) === "string" ? (
                        <img
                            // file deepcode ignore DOMXSS
                            src={ShowMain ? BlobUrlPrimary : BlobUrlSecondary}
                            alt={PostData.user.username}
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
                            alt={PostData.user.username}
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

                {
                    !isDiscovery && (<>
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
                        backgroundImage: `url(${(isDiscovery ? PostData : PostData.posts[PostIndex]).music?.artwork})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                    onClick={() => {
                        const audio = document.getElementById(`audio-${(isDiscovery ? PostData : PostData.posts[PostIndex]).id}`);
                        if (audio.paused) {
                            audio.play();
                        } else {
                            audio.pause();
                        }
                    }}
                >
                    <audio
                        src={(isDiscovery ? PostData : PostData.posts[PostIndex]).music?.preview}
                        id={`audio-${(isDiscovery ? PostData : PostData.posts[PostIndex]).id}`}
                        loop
                    />
                    <div
                        className="bg-black/50 p-4 rounded backdrop-blur"
                    >
                        <p className="text-sm text-white text-center">
                            <MusicalNoteIcon className="h-4 w-4 mr-1 inline-flex" /> <span className="font-medium">{(isDiscovery ? PostData : PostData.posts[PostIndex]).music?.track}</span>
                        </p>
                    </div>
                </div>
            }

            {
                PostData.user.relationship?.commonFriends &&
                <div className="bg-white/5 rounded-lg divide-y-2 divide-white/10 flex flex-col">
                    <p className="px-4 py-2 font-medium opacity-75">
                        Common Friends
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
                (isDiscovery ? PostData : PostData.posts[PostIndex]).location &&
                <a
                    href={`
                        https://www.google.com/maps/search/?api=1&query=
                        ${(isDiscovery ? PostData : PostData.posts[PostIndex]).location.latitude},
                        ${(isDiscovery ? PostData : PostData.posts[PostIndex]).location.longitude}
                    `}
                    target="_blank"
                    rel="noreferrer"
                >
                    <div className="bg-white/5 rounded-lg cursor-pointer p-2 relative items-center">
                        <MapPinIcon className="h-5 w-5 inline-flex absolute" />
                        <p className="text-sm text-white text-center">
                            {(isDiscovery ? PostData : PostData.posts[PostIndex]).location.name || "Open on Google Maps"}
                        </p>
                    </div>
                </a>
            }

            {
                ((isDiscovery ? PostData : PostData.posts[PostIndex]).caption || (isDiscovery ? PostData : PostData.posts[PostIndex])?.comments?.length > 0) &&
                <div className="bg-white/5 rounded-lg py-2 px-4">
                    <p className="text-sm text-white">
                        <span className="font-semibold">{PostData.user.username}</span>{" "}
                        <span className={!(isDiscovery ? PostData : PostData.posts[PostIndex]).caption ? "italic opacity-80 font-light" : "not-italic"}>
                            <span dangerouslySetInnerHTML={{
                                __html:
                                    ((isDiscovery ? PostData : PostData.posts[PostIndex]).caption || "No caption")
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
            }

            {
                (isDiscovery ? PostData : PostData.posts[PostIndex]).realMojis?.length > 0 &&
                <div
                    ref={RealMojisContainer}
                    className="flex gap-x-6 overflow-x-auto scrollbar-hide max-w-max items-center"
                >
                    {
                        (isDiscovery ? PostData : PostData.posts[PostIndex]).realMojis.map((realmoji, index) => (
                            <div
                                key={index}
                                className="w-20"
                            >
                                <div className="relative overflow-visible w-20 h-20">
                                    <img
                                        src={(isDiscovery ? realmoji.uri : realmoji.media.url)}
                                        alt={`${PostData.user.username} realmoji's`}
                                        title={`Reacted ${format(realmoji.postedAt)}`}
                                        className="rounded-full border-2 border-white/50 aspect-square"
                                    />

                                    <span className="absolute text-4xl -bottom-2 -right-2">
                                        {realmoji.emoji}
                                    </span>
                                </div>

                                <p className="text-sm text-center mt-2 truncate text-ellipsis overflow-hidden whitespace-nowrap">
                                    {realmoji.user.username}
                                </p>
                            </div>
                        ))
                    }

                    {/* <div>
                        <div
                            className={`
                                w-20 h-20 rounded-full border-2 border-current aspect-square
                                flex items-center justify-center text-white/50 hover:text-white/75 transition-colors
                                cursor-pointer
                            `}
                        >
                            <PlusIcon className="w-8 h-8 text-current" />
                        </div>
                        <p className="text-sm font-medium text-center mt-2 break-words text-white/75">
                            React
                        </p>
                    </div> */}
                </div>
            }
        </div>
    </>);
}