import { Fragment, useEffect, useRef, useState } from 'react'
import { Inter } from "next/font/google";
import Link from "next/link";

import { Menu, Transition } from "@headlessui/react";
import { Bars3Icon, ExclamationTriangleIcon } from "@heroicons/react/20/solid";
import { T, useTranslate } from "@tolgee/react";

import Popup from "./Popup";
import Image from 'next/image';

const inter = Inter({ subsets: ["latin-ext", "cyrillic-ext"] });

const PACKAGE_NAME = "co.beunblurred.macedonga";
const APPSTORE_LINK = "https://play.app.goo.gl/?link=https://play.google.com/store/apps/details?id=" + PACKAGE_NAME + "&ddl=1&pcampaignid=web_ddl_1";

export default function Layout({ children, user }) {
    const { t } = useTranslate();
    const BASE_LINKS = [
        {
            name: "home",
            href: "/feed"
        },
        {
            name: "yourProfile",
            href: "/u/me"
        },
        {
            name: "archiver",
            href: "/archiver"
        },
        {
            name: "memoriesFeed",
            href: "/memories"
        },
        {
            name: "search",
            href: "/search"
        },
        {
            name: "fofFeed",
            href: "/fof"
        },
        {
            name: "languageSelector",
            href: "/language"
        },
        {
            name: "donate",
            href: "/donate"
        },
        {
            name: "github",
            href: "/github"
        },
        {
            name: "logOut",
            href: "/logout"
        }
    ];

    const [Greeting, setGreeting] = useState("Good morning");
    const [ShowPlayStorePopup, setShowPlayStorePopup] = useState(false);
    const [isTWAInstalled, setIsTWAInstalled] = useState(false);
    const [IsAndroid, setIsAndroid] = useState(false);
    const [Links, setLinks] = useState(BASE_LINKS);

    useEffect(() => {
        var today = new Date()
        var curHr = today.getHours()
        let greeting;

        if (curHr < 12) greeting = "gm";
        else if (curHr < 18) greeting = "ga";
        else if (curHr < 21) greeting = "ge";
        else greeting = "gn";

        setGreeting(greeting);

        if (process.env.NEXT_PUBLIC_NO_ARCHIVER) {
            setLinks(BASE_LINKS.filter(link => link.name !== "archiver"));
        }

        if (window && window.navigator) {
            document.body.classList.add(inter.className);

            const android = !!navigator.userAgent.match(/Android/);
            const isInstalled =
                document.referrer.includes("android-app://" + PACKAGE_NAME) ||
                (
                    !!navigator.userAgent.match(/Android/) &&
                    !!window.matchMedia('(display-mode: standalone)').matches
                );
            // setIsAndroid(android);
            // setIsTWAInstalled(isInstalled);
            // setShowPlayStorePopup(localStorage.getItem("showPlayStorePopup") !== "false");

            setIsAndroid(false);
            setIsTWAInstalled(false);
            setShowPlayStorePopup(false);

            if (android && !isInstalled) {
                setLinks(o => {
                    const newLinks = [...o];
                    newLinks.splice(-1, 0, {
                        name: "installAppHeader",
                        href: APPSTORE_LINK,
                        external: true
                    });

                    return newLinks;
                });
            }
        }
    }, []);

    return (<>
        <div
            className={`
                flex flex-col overflow-auto w-full min-h-screen h-full
                lg:max-w-xl mx-auto ${inter.className}
            `}
        >
            {
                user.notLoggedIn ? (
                    <Link href="/feed">
                        <header className="py-8 border-b-2 px-4 lg:border-x-2 lg:rounded-b-lg border-white/10 bg-[#0d0d0d]">
                            <h1 className={`text-4xl font-bold text-center ${isTWAInstalled ? "font-comic-sans" : ""}`}>
                                BeUnblurred.
                            </h1>
                            <p className="text-center mt-1 opacity-75">
                                <T keyName="titleSubtitle" />
                            </p>
                        </header>
                    </Link>
                ) : (
                    <header className="p-8 border-b-2 flex items-center justify-between lg:border-x-2 lg:rounded-b-lg border-white/10 bg-[#0d0d0d] z-[70]">
                        <Menu as="div" className="inline-block text-left">
                            <Menu.Button className="p-2 rounded-lg bg-white/5 border-2 border-white/10">
                                <Bars3Icon className="h-6 w-6" />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 -translate-y-10"
                                enterTo="transform opacity-100 translate-y-0"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 translate-y-0"
                                leaveTo="transform opacity-0 -translate-y-10"
                            >
                                <Menu.Items
                                    className={`
                                        origin-top-left fixed inset-x-0 mt-[4.25rem] z-50
                                        mx-auto lg:max-w-xl w-full
                                    `}
                                >
                                    <div className="lg:mx-0 mx-4 bg-[#0d0d0d] p-2 rounded-lg border-2 border-white/10">
                                        <h1 className="text-xl font-medium text-center my-4">👋 <T keyName={Greeting} /> {user.fullname || user.username}!</h1>
                                        {
                                            Links.map((link, index) => (
                                                <Menu.Item key={index}>
                                                    {({ active }) => (
                                                        <Link
                                                            href={link.href}
                                                            className={`
                                                                ${active ? 'bg-[#1d1d1d] text-white/75' : 'text-white/50'}
                                                                group flex rounded-md items-center w-full px-2 py-2 text-sm
                                                                hover:bg-[#1d1d1d] hover:text-white/75
                                                                justify-center font-medium transition-all
                                                            `}
                                                            {
                                                            ...(link.external ? {
                                                                target: "_blank",
                                                                rel: "noopener noreferrer"
                                                            } : {})
                                                            }
                                                        >
                                                            <T keyName={link.name} />
                                                        </Link>
                                                    )}
                                                </Menu.Item>
                                            ))
                                        }
                                    </div>
                                </Menu.Items>
                            </Transition>

                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="opacity-0"
                                enterTo="opacity-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="opacity-100"
                                leaveTo="opacity-0"
                            >
                                <div className="fixed inset-0 z-40 bg-black/50" />
                            </Transition>
                        </Menu>

                        <Link href="/feed">
                            <h1 className={`lg:text-4xl text-2xl font-bold text-center mx-auto ${isTWAInstalled ? "font-comic-sans" : ""}`}>
                                BeUnblurred.
                            </h1>
                        </Link>

                        <Link href="/u/me">
                            {
                                user.profilePicture?.url ? (
                                    <Image
                                        src={user.profilePicture?.url}
                                        alt="Avatar"
                                        className="rounded-lg h-12 w-12"
                                        width={48}
                                        height={48}
                                        loading="eager"
                                    />
                                ) : (<>
                                    <div className="w-12 h-12 rounded-lg bg-white/5 relative border-full border-black justify-center align-middle flex mx-auto">
                                        <div className="m-auto text-2xl uppercase font-bold">{user?.username?.slice(0, 1)}</div>
                                    </div>
                                </>)
                            }
                        </Link>
                    </header>
                )
            }
            <main className="lg:px-0 px-4 py-8">
                {
                    isTWAInstalled && (
                        <div className="p-4 rounded-lg bg-red-500/70 text-white/80 flex flex-col items-center">
                            <ExclamationTriangleIcon className="h-12 w-12" />
                            <p className="text-center mt-2">
                                <T keyName="footerWarningApp" />
                            </p>
                        </div>
                    )
                }

                <div className={isTWAInstalled ? "mt-8" : ""}>
                    {children}
                </div>
            </main>

            <footer
                className={`
                    mt-auto lg:max-w-xl mx-auto w-full bg-[#0d0d0d]
                    py-8 lg:px-8 px-4 text-center lg:rounded-t-lg
                    border-t-2 lg:border-x-2 border-white/10 ${isTWAInstalled ? "font-comic-sans" : inter.className}
                `}
            >
                <p>
                    <b><T keyName={isTWAInstalled ? "footerWarningApp" : "footerWarningWebsite"} /></b>
                    <br />
                    {
                        isTWAInstalled ? (<>
                            <a
                                href="https://i.marco.win/beunblurred-privacy.txt"
                                className="link"
                            >
                                Privacy policy
                            </a>
                        </>) : (<>
                            <T keyName={"schoolProject"} />{" "}
                            <a
                                href="https://marco.win"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link"
                            >
                                Marco Ceccon
                            </a>.
                        </>)
                    }
                </p>
            </footer>
        </div>

        <Popup
            title={"fyiPopup"}
            description={"fyiPopupDesc"}
            show={ShowPlayStorePopup && !isTWAInstalled && IsAndroid}
            onClose={() => {
                setShowPlayStorePopup(false);
                localStorage.setItem("showPlayStorePopup", "false");
            }}
            closeButtonText={"dontCare"}
            dontCloseOnOverlayClick={true}
        >
            <button
                onClick={() => window.open(APPSTORE_LINK, "_blank")}
                className="text-center py-2 px-4 w-full rounded-lg outline-none transition-colors bg-white/5 relative border-2 border-white/10"
            >
                <T keyName="visitPlayStore" />
            </button>
        </Popup>
    </>);
}