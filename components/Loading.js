import { Transition } from "@headlessui/react";
import { Fragment, useEffect, useState } from "react";

export default function Loading({
    show
}) {
    const [isTWAInstalled, setIsTWAInstalled] = useState(null);

    useEffect(() => {
        if (window && window.navigator) {
            const isInstalled = document.referrer.includes("android-app://co.beunblurred.macedonga") ||
                (
                    !!navigator.userAgent.match(/Android/) &&
                    !!window.matchMedia('(display-mode: standalone)').matches
                );

            setIsTWAInstalled(isInstalled);
        }
    }, []);

    return (<>
        <Transition
            as={Fragment}
            show={show}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
        >
            <div
                className={`
                    fixed inset-0 bg-black z-[1030] grid
                    ${isTWAInstalled ? "font-comic-sans" : ""}
                `}
            >
                <div className="m-auto">
                    <h1 className="text-4xl font-bold animate-pulse duration-100">
                        BeUnblurred.
                    </h1>
                </div>
            </div>
        </Transition>
    </>);
};