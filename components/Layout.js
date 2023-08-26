import { Bars3Icon } from "@heroicons/react/20/solid";
import { Inter } from "next/font/google";
import Link from "next/link";
import { Menu, Transition } from '@headlessui/react'
import { Fragment, useEffect, useRef, useState } from 'react'

const inter = Inter({ subsets: ["latin"] });

export default function Layout({ children, user }) {
    const [Greeting, setGreeting] = useState("Good morning");
    useEffect(() => {
        var today = new Date()
        var curHr = today.getHours()
        let greeting;

        if (curHr < 12) greeting = "Good morning";
        else if (curHr < 18) greeting = "Good afternoon";
        else if (curHr < 21) greeting = "Good evening";
        else greeting = "Good night";

        setGreeting(greeting);
    }, []);

    const Links = [
        {
            name: "Home",
            href: "/feed"
        },
        {
            name: "Your profile",
            href: "/u/me"
        },
        {
            name: "Discovery feed",
            href: "/discovery"
        },
        {
            name: "Friends of friends feed",
            href: "/fof"
        },
        {
            name: "GitHub repository",
            href: "/github"
        },
        {
            name: "Log out",
            href: "/logout"
        }
    ];

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
                            <h1 className="text-4xl font-bold text-center">
                                BeUnblurred.
                            </h1>
                            <p className="text-center mt-1 opacity-75">
                                View your friends' BeReal without posting one.
                            </p>
                        </header>
                    </Link>
                ) : (
                    <header className="p-8 border-b-2 flex items-center justify-between lg:border-x-2 lg:rounded-b-lg border-white/10 bg-[#0d0d0d]">
                        <Menu as="div" className="inline-block text-left">
                            <Menu.Button className="p-2 rounded-lg bg-white/5 border-2 border-white/10">
                                <Bars3Icon className="h-6 w-6" />
                            </Menu.Button>
                            <Transition
                                as={Fragment}
                                enter="transition ease-out duration-100"
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <Menu.Items
                                    className={`
                                        origin-top-left fixed inset-x-0 mt-[4.25rem] z-50
                                        mx-auto lg:max-w-xl w-full
                                    `}
                                >
                                    <div className="lg:mx-0 mx-4 bg-[#0d0d0d] p-2 rounded-lg border-2 border-white/10">
                                        <h1 className="text-xl font-medium text-center my-4">👋 {Greeting} {user.fullname || user.username}!</h1>
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
                                                        >
                                                            {link.name}
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
                                enterFrom="transform opacity-0 scale-95"
                                enterTo="transform opacity-100 scale-100"
                                leave="transition ease-in duration-75"
                                leaveFrom="transform opacity-100 scale-100"
                                leaveTo="transform opacity-0 scale-95"
                            >
                                <div className="fixed inset-0 z-40 bg-black/50" />
                            </Transition>
                        </Menu>

                        <Link href="/feed">
                            <h1 className="lg:text-4xl text-2xl font-bold text-center mx-auto">
                                BeUnblurred.
                            </h1>
                        </Link>

                        <Link href="/u/me">
                            <img
                                src={user.profilePicture.url}
                                alt="Avatar"
                                className="rounded-lg h-12 w-12"
                            />
                        </Link>
                    </header>
                )
            }
            <main className="lg:px-0 px-4 py-8">
                {children}
            </main>

            <footer
                className={`
                    mt-auto lg:max-w-xl mx-auto w-full bg-[#0d0d0d]
                    py-8 lg:px-8 px-4 text-sm text-center lg:rounded-t-lg
                    border-t-2 lg:border-x-2 border-white/10 ${inter.className}
                `}
            >
                <p>
                    <b>This site is in no way affiliated with BeReal SAS.</b>
                    <br />
                    This is a school project made by{" "}
                    <a
                        href="https://marco.win"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline decoration-dashed hover:opacity-75 transition-all"
                    >
                        Marco Ceccon
                    </a>.
                </p>
            </footer>
        </div>
    </>);
}